"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useDedcoStore } from "@/lib/store";
import { useNotificationStore } from "@/lib/notification-store";
import { PhoneInput } from "@/components/dedco/phone-input";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
} from "lucide-react";

export function RegisterPage() {
  const navigate = useDedcoStore((s) => s.navigate);
  const login = useDedcoStore((s) => s.login);
  const [loading, setLoading] = useState(false);

  // Champs inscription client
  const [firstName, setFirstName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = () =>
    firstName && name && email && phone && password.length >= 6;

  const handleSubmit = () => {
    if (!canSubmit()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Inscription client — rôle par défaut = client
      // Le client n'a PAS de KYC, pas de validation admin
      login({
        role: "client",
        name: `${firstName} ${name}` || email.split("@")[0] || "Nouvel utilisateur",
        email: email || "user@dedco.bj",
        avatar: "https://images.unsplash.com/photo-1614317226704-aba58b1ce153?auto=format&fit=crop&crop=faces&w=120&q=80",
      });
      useNotificationStore.getState().initForRole("client");
      navigate({ page: "home" });
    }, 1000);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="dedco-card p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-6">
            <button
              onClick={() => navigate({ page: "home" })}
              className="inline-block cursor-pointer"
            >
              <span className="font-display text-3xl font-bold" style={{ color: "var(--terracotta)" }}>
                Dedco
              </span>
              <span className="font-display text-3xl font-bold" style={{ color: "var(--amber)" }}>
                .
              </span>
            </button>
            <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
              Créez votre compte client
            </p>
          </div>

          {/* Formulaire — 1 seule étape */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                Prénom
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--text-3)" }} />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Sophie"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                  style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                Nom
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--text-3)" }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kossou"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                  style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--text-3)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
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
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--text-3)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                  style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                  style={{ color: "var(--text-3)" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Bouton */}
          <button
            type="button"
            disabled={!canSubmit() || loading}
            onClick={handleSubmit}
            className="dedco-btn dedco-btn-primary w-full mt-6"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Création...
              </span>
            ) : (
              "Créer mon compte"
            )}
          </button>

          {/* Info prestataire */}
          <div className="mt-5 p-3 rounded-lg" style={{ background: "var(--bg-warm)" }}>
            <p className="text-xs text-center" style={{ color: "var(--text-3)" }}>
              Vous êtes artisan ou designer ?{" "}
              <button
                onClick={() => navigate({ page: "become-artisan" })}
                className="font-semibold hover:underline"
                style={{ color: "var(--amber)" }}
              >
                Devenir partenaire →
              </button>
            </p>
          </div>
        </div>

        {/* Login link */}
        <p className="text-center mt-6 text-sm" style={{ color: "var(--text-2)" }}>
          Déjà un compte ?{" "}
          <button
            onClick={() => navigate({ page: "login" })}
            className="font-semibold cursor-pointer hover:underline"
            style={{ color: "var(--amber)" }}
          >
            Se connecter
          </button>
        </p>
      </motion.div>
    </div>
  );
}
