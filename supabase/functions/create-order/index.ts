// POST /create-order
// Crée une commande marketplace (panier → commande) et ouvre le paiement
// FedaPay. Le panier reste géré côté client (Zustand / MMKV) ; cette
// fonction ne fait que valider et persister la commande finale.
//
// Body:
// {
//   items: [{ productId: string, qty: number, color?: string }],
//   addressId?: string,
//   delivery?: { firstName, lastName, phone, ville, quartier, indication? },
//   callbackUrl: string   // deep link / URL de retour après paiement
// }

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { adminClient, parseJson, requireUser } from "../_shared/supabase.ts";
import { createFedaPayCheckout } from "../_shared/fedapay.ts";

interface CartItem {
  productId: string;
  qty: number;
  color?: string;
}

interface Body {
  items: CartItem[];
  addressId?: string;
  delivery?: {
    firstName: string;
    lastName: string;
    phone: string;
    ville: string;
    quartier: string;
    indication?: string;
  };
  callbackUrl: string;
}

const SHIPPING_FLAT_FEE = 5000;
const GARANTIE_RATE = 0.015;

interface ProductRow {
  id: string;
  name: string;
  price: number;
  stock: number;
  is_active: boolean;
  artisan_id: string | null;
}

interface ProductImageRow {
  product_id: string;
  url: string;
}

Deno.serve(
  withErrorHandling(async (req) => {
    const { user, supabase } = await requireUser(req);
    const body = await parseJson<Body>(req);

    if (!body.items?.length) throw new HttpError(400, "Le panier est vide");
    if (!body.addressId && !body.delivery) {
      throw new HttpError(400, "addressId ou delivery requis");
    }

    const admin = adminClient();

    // 1. Résoudre les produits (prix/stock côté serveur — jamais celui envoyé par le client)
    const productIds = [...new Set(body.items.map((i) => i.productId))];
    const { data: products, error: prodErr } = await admin
      .from("products")
      .select("id, name, price, stock, is_active, artisan_id")
      .in("id", productIds)
      .returns<ProductRow[]>();
    if (prodErr) throw new HttpError(500, prodErr.message);

    // Image de couverture par produit (1ère par sort_order) — requête séparée
    // car product_images est en 1-N, un simple join renverrait un tableau.
    const { data: images } = await admin
      .from("product_images")
      .select("product_id, url")
      .in("product_id", productIds)
      .order("sort_order", { ascending: true })
      .returns<ProductImageRow[]>();
    const coverImageByProduct = new Map<string, string>();
    for (const img of images ?? []) {
      if (!coverImageByProduct.has(img.product_id)) {
        coverImageByProduct.set(img.product_id, img.url);
      }
    }

    const byId = new Map<string, ProductRow>(
      (products ?? []).map((p: ProductRow) => [p.id, p]),
    );
    let subtotal = 0;
    const orderItemsPayload: Record<string, unknown>[] = [];

    for (const item of body.items) {
      const product = byId.get(item.productId);
      if (!product || !product.is_active) {
        throw new HttpError(400, `Produit indisponible : ${item.productId}`);
      }
      if (item.qty < 1) {
        throw new HttpError(400, `Quantité invalide pour ${product.name}`);
      }
      if (product.stock < item.qty) {
        throw new HttpError(400, `Stock insuffisant pour ${product.name}`);
      }
      subtotal += product.price * item.qty;
      orderItemsPayload.push({
        product_id: product.id,
        artisan_id: product.artisan_id,
        name: product.name,
        price: product.price,
        qty: item.qty,
        color: item.color ?? null,
        image: coverImageByProduct.get(product.id) ?? null,
      });
    }

    const shipping = SHIPPING_FLAT_FEE;
    const garantie = Math.round(subtotal * GARANTIE_RATE);
    const total = subtotal + shipping + garantie;

    // 1bis. Réserver le stock : un seul aller-retour, tout-ou-rien (voir
    // reserve_stock dans schema.sql). Si un article manque, la fonction SQL
    // annule elle-même tous les décréments déjà faits — pas de compensation
    // manuelle à orchestrer ici pour CE cas précis.
    const stockPayload = body.items.map((i) => ({ productId: i.productId, qty: i.qty }));
    const { error: reserveErr } = await admin.rpc("reserve_stock", { items: stockPayload });
    if (reserveErr) {
      const match = reserveErr.message.match(/INSUFFICIENT_STOCK:(.+)/);
      throw new HttpError(409, match ? `Stock insuffisant pour ${match[1]}` : "Stock insuffisant");
    }

    // À partir d'ici le stock est réservé pour de bon : toute erreur plus
    // bas doit le restituer avant de remonter, sinon il reste bloqué
    // indéfiniment. release_stock() est idempotent à l'appel unique ; le
    // flag évite de le lancer deux fois si deux erreurs s'enchaînent.
    let stockReleased = false;
    const releaseStock = async () => {
      if (stockReleased) return;
      stockReleased = true;
      const { error } = await admin.rpc("release_stock", { items: stockPayload });
      if (error) {
        console.error(
          "[create-order] release_stock a échoué — stock à corriger manuellement pour",
          stockPayload,
          error.message,
        );
      }
    };

    try {
      // 2. Résoudre l'adresse de livraison (snapshot sur la commande)
      let delivery = body.delivery;
      if (body.addressId) {
        const { data: addr, error: addrErr } = await supabase
          .from("addresses")
          .select("*")
          .eq("id", body.addressId)
          .single();
        if (addrErr || !addr) throw new HttpError(400, "Adresse introuvable");
        delivery = {
          firstName: addr.first_name,
          lastName: addr.last_name,
          phone: addr.phone,
          ville: addr.ville,
          quartier: addr.quartier,
          indication: addr.indication,
        };
      }
      if (!delivery) throw new HttpError(400, "Adresse de livraison manquante");

      // 3. Créer la commande (status pending — bascule à "payé" par le webhook FedaPay)
      const { data: order, error: orderErr } = await admin
        .from("orders")
        .insert({
          user_id: user.id,
          type: "marketplace",
          status: "pending",
          subtotal,
          shipping,
          garantie,
          total,
          address_id: body.addressId ?? null,
          delivery_first_name: delivery.firstName,
          delivery_last_name: delivery.lastName,
          delivery_phone: delivery.phone,
          delivery_ville: delivery.ville,
          delivery_quartier: delivery.quartier,
          delivery_indication: delivery.indication ?? null,
        })
        .select()
        .single();
      if (orderErr) throw new HttpError(500, orderErr.message);

      await admin.from("order_items").insert(
        orderItemsPayload.map((it) => ({ ...it, order_id: order.id })),
      );

      await admin.from("order_timeline").insert([
        { order_id: order.id, label: "Commande créée", done: true, sort_order: 0, happened_at: new Date().toISOString() },
        { order_id: order.id, label: "Paiement en attente", done: false, sort_order: 1 },
        { order_id: order.id, label: "Préparation de l'expédition", done: false, sort_order: 2 },
        { order_id: order.id, label: "Expédié", done: false, sort_order: 3 },
        { order_id: order.id, label: "Livré", done: false, sort_order: 4 },
      ]);

      // 4. Ouvrir le paiement FedaPay. Si cet appel échoue, la commande reste
      // en base (statut "pending", traçable) mais le stock est restitué : le
      // client peut réessayer sans avoir bloqué l'article pour les autres.
      try {
        const { transactionId, checkoutUrl } = await createFedaPayCheckout({
          amount: total,
          description: `Commande Dedco ${order.display_id}`,
          customerFirstName: delivery.firstName,
          customerLastName: delivery.lastName,
          customerPhone: delivery.phone,
          callbackUrl: body.callbackUrl,
          metadata: { kind: "order", orderId: order.id, userId: user.id },
        });
        await admin.from("orders").update({ payment_ref: transactionId }).eq("id", order.id);
        return json({ order, checkoutUrl }, 201);
      } catch (fedaErr) {
        await releaseStock();
        console.error("[create-order] FedaPay checkout failed:", fedaErr);
        throw new HttpError(502, "Impossible d'initier le paiement — réessayez.");
      }
    } catch (err) {
      // Erreur avant l'ouverture FedaPay (ex: adresse invalide, insertion
      // commande échouée) : le stock n'a pas encore été restitué.
      await releaseStock();
      throw err;
    }
  }),
);
