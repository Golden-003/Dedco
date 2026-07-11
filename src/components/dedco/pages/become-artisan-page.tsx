"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Hammer, ShieldCheck, DollarSign, Star, Package, CheckCircle2, ArrowRight, Upload, User, Mail, Phone, MapPin } from "lucide-react";
import { useDedcoStore } from "@/lib/store";
import { PhoneInput } from "@/components/dedco/phone-input";

const STEPS = [
  { num: "1", title: "Remplissez le formulaire", desc: "Infos personnelles, spécialité, ville et expérience." },
  { num: "2", title: "Soumettez votre KYC", desc: "Pièce d'identité + selfie + photos de vos réalisations." },
  { num: "3", title: "Validation Dedco", desc: "Notre équipe vérifie votre profil sous 48-72h." },
  { num: "4", title: "Publiez vos produits", desc: "Une fois validé, créez vos fiches produits et vendez." },
  { num: "5", title: "Recevez des commandes", desc: "Gérez vos commandes et livrez. Paiement sécurisé par Mobile Money." },
  { num: "6", title: "Montez en niveau", desc: "N1 → N4 : plus de ventes, plus de visibilité, plus de confiance." },
];

const BENEFITS = [
  { icon: <DollarSign size={20} />, title: "0% commission sur les 6 premiers mois", desc: "Lancez-vous sans frais. Nous investissons dans votre succès." },
  { icon: <ShieldCheck size={20} />, title: "Paiement sécurisé par Mobile Money", desc: "Votre argent est protégé. Pas de risque d'impayé." },
  { icon: <Star size={20} />, title: "Système de niveaux N1-N4", desc: "Montez en grade et gagnez la confiance des clients." },
  { icon: <Package size={20} />, title: "Outils de gestion intégrés", desc: "Dashboard, statistiques, gestion de stock et commandes." },
];

const TRUST_LEVELS = [
  { level: "N1", label: "Nouveau vérifié", req: "KYC validé", color: "var(--text-3)" },
  { level: "N2", label: "Artisan confirmé", req: "10+ commandes, 90%+ confiance", color: "var(--forest)" },
  { level: "N3", label: "Artisan expert", req: "30+ commandes, 95%+ confiance", color: "var(--amber-dark)" },
  { level: "N4", label: "Maître artisan", req: "50+ commandes, 98%+ confiance", color: "var(--amber)" },
];

const SPECIALTIES = [
  "Ébénisterie & Menuiserie",
  "Rotin & Osier",
  "Luminaires & Textile",
  "Décoration générale",
  "Tissus & Couture",
  "Sculpture & Art",
];

export function BecomeArtisanPage() {
  const navigate = useDedcoStore((s) => s.navigate);
  const goBack = useDedcoStore((s) => s.goBack);

  // Formulaire de candidature
  const [submitted, setSubmitted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");

  const canSubmit = () => fullName && email && phone && city && specialty && experience;

  function handleSubmit() {
    if (!canSubmit()) return;
    setSubmitted(true);
  }

  // ── État : candidature envoyée ──
  if (submitted) {
    return (
      <div className="dedco-fade-in max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-[var(--forest-pale)] mx-auto flex items-center justify-center mb-5">
          <CheckCircle2 size={40} className="text-[var(--forest)]" />
        </div>
        <h1 className="display-xl mb-3">Candidature envoyée !</h1>
        <p className="text-sm text-[var(--text-2)] mb-2">
          Merci {fullName.split(" ")[0]} ! Votre demande d'inscription en tant qu'artisan a bien été reçue.
        </p>
        <p className="text-xs text-[var(--text-3)] mb-6">
          Notre équipe va examiner votre profil et vos documents sous 48-72h. Vous recevrez un email de confirmation à {email} dès validation.
        </p>
        <button
          onClick={() => navigate({ page: "home" })}
          className="dedco-btn dedco-btn-primary"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="dedco-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, var(--amber) 0%, var(--terracotta) 100%)" }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center text-white">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-semibold mb-5">
              <Hammer size={14} />
              Artisans du Bénin
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Devenez artisan Dedco
            </h1>
            <p className="text-base sm:text-lg opacity-90 max-w-2xl mx-auto leading-relaxed mb-8">
              Mettez en valeur votre savoir-faire. Accédez à des milliers de clients,
              vendez en toute sécurité et développez votre activité.
            </p>
            <a href="#candidature" className="dedco-btn dedco-btn-light dedco-btn-xl inline-flex">
              Commencer ma candidature <ArrowRight size={18} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="display-lg mb-8 text-center">Comment ça marche ?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="dedco-card p-5"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--amber)] text-white text-sm font-bold flex items-center justify-center mb-3 font-numeric">
                {step.num}
              </div>
              <h3 className="font-display font-bold text-base mb-2">{step.title}</h3>
              <p className="text-sm text-[var(--text-2)] leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12" style={{ background: "var(--bg-warm)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="display-lg mb-6 text-center">Pourquoi rejoindre Dedco ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="dedco-card p-5 flex gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--amber-pale)] text-[var(--amber)] flex items-center justify-center flex-shrink-0">
                  {b.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{b.title}</h3>
                  <p className="text-sm text-[var(--text-2)] leading-relaxed">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Levels */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="display-lg mb-6 text-center">Niveaux de confiance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TRUST_LEVELS.map((lvl, i) => (
            <motion.div
              key={lvl.level}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              className="dedco-card p-4 text-center"
            >
              <p className="font-display text-2xl font-bold font-numeric mb-1" style={{ color: lvl.color }}>
                {lvl.level}
              </p>
              <p className="text-sm font-semibold mb-1">{lvl.label}</p>
              <p className="text-xs text-[var(--text-3)]">{lvl.req}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Formulaire de candidature */}
      <section id="candidature" className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="dedco-card p-6 sm:p-8">
          <h2 className="display-lg mb-2 text-center">Candidature artisan</h2>
          <p className="text-sm text-[var(--text-2)] mb-6 text-center">
            Remplissez ce formulaire. Notre équipe vous répond sous 48-72h.
          </p>

          <div className="space-y-4">
            {/* Nom complet */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                Nom complet <span className="text-terracotta">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--text-3)" }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Kofi Akindélé"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                  style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                Email <span className="text-terracotta">*</span>
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

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                Téléphone <span className="text-terracotta">*</span>
              </label>
              <PhoneInput value={phone} onChange={setPhone} className="w-full" />
            </div>

            {/* Ville */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                Ville <span className="text-terracotta">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--text-3)" }} />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cotonou, Porto-Novo..."
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                  style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
                />
              </div>
            </div>

            {/* Spécialité */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                Spécialité <span className="text-terracotta">*</span>
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
              >
                <option value="">Choisir une spécialité</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Expérience */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                Années d'expérience <span className="text-terracotta">*</span>
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-3 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
              >
                <option value="">Choisir</option>
                <option value="1-3">1 à 3 ans</option>
                <option value="3-5">3 à 5 ans</option>
                <option value="5-10">5 à 10 ans</option>
                <option value="10+">Plus de 10 ans</option>
              </select>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                Décrivez votre savoir-faire
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Décrivez vos réalisations, vos techniques, vos matériaux de prédilection..."
                className="w-full px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:border-amber"
                style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
              />
            </div>

            {/* KYC upload placeholder */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                Documents KYC (à fournir après validation préliminaire)
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center" style={{ background: "var(--bg-warm)" }}>
                <Upload size={20} className="mx-auto text-[var(--text-3)] mb-2" />
                <p className="text-xs text-[var(--text-3)]">
                  Pièce d'identité, selfie et photos de réalisations seront demandés après examen de votre candidature.
                </p>
              </div>
            </div>
          </div>

          {/* Bouton */}
          <button
            type="button"
            disabled={!canSubmit()}
            onClick={handleSubmit}
            className="dedco-btn dedco-btn-primary w-full mt-6"
          >
            Envoyer ma candidature
          </button>

          <p className="text-xs text-center text-[var(--text-3)] mt-3">
            En soumettant ce formulaire, vous acceptez que Dedco examine votre profil. La validation finale est soumise à vérification KYC.
          </p>
        </div>
      </section>
    </div>
  );
}

