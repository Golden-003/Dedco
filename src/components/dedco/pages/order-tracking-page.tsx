"use client";

import { motion } from "framer-motion";
import {
  Check,
  Circle,
  Truck,
  Package,
  Clock,
  MapPin,
  User,
  MessageCircle,
  Phone,
  FileText,
} from "lucide-react";
import { useDedcoStore } from "@/lib/store";
import { formatFCFA, getArtisan } from "@/lib/dedco-data";
import { BackButton } from "../layout";

// ============================================================
// Mock order data
// ============================================================

interface TimelineStep {
  label: string;
  date: string;
  status: "completed" | "current" | "pending";
}

interface OrderDetail {
  id: string;
  date: string;
  status: string;
  statusClass: string;
  items: { name: string; qty: number; price: number; image: string }[];
  artisanName: string;
  artisanId: number;
  deliveryAddress: string;
  total: number;
  timeline: TimelineStep[];
}

const MOCK_ORDERS: Record<string, OrderDetail> = {
  "ORD-001": {
    id: "ORD-001",
    date: "20 Janvier 2024",
    status: "En livraison",
    statusClass: "dedco-badge-amber",
    items: [
      {
        name: "Table Basse Danhomè",
        qty: 1,
        price: 125000,
        image:
          "https://images.unsplash.com/photo-1532372576444-dda954194ad0?auto=format&fit=crop&w=400&q=85",
      },
      {
        name: "Vase Éburnie Sculpté",
        qty: 2,
        price: 30000,
        image:
          "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=400&q=85",
      },
    ],
    artisanName: "Kofi Akindélé",
    artisanId: 1,
    deliveryAddress: "Cotonou, Haie Vive, Rue 234",
    total: 185000,
    timeline: [
      {
        label: "Commande confirmée",
        date: "20 Jan 2024",
        status: "completed",
      },
      {
        label: "Artisan en fabrication",
        date: "21 Jan 2024",
        status: "completed",
      },
      {
        label: "Prêt pour expédition",
        date: "25 Jan 2024",
        status: "completed",
      },
      {
        label: "En livraison",
        date: "Estimé 28 Jan",
        status: "current",
      },
      {
        label: "Livré",
        date: "",
        status: "pending",
      },
    ],
  },
  "ORD-002": {
    id: "ORD-002",
    date: "15 Janvier 2024",
    status: "Livré",
    statusClass: "dedco-badge-forest",
    items: [
      {
        name: "Suspension Masque Adja",
        qty: 1,
        price: 67000,
        image:
          "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=85",
      },
    ],
    artisanName: "Amara Dossou",
    artisanId: 2,
    deliveryAddress: "Cotonou, Akpakpa, Avenue Steinmetz",
    total: 67000,
    timeline: [
      { label: "Commande confirmée", date: "15 Jan 2024", status: "completed" },
      { label: "Artisan en fabrication", date: "16 Jan 2024", status: "completed" },
      { label: "Prêt pour expédition", date: "18 Jan 2024", status: "completed" },
      { label: "En livraison", date: "20 Jan 2024", status: "completed" },
      { label: "Livré", date: "22 Jan 2024", status: "completed" },
    ],
  },
  "ORD-003": {
    id: "ORD-003",
    date: "10 Janvier 2024",
    status: "Livré",
    statusClass: "dedco-badge-forest",
    items: [
      {
        name: "Tapis Kente Royal",
        qty: 1,
        price: 85000,
        image:
          "https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=400&q=85",
      },
      {
        name: "Coussin Bogolan",
        qty: 1,
        price: 19500,
        image:
          "https://images.unsplash.com/photo-1629949009765-40fc74c9ec21?auto=format&fit=crop&w=400&q=85",
      },
      {
        name: "Guirlande Perles",
        qty: 1,
        price: 20000,
        image:
          "https://images.unsplash.com/photo-1616627577385-5c0c4dab55a5?auto=format&fit=crop&w=400&q=85",
      },
    ],
    artisanName: "Fati Mensah",
    artisanId: 4,
    deliveryAddress: "Cotonou, Haie Vive, Rue 234",
    total: 124500,
    timeline: [
      { label: "Commande confirmée", date: "10 Jan 2024", status: "completed" },
      { label: "Artisan en fabrication", date: "11 Jan 2024", status: "completed" },
      { label: "Prêt pour expédition", date: "13 Jan 2024", status: "completed" },
      { label: "En livraison", date: "14 Jan 2024", status: "completed" },
      { label: "Livré", date: "15 Jan 2024", status: "completed" },
    ],
  },
};

// ============================================================
// Stepper step component
// ============================================================

function StepperDot({ step, index }: { step: TimelineStep; index: number }) {
  const isLast = index === 4;
  const IconComp =
    step.status === "completed"
      ? Check
      : step.status === "current"
        ? Circle
        : Circle;

  const dotClass =
    step.status === "completed"
      ? "bg-forest text-white"
      : step.status === "current"
        ? "bg-amber text-white"
        : "bg-warm text-ink-mute border border-border";

  const lineClass =
    step.status === "completed"
      ? "bg-forest"
      : step.status === "current"
        ? "bg-gradient-to-r from-forest to-warm"
        : "bg-warm";

  return (
    <div className="flex-1 flex flex-col items-center relative">
      <div className="flex items-center w-full">
        {/* Line before */}
        <div className={`h-0.5 flex-1 ${index === 0 ? "bg-transparent" : lineClass}`} />
        {/* Dot */}
        <div
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${dotClass} ${
            step.status === "current" ? "ring-4 ring-amber-pale" : ""
          }`}
        >
          <IconComp size={step.status === "completed" ? 16 : 10} fill={step.status === "completed" ? "currentColor" : "none"} strokeWidth={2.5} />
        </div>
        {/* Line after */}
        <div className={`h-0.5 flex-1 ${isLast ? "bg-transparent" : lineClass}`} />
      </div>
      {/* Label */}
      <p
        className={`text-[10px] sm:text-xs mt-2 text-center font-medium leading-tight max-w-[80px] ${
          step.status === "pending"
            ? "text-ink-mute"
            : step.status === "current"
              ? "text-amber-dark"
              : "text-forest"
        }`}
      >
        {step.label}
      </p>
      {step.date && (
        <p className="text-[10px] text-ink-mute mt-0.5 font-numeric text-center">
          {step.date}
        </p>
      )}
    </div>
  );
}

// ============================================================
// Order Tracking Page
// ============================================================

export function OrderTrackingPage({ orderId }: { orderId: string }) {
  const navigate = useDedcoStore((s) => s.navigate);
  const goBack = useDedcoStore((s) => s.goBack);
  const currentUser = useDedcoStore((s) => s.currentUser);
  const isArtisan = currentUser?.role === "artisan";

  const order = MOCK_ORDERS[orderId] ?? MOCK_ORDERS["ORD-001"];

  return (
    <div className="dedco-fade-in max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <BackButton onBack={goBack} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <h1 className="display-lg">Commande {order.id}</h1>
          <span className={`dedco-badge ${order.statusClass}`}>{order.status}</span>
        </div>
        <p className="text-sm text-ink-soft">Passée le {order.date}</p>
      </motion.div>

      {/* Timeline / Stepper */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="dedco-card p-5 sm:p-6 mb-5"
      >
        <div className="flex items-center gap-2 mb-5">
          <Truck size={18} className="text-amber" />
          <h2 className="font-display font-bold text-base">Suivi de livraison</h2>
        </div>
        <div className="flex items-start px-1">
          {order.timeline.map((step, i) => (
            <StepperDot key={step.label} step={step} index={i} />
          ))}
        </div>
      </motion.div>

      {/* Order details */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.16 }}
        className="dedco-card p-5 sm:p-6 mb-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Package size={18} className="text-amber" />
          <h2 className="font-display font-bold text-base">Détails de la commande</h2>
        </div>

        {/* Items */}
        <div className="space-y-3 mb-5 pb-5 border-b border-border">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-16 h-16 rounded-md overflow-hidden bg-warm flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                <p className="text-xs text-ink-mute">
                  Quantité : <span className="font-numeric">{item.qty}</span>
                </p>
              </div>
              <p className="text-sm font-medium font-numeric whitespace-nowrap">
                {formatFCFA(item.price * item.qty)}
              </p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="font-semibold">Total</span>
          <span className="font-display font-bold text-lg text-amber font-numeric">
            {formatFCFA(order.total)}
          </span>
        </div>
      </motion.div>

      {/* Artisan + Delivery info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.24 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5"
      >
        {/* Artisan */}
        <div className="dedco-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <User size={18} className="text-amber" />
            <h2 className="font-display font-bold text-base">Artisan</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate({ page: "artisan", id: order.artisanId })}
            className="flex items-center gap-3 group"
          >
            <img
              src={getArtisan(order.artisanId)?.avatar}
              alt={order.artisanName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-medium text-sm group-hover:text-amber transition-colors">
                {order.artisanName}
              </p>
              <p className="text-xs text-ink-mute">Voir le profil →</p>
            </div>
          </button>
        </div>

        {/* Delivery */}
        <div className="dedco-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={18} className="text-amber" />
            <h2 className="font-display font-bold text-base">Livraison</h2>
          </div>
          <p className="text-sm text-ink-soft">{order.deliveryAddress}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-ink-mute">
            <Clock size={12} />
            <span>Estimée : 28 Jan 2024</span>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.32 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {isArtisan ? (
          <>
            <button
              type="button"
              onClick={() => navigate({ page: "messages" })}
              className="dedco-btn dedco-btn-primary flex-1"
            >
              <MessageCircle size={18} />
              Contacter le client
            </button>
            <button type="button" onClick={() => navigate({ page: "invoice", orderId: order.id })} className="dedco-btn dedco-btn-ghost flex-1">
              <FileText size={18} />
              Facture
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => navigate({ page: "messages" })}
              className="dedco-btn dedco-btn-primary flex-1"
            >
              <MessageCircle size={18} />
              Contacter l'artisan
            </button>
            <button type="button" onClick={() => navigate({ page: "messages" })} className="dedco-btn dedco-btn-ghost flex-1">
              <Phone size={18} />
              Appeler l'artisan
            </button>
            <button type="button" onClick={() => navigate({ page: "invoice", orderId: order.id })} className="dedco-btn dedco-btn-ghost flex-1">
              <FileText size={18} />
              Facture
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
