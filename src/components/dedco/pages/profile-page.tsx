"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Package,
  Heart,
  Settings,
  MapPin,
  Phone,
  Mail,
  Pencil,
  ChevronRight,
  LogOut,
  Shield,
  Globe,
  MessageSquare,
} from "lucide-react";
import { PhoneInput } from "@/components/dedco/phone-input";
import { useDedcoStore } from "@/lib/store";
import { BackButton } from "../layout";

// ============================================================
// Profile mock data
// ============================================================

const PROFILE = {
  name: "Marie Houénou",
  email: "marie.houenou@email.bj",
  phone: "+229 97 45 32 10",
  avatar:
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&crop=faces&w=400&q=85",
  role: "Client",
  memberSince: "Janvier 2024",
};

const ADDRESSES = [
  {
    id: 1,
    label: "Domicile",
    address: "Cotonou, Haie Vive, Rue 234",
    isDefault: true,
  },
  {
    id: 2,
    label: "Bureau",
    address: "Cotonou, Akpakpa, Avenue Steinmetz",
    isDefault: false,
  },
];

type ProfileTab = "profile" | "orders" | "favorites" | "settings" | "messages";

const TABS: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
  { key: "profile", label: "Profil", icon: <User size={18} /> },
  { key: "orders", label: "Commandes", icon: <Package size={18} /> },
  { key: "messages", label: "Messages", icon: <MessageSquare size={18} /> },
  { key: "favorites", label: "Favoris", icon: <Heart size={18} /> },
  { key: "settings", label: "Paramètres", icon: <Settings size={18} /> },
];

// ============================================================
// Animation variants
// ============================================================

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" },
};

// ============================================================
// Profile Page
// ============================================================

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const navigate = useDedcoStore((s) => s.navigate);
  const goBack = useDedcoStore((s) => s.goBack);
  const logout = useDedcoStore((s) => s.logout);
  const currentUser = useDedcoStore((s) => s.currentUser);
  const [editMode, setEditMode] = useState(false);

  const PROFILE = {
    name: currentUser?.name || "Utilisateur",
    email: currentUser?.email || "user@dedco.bj",
    phone: "+229 97 45 32 10",
    avatar: currentUser?.avatar || "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&crop=faces&w=400&q=85",
    role: currentUser?.role || "client",
    memberSince: "Janvier 2024",
  };

  const handleTabClick = (tab: ProfileTab) => {
    setActiveTab(tab);
    if (tab === "orders") {
      const role = currentUser?.role;
      if (role === "artisan") navigate({ page: "artisan-orders" });
      else if (role === "designer") navigate({ page: "designer-projects" });
      else navigate({ page: "client-projets" });
    } else if (tab === "favorites") {
      navigate({ page: "favorites" });
    } else if (tab === "messages") {
      navigate({ page: "messages" });
    }
  };

  return (
    <div className="dedco-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <BackButton onBack={goBack} />

      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <h1 className="display-xl">Mon compte</h1>
        <span className="dedco-badge dedco-badge-amber">{PROFILE.role}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* ── Sidebar (desktop) / Tabs (mobile) ── */}
        <motion.aside
          className="lg:w-64 flex-shrink-0"
          {...fadeUp}
        >
          {/* Mobile horizontal tabs */}
          <div className="lg:hidden flex gap-1.5 overflow-x-auto dedco-hide-scroll pb-1 mb-4">
            {TABS.filter((t) => t.key !== "favorites").map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabClick(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${
                  activeTab === tab.key
                    ? "bg-amber text-white border-amber"
                    : "bg-card text-ink-soft border-border hover:border-ink-mute"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Desktop vertical nav */}
          <nav className="hidden lg:block dedco-card p-2 sticky top-20">
            <ul className="space-y-1">
              {TABS.map((tab) => (
                <li key={tab.key}>
                  <button
                    type="button"
                    onClick={() => handleTabClick(tab.key)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.key
                        ? "bg-amber-pale text-amber-dark"
                        : "text-ink-soft hover:bg-warm"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {(tab.key === "favorites") && (
                      <ChevronRight size={14} className="ml-auto text-ink-mute" />
                    )}
                  </button>
                </li>
              ))}
              <li className="pt-2 mt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-terracotta hover:bg-terracotta-pale transition-all"
                >
                  <LogOut size={18} />
                  Déconnexion
                </button>
              </li>
            </ul>
          </nav>
        </motion.aside>

        {/* ── Main Content ── */}
        <motion.main className="flex-1 min-w-0" {...fadeUp}>
          {activeTab === "profile" && (
            <ProfileContent editMode={editMode} setEditMode={setEditMode} />
          )}
          {activeTab === "orders" && <OrdersPlaceholder />}
          {activeTab === "settings" && <SettingsPlaceholder />}
          {/* Déconnexion mobile */}
          <div className="lg:hidden mt-6">
            <button
              type="button"
              onClick={() => logout()}
              className="dedco-btn dedco-btn-ghost w-full text-terracotta"
            >
              <LogOut size={18} />
              Déconnexion
            </button>
          </div>
        </motion.main>
      </div>
    </div>
  );
}

// ============================================================
// Profile Content Tab
// ============================================================

function ProfileContent({
  editMode,
  setEditMode,
}: {
  editMode: boolean;
  setEditMode: (v: boolean) => void;
}) {
  const navigate = useDedcoStore((s) => s.navigate);
  return (
    <div className="space-y-5">
      {/* User info card */}
      <div className="dedco-card p-5 sm:p-6">
        <div className="flex items-start justify-between mb-5">
          <h2 className="font-display font-bold text-lg">Informations personnelles</h2>
          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            className="dedco-btn dedco-btn-secondary dedco-btn-sm"
          >
            <Pencil size={14} />
            {editMode ? "Annuler" : "Modifier"}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-5">
          <img
            src={PROFILE.avatar}
            alt={`Photo de ${PROFILE.name}`}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-amber-pale"
          />
          <div className="flex-1 space-y-3">
            {editMode ? (
              <EditProfileForm onSave={() => setEditMode(false)} />
            ) : (
              <>
                <div>
                  <p className="text-xs text-ink-mute uppercase tracking-wide mb-0.5">
                    Nom complet
                  </p>
                  <p className="font-semibold">{PROFILE.name}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-mute uppercase tracking-wide mb-0.5">
                    Email
                  </p>
                  <div className="flex items-center gap-2 text-sm text-ink-soft">
                    <Mail size={14} />
                    {PROFILE.email}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-ink-mute uppercase tracking-wide mb-0.5">
                    Téléphone
                  </p>
                  <div className="flex items-center gap-2 text-sm text-ink-soft">
                    <Phone size={14} />
                    {PROFILE.phone}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="dedco-badge dedco-badge-amber">{PROFILE.role}</span>
                  <span className="text-xs text-ink-mute">
                    Membre depuis {PROFILE.memberSince}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Address book */}
      <div className="dedco-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">Adresses enregistrées</h2>
          <button type="button" onClick={() => navigate({ page: "settings" })} className="dedco-btn dedco-btn-ghost dedco-btn-sm">
            + Ajouter
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ADDRESSES.map((addr) => (
            <div
              key={addr.id}
              className={`p-4 rounded-lg border transition-colors ${
                addr.isDefault
                  ? "border-amber bg-amber-pale/40"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin size={14} className="text-amber" />
                <span className="font-medium text-sm">{addr.label}</span>
                {addr.isDefault && (
                  <span className="dedco-badge dedco-badge-amber text-[10px]">
                    Par défaut
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-soft">{addr.address}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats — retiré : chiffres hardcodés redondants avec les
          tabs de navigation (Commandes, Favoris, etc. sont déjà accessibles
          via la sidebar). Les afficher en plus avec de faux compteurs
          prêtait à confusion. */}
    </div>
  );
}

// ============================================================
// Edit Profile Form (simplified)
// ============================================================

function EditProfileForm({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-ink-mute uppercase tracking-wide mb-1 block">
          Nom complet
        </label>
        <input
          type="text"
          defaultValue={PROFILE.name}
          className="w-full px-3 py-2 rounded-md border border-border bg-card text-sm focus:outline-none focus:border-amber"
        />
      </div>
      <div>
        <label className="text-xs text-ink-mute uppercase tracking-wide mb-1 block">
          Email
        </label>
        <input
          type="email"
          defaultValue={PROFILE.email}
          className="w-full px-3 py-2 rounded-md border border-border bg-card text-sm focus:outline-none focus:border-amber"
        />
      </div>
      <div>
        <label className="text-xs text-ink-mute uppercase tracking-wide mb-1 block">
          Téléphone
        </label>
        <PhoneInput
          value={PROFILE.phone}
          onChange={() => {}}
          className="w-full"
        />
      </div>
      <button type="button" onClick={onSave} className="dedco-btn dedco-btn-primary dedco-btn-sm">
        Enregistrer
      </button>
    </div>
  );
}

// ============================================================
// Orders Placeholder
// ============================================================

function OrdersPlaceholder() {
  const navigate = useDedcoStore((s) => s.navigate);
  return (
    <div className="dedco-card p-5 sm:p-6">
      <h2 className="font-display font-bold text-lg mb-4">Mes commandes</h2>
      <div className="space-y-3">
        {[
          { id: "ORD-001", date: "20 Jan 2024", status: "En livraison", statusClass: "dedco-badge-amber", amount: "185 000 FCFA" },
          { id: "ORD-002", date: "15 Jan 2024", status: "Livré", statusClass: "dedco-badge-forest", amount: "67 000 FCFA" },
          { id: "ORD-003", date: "10 Jan 2024", status: "Livré", statusClass: "dedco-badge-forest", amount: "124 500 FCFA" },
        ].map((order) => (
          <button
            key={order.id}
            type="button"
            onClick={() => navigate({ page: "order-tracking", id: order.id })}
            className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-amber hover:bg-amber-pale/30 transition-all text-left"
          >
            <div>
              <p className="font-semibold text-sm font-numeric">{order.id}</p>
              <p className="text-xs text-ink-mute">{order.date}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`dedco-badge ${order.statusClass}`}>{order.status}</span>
              <span className="font-numeric text-sm font-medium">{order.amount}</span>
              <ChevronRight size={16} className="text-ink-mute" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Settings Placeholder
// ============================================================

function SettingsPlaceholder() {
  return (
    <div className="dedco-card p-5 sm:p-6">
      <h2 className="font-display font-bold text-lg mb-4">Paramètres</h2>
      <div className="space-y-4">
        {[
          { icon: <Globe size={18} />, label: "Langue", value: "Français" },
          { icon: <Shield size={18} />, label: "Confidentialité", value: "" },
          { icon: <Mail size={18} />, label: "Notifications", value: "Email & SMS" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
          >
            <div className="flex items-center gap-3 text-sm">
              <span className="text-ink-mute">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.value && (
                <span className="text-xs text-ink-mute">{item.value}</span>
              )}
              <ChevronRight size={14} className="text-ink-mute" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
