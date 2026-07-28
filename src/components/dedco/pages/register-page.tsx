"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDedcoStore } from "@/lib/store";
import { useNotificationStore } from "@/lib/notification-store";
import { PhoneInput } from "@/components/dedco/phone-input";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  User,
  ChevronRight,
  ChevronLeft,
  Palette,
  Briefcase,
  Home,
  Wrench,
} from "lucide-react";

type Role = "client" | "artisan" | "designer" | "maison";

const ROLES: { id: Role; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "client", label: "Client", desc: "Découvrez et achetez", icon: <Home size={24} /> },
  { id: "artisan", label: "Artisan", desc: "Vendez vos créations", icon: <Wrench size={24} /> },
  { id: "designer", label: "Designer", desc: "Proposez vos services", icon: <Palette size={24} /> },
  { id: "maison", label: "Maison déco", desc: "Gérez votre boutique", icon: <Briefcase size={24} /> },
];

export function RegisterPage() {
  const navigate = useDedcoStore((s) => s.navigate);
  const login = useDedcoStore((s) => s.login);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 fields
  const [firstName, setFirstName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 fields
  const [role, setRole] = useState<Role>("client");

  // Step 3 fields
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const showStep3 = role === "artisan" || role === "designer" || role === "maison";

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2 && showStep3) setStep(3);
    else handleSubmit();
  };

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Auto-connect selon le rôle choisi
      const avatars: Record<Role, string> = {
        client: "https://images.unsplash.com/photo-1614317226704-aba58b1ce153?auto=format&fit=crop&crop=faces&w=120&q=80",
        artisan: "https://images.unsplash.com/photo-1614023342667-6f060e9d1e04?auto=format&fit=crop&crop=faces&w=120&q=80",
        designer: "https://images.unsplash.com/photo-1729355796906-10a9809e0864?auto=format&fit=crop&crop=faces&w=120&q=80",
        maison: "https://images.unsplash.com/photo-1533674689012-136b487b7736?auto=format&fit=crop&crop=faces&w=120&q=80",
      };
      login({
        role,
        name: `${firstName} ${name}` || email.split("@")[0] || "Nouvel utilisateur",
        email: email || "user@dedco.bj",
        avatar: avatars[role],
      });
      useNotificationStore.getState().initForRole(role);
      // Route to appropriate dashboard based on selected role
      switch (role) {
        case "artisan":
          navigate({ page: "artisan-dashboard" });
          break;
        case "designer":
          navigate({ page: "designer-dashboard" });
          break;
        case "maison":
          navigate({ page: "maison-dashboard" });
          break;
        default:
          navigate({ page: "home" });
          break;
      }
    }, 1000);
  };

  const canProceed = () => {
    if (step === 1) return firstName && name && email && phone && password.length >= 6;
    if (step === 2) return true;
    return true;
  };

  const totalSteps = showStep3 ? 3 : 2;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => {
    setDirection(1);
    handleNext();
  };
  const goPrev = () => {
    setDirection(-1);
    setStep((s) => Math.max(1, s - 1));
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
              Créez votre compte
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: step === i + 1 ? 32 : 8,
                  background: step >= i + 1 ? "var(--amber)" : "var(--border)",
                }}
              />
            ))}
          </div>

          {/* Steps */}
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
              {/* Step 1: Account Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-display text-lg font-semibold mb-1" style={{ color: "var(--text-1)" }}>
                    Informations du compte
                  </h3>
                  <div>
                    <label htmlFor="kofi" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                      Prénom
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--text-3)" }} />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Kofi"
                        className="w-full pl-10 pr-4 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                        style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="akindele" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                      Nom
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--text-3)" }} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Akindélé"
                        className="w-full pl-10 pr-4 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                        style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="votre@email.com" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
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
                    <label htmlFor="minimum-6-caracteres" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
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
              )}

              {/* Step 2: Role Selection */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-display text-lg font-semibold mb-1" style={{ color: "var(--text-1)" }}>
                    Vous êtes...
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {ROLES.map((r) => {
                      const selected = role === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className="p-4 rounded-lg border-2 text-left transition-all cursor-pointer"
                          style={{
                            borderColor: selected ? "var(--amber)" : "var(--border)",
                            background: selected ? "var(--amber-pale)" : "var(--bg-cream)",
                          }}
                        >
                          <div
                            className="mb-2"
                            style={{ color: selected ? "var(--amber)" : "var(--text-3)" }}
                          >
                            {r.icon}
                          </div>
                          <div className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>
                            {r.label}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                            {r.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Professional info */}
              {step === 3 && showStep3 && (
                <div className="space-y-4">
                  <h3 className="font-display text-lg font-semibold mb-1" style={{ color: "var(--text-1)" }}>
                    Informations professionnelles
                  </h3>
                  <div>
                    <label htmlFor="ebenisterie,-design-d" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                      Spécialité
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Ébénisterie, Design d'intérieur..."
                      className="w-full px-4 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                      style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
                    />
                  </div>
                  <div>
                    <label htmlFor="cotonou,-porto-novo..." className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                      Ville
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Cotonou, Porto-Novo..."
                      className="w-full px-4 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                      style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
                    />
                  </div>
                  <div>
                    <label htmlFor="decrivez-votre-savoir-faire-et-vos-realisations..." className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                      Description de votre portfolio
                    </label>
                    <textarea
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      placeholder="Décrivez votre savoir-faire et vos réalisations..."
                      rows={3}
                      className="w-full px-4 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all resize-none"
                      style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={goPrev}
                className="dedco-btn dedco-btn-ghost flex-1"
              >
                <ChevronLeft size={16} />
                Retour
              </button>
            )}
            <button
              type="button"
              disabled={!canProceed() || loading}
              onClick={goNext}
              className="dedco-btn dedco-btn-primary flex-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Création...
                </span>
              ) : step === totalSteps ? (
                "Créer mon compte"
              ) : (
                <>
                  Continuer
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Login link */}
        <p className="text-center mt-6 text-sm" style={{ color: "var(--text-2)" }}>
          Déjà un compte?{" "}
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
