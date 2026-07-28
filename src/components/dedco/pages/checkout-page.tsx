"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDedcoStore } from "@/lib/store";
import { formatFCFA, getArtisan } from "@/lib/dedco-data";
import {
  MapPin,
  CreditCard,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  Phone,
  User,
  Navigation,
  MessageSquare,
  Check,
  Wallet,
  Smartphone,
} from "lucide-react";
import { PhoneInput } from "@/components/dedco/phone-input";

type PaymentMethod = "mobile_money" | "mtn" | "moov";

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    id: "mobile_money",
    label: "Mobile Money",
    desc: "MTN & Moov via Mobile Money",
    icon: <Wallet size={24} />,
    color: "var(--amber)",
  },
  {
    id: "mtn",
    label: "MTN Mobile Money",
    desc: "Paiement direct MTN",
    icon: <Smartphone size={24} />,
    color: "#FFC300",
  },
  {
    id: "moov",
    label: "Moov Money",
    desc: "Paiement direct Moov",
    icon: <Smartphone size={24} />,
    color: "#009BDB",
  },
];

const STEPS = [
  { id: 1, label: "Livraison", icon: <MapPin size={16} /> },
  { id: 2, label: "Paiement", icon: <CreditCard size={16} /> },
  { id: 3, label: "Récapitulatif", icon: <ClipboardList size={16} /> },
];

export function CheckoutPage() {
  const cart = useDedcoStore((s) => s.cart);
  const navigate = useDedcoStore((s) => s.navigate);
  const placeOrder = useDedcoStore((s) => s.placeOrder);
  const [step, setStep] = useState(1);

  // Address fields
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [quartier, setQuartier] = useState("");
  const [ville, setVille] = useState("");
  const [indication, setIndication] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mobile_money");

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = cart.length > 0 ? 5000 : 0;
  const total = subtotal + shipping;

  const [direction, setDirection] = useState(1);

  const goNext = () => {
    setDirection(1);
    if (step < 3) setStep(step + 1);
  };
  const goPrev = () => {
    setDirection(-1);
    if (step > 1) setStep(step - 1);
  };

  const handlePay = () => {
    if (cart.length === 0) return;
    // ── Sauvegarde réelle de la commande dans le store ──
    // Avant : on générait juste un orderId sans rien persister.
    // Maintenant : placeOrder crée un Order complet (items, livraison,
    // paiement, timeline) qui sera lisible par order-confirmation,
    // order-tracking et order-history.
    const items = cart.map((c) => {
      const artisan = getArtisan(c.artisanId);
      return {
        productId: c.id,
        name: c.name,
        artisanId: c.artisanId,
        artisanName: artisan?.name ?? "Artisan Dedco",
        price: c.price,
        qty: c.qty,
        color: c.selectedColor,
        image: c.images[0] ?? "",
        dimensions: c.dimensions,
      };
    });
    const orderId = placeOrder({
      items,
      delivery: {
        firstName,
        lastName,
        phone,
        ville,
        quartier,
        indication,
      },
      paymentMethod: PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label ?? "Mobile Money",
      type: "marketplace",
    });
    navigate({ page: "payment", orderId });
  };

  const canProceed = () => {
    if (step === 1) return lastName && firstName && phone && quartier && ville;
    if (step === 2) return true;
    return true;
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 30 : -30, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -30 : 30, opacity: 0 }),
  };

  return (
    <div className="px-4 py-6 md:py-10 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Header */}
        <h1 className="font-display text-2xl md:text-3xl font-semibold mb-2" style={{ color: "var(--text-1)" }}>
          Commande
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-3)" }}>
          {cart.length} {cart.length === 1 ? "article" : "articles"} dans votre panier
        </p>

        {/* Progress bar */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <button
                onClick={() => {
                  if (s.id < step) {
                    setDirection(-1);
                    setStep(s.id);
                  }
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
                  style={{
                    background: step >= s.id ? "var(--amber)" : "var(--bg-warm)",
                    color: step >= s.id ? "#fff" : "var(--text-3)",
                  }}
                >
                  {step > s.id ? <Check size={16} /> : s.id}
                </div>
                <span
                  className="hidden sm:inline text-sm font-medium"
                  style={{ color: step >= s.id ? "var(--amber)" : "var(--text-3)" }}
                >
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-3 rounded-full"
                  style={{
                    background: step > s.id ? "var(--amber)" : "var(--border)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
          >
            <div className="dedco-card p-6 md:p-8">
              {/* Step 1: Address */}
              {step === 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <MapPin size={20} style={{ color: "var(--amber)" }} />
                    <h2 className="font-display text-lg font-semibold" style={{ color: "var(--text-1)" }}>
                      Adresse de livraison
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="kofi" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                        Prénom
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "var(--text-3)" }} />
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Kofi"
                          className="w-full pl-9 pr-4 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                          style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="akindele" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                        Nom
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "var(--text-3)" }} />
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Akindélé"
                          className="w-full pl-9 pr-4 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                          style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                        Téléphone
                      </label>
                      <PhoneInput
                        value={phone}
                        onChange={setPhone}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label htmlFor="cotonou" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                        Ville
                      </label>
                      <div className="relative">
                        <Navigation className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "var(--text-3)" }} />
                        <input
                          type="text"
                          value={ville}
                          onChange={(e) => setVille(e.target.value)}
                          placeholder="Cotonou"
                          className="w-full pl-9 pr-4 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                          style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="haie-vive,-cadjehoun..." className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                        Quartier
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3" size={16} style={{ color: "var(--text-3)" }} />
                        <input
                          type="text"
                          value={quartier}
                          onChange={(e) => setQuartier(e.target.value)}
                          placeholder="Haie Vive, Cadjèhoun..."
                          className="w-full pl-9 pr-4 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                          style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="maison-bleue,-2e-porte-à-gauche..." className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                        Indication (optionnel)
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3" size={16} style={{ color: "var(--text-3)" }} />
                        <input
                          type="text"
                          value={indication}
                          onChange={(e) => setIndication(e.target.value)}
                          placeholder="Maison bleue, 2e porte à gauche..."
                          className="w-full pl-9 pr-4 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                          style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Method */}
              {step === 2 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <CreditCard size={20} style={{ color: "var(--amber)" }} />
                    <h2 className="font-display text-lg font-semibold" style={{ color: "var(--text-1)" }}>
                      Méthode de paiement
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {PAYMENT_METHODS.map((m) => {
                      const selected = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id)}
                          className="w-full flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all cursor-pointer"
                          style={{
                            borderColor: selected ? m.color : "var(--border)",
                            background: selected ? "var(--amber-pale)" : "var(--bg-cream)",
                          }}
                        >
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              background: selected ? "rgba(255,255,255,0.8)" : "var(--bg-warm)",
                              color: m.color,
                            }}
                          >
                            {m.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>
                              {m.label}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                              {m.desc}
                            </div>
                          </div>
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              border: `2px solid ${selected ? m.color : "var(--border)"}`,
                            }}
                          >
                            {selected && (
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ background: m.color }}
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div
                    className="mt-4 p-3 rounded-lg text-xs flex items-start gap-2"
                    style={{ background: "var(--forest-pale)", color: "var(--forest)" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    Vos paiements sont sécurisés et cryptés via Mobile Money. Aucune information de carte n'est stockée.
                  </div>
                </div>
              )}

              {/* Step 3: Summary */}
              {step === 3 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <ClipboardList size={20} style={{ color: "var(--amber)" }} />
                    <h2 className="font-display text-lg font-semibold" style={{ color: "var(--text-1)" }}>
                      Récapitulatif
                    </h2>
                  </div>

                  {/* Items */}
                  <div className="space-y-3 mb-6">
                    {cart.map((item) => {
                      const artisan = getArtisan(item.artisanId);
                      return (
                        <div
                          key={`${item.id}-${item.selectedColor}`}
                          className="flex items-center gap-3 p-3 rounded-lg"
                          style={{ background: "var(--bg-cream)" }}
                        >
                          <div
                            className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0"
                            style={{ background: "var(--bg-warm)" }}
                          >
                            {item.images[0] && (
                              <img
                                src={item.images[0]}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>
                              {item.name}
                            </p>
                            {artisan && (
                              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                                {artisan.name} × {item.qty}
                              </p>
                            )}
                          </div>
                          <p className="text-sm font-semibold font-numeric" style={{ color: "var(--text-1)" }}>
                            {formatFCFA(item.price * item.qty)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Address */}
                  <div
                    className="p-4 rounded-lg mb-4"
                    style={{ background: "var(--bg-cream)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPin size={14} style={{ color: "var(--amber)" }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--amber)" }}>
                        Livraison
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-1)" }}>
                      {firstName} {lastName}
                    </p>
                    <p className="text-sm" style={{ color: "var(--text-2)" }}>
                      {quartier}, {ville}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>
                      {phone}
                    </p>
                    {indication && (
                      <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                        {indication}
                      </p>
                    )}
                  </div>

                  {/* Payment method */}
                  <div
                    className="p-4 rounded-lg mb-6"
                    style={{ background: "var(--bg-cream)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <CreditCard size={14} style={{ color: "var(--amber)" }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--amber)" }}>
                        Paiement
                      </span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                      {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}
                    </p>
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-2)" }}>Sous-total</span>
                      <span className="font-semibold font-numeric" style={{ color: "var(--text-1)" }}>
                        {formatFCFA(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-2)" }}>Livraison</span>
                      <span className="font-semibold font-numeric" style={{ color: "var(--text-1)" }}>
                        {formatFCFA(shipping)}
                      </span>
                    </div>
                    <div className="h-px" style={{ background: "var(--border)" }} />
                    <div className="flex justify-between items-center">
                      <span className="font-semibold" style={{ color: "var(--text-1)" }}>Total</span>
                      <span className="font-display text-2xl font-bold font-numeric" style={{ color: "var(--amber)" }}>
                        {formatFCFA(total)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button onClick={goPrev} className="dedco-btn dedco-btn-ghost flex-1">
              <ChevronLeft size={16} />
              Retour
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className="dedco-btn dedco-btn-primary flex-1"
            >
              Continuer
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handlePay}
              className="dedco-btn dedco-btn-primary dedco-btn-lg flex-1"
            >
              Payer maintenant
              <CreditCard size={16} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
