"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hammer, Palette, ShieldCheck, DollarSign, Star, Package,
  CheckCircle2, ArrowRight, ArrowLeft, Upload, User, Mail,
  MapPin, Wrench, Briefcase, TrendingUp, Eye,
} from "lucide-react";
import { useDedcoStore } from "@/lib/store";
import { PhoneInput } from "@/components/dedco/phone-input";

type PartnerType = "artisan" | "designer";
type Step = "choice" | "benefits" | "form" | "submitted";

const PARTNER_INFO: Record<PartnerType, {
  label: string;
  icon: typeof Hammer;
  color: string;
  tagline: string;
  benefits: { icon: React.ReactNode; title: string; desc: string }[];
  steps: { num: string; title: string; desc: string }[];
  specialties: string[];
  experienceLabel: string;
}> = {
  artisan: {
    label: "Artisan",
    icon: Hammer,
    color: "var(--amber)",
    tagline: "Vendez vos créations sur la marketplace Dedco",
    benefits: [
      { icon: <DollarSign size={20} />, title: "0% commission les 6 premiers mois", desc: "Lancez-vous sans frais. Nous investissons dans votre succès." },
      { icon: <ShieldCheck size={20} />, title: "Paiement sécurisé Mobile Money", desc: "Votre argent est protégé. Pas de risque d'impayé." },
      { icon: <Star size={20} />, title: "Système de niveaux N1-N4", desc: "Montez en grade et gagnez la confiance des clients." },
      { icon: <Package size={20} />, title: "Outils de gestion intégrés", desc: "Dashboard, statistiques, gestion de stock et commandes." },
      { icon: <TrendingUp size={20} />, title: "Briefs sur-mesure", desc: "Recevez des demandes de clients pour des pièces uniques." },
      { icon: <Wrench size={20} />, title: "Certification N4", desc: "Devenez maître artisan et augmentez votre visibilité." },
    ],
    steps: [
      { num: "1", title: "Candidature", desc: "Remplissez le formulaire avec vos infos et spécialité." },
      { num: "2", title: "Validation KYC", desc: "Pièce d'identité + photos de réalisations. Validation 48-72h." },
      { num: "3", title: "Publiez vos produits", desc: "Créez vos fiches produits avec photos et prix." },
      { num: "4", title: "Recevez des commandes", desc: "Vendez en toute sécurité via Mobile Money." },
    ],
    specialties: [
      "Ébénisterie & Menuiserie",
      "Rotin & Osier",
      "Luminaires & Textile",
      "Décoration générale",
      "Tissus & Couture",
      "Sculpture & Art",
    ],
    experienceLabel: "Années d'expérience",
  },
  designer: {
    label: "Designer d'intérieur",
    icon: Palette,
    color: "var(--forest)",
    tagline: "Accompagnez les clients dans leurs projets d'aménagement",
    benefits: [
      { icon: <DollarSign size={20} />, title: "0% commission Dedco", desc: "Vous gardez 100% de vos honoraires. Seul l'abonnement compte." },
      { icon: <ShieldCheck size={20} />, title: "Paiement sécurisé", desc: "Acompte + solde bloqués jusqu'à validation des livrables." },
      { icon: <Star size={20} />, title: "Visibilité sur la plateforme", desc: "Votre profil et portfolio visibles par tous les clients Dedco." },
      { icon: <Eye size={20} />, title: "Recevez des briefs ciblés", desc: "Les clients vous envoient directement leurs besoins d'aménagement." },
      { icon: <Briefcase size={20} />, title: "3 niveaux d'abonnement", desc: "Essentiel, Pro ou Signature — selon votre volume d'activité." },
      { icon: <Package size={20} />, title: "Outils de projet intégrés", desc: "Livrables, révisions, calendrier, messagerie — tout en un." },
    ],
    steps: [
      { num: "1", title: "Candidature", desc: "Remplissez le formulaire avec votre style et expérience." },
      { num: "2", title: "Validation KYC", desc: "Pièce d'identité + portfolio. Validation 48-72h." },
      { num: "3", title: "Recevez des briefs", desc: "Les clients vous envoient leurs projets d'aménagement." },
      { num: "4", title: "Livrez et soyez payé", desc: "Moodboard, plan, palette → validation → paiement." },
    ],
    specialties: [
      "Design d'intérieur moderne",
      "Style bohème / ethnique",
      "Minimaliste scandinave",
      "Décoration traditionnelle",
      "Aménagement bureau",
      "Architecture d'intérieur",
    ],
    experienceLabel: "Années d'expérience en design",
  },
};

export function BecomeArtisanPage() {
  const navigate = useDedcoStore((s) => s.navigate);

  const [step, setStep] = useState<Step>("choice");
  const [partnerType, setPartnerType] = useState<PartnerType | null>(null);

  // Form fields
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");

  const info = partnerType ? PARTNER_INFO[partnerType] : null;
  const canSubmit = () => lastName && firstName && email && phone && city && specialty && experience;

  function handleChoose(type: PartnerType) {
    setPartnerType(type);
    setStep("benefits");
  }

  function handleContinue() {
    setStep("form");
  }

  function handleSubmit() {
    if (!canSubmit()) return;
    setStep("submitted");
  }

  function handleBack() {
    if (step === "benefits") {
      setStep("choice");
      setPartnerType(null);
    } else if (step === "form") {
      setStep("benefits");
    }
  }

  // ── Étape : Candidature envoyée ──
  if (step === "submitted") {
    return (
      <div className="dedco-fade-in max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-[var(--forest-pale)] mx-auto flex items-center justify-center mb-5">
          <CheckCircle2 size={40} className="text-[var(--forest)]" />
        </div>
        <h1 className="display-xl mb-3">Candidature envoyée !</h1>
        <p className="text-sm text-[var(--text-2)] mb-2">
          Merci {firstName} ! Votre demande pour devenir {info?.label.toLowerCase()} a bien été reçue.
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

  // ── Étape : Choix du type de partenaire ──
  if (step === "choice") {
    return (
      <div className="dedco-fade-in">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, var(--amber) 0%, var(--terracotta) 100%)" }} />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center text-white">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-semibold mb-5">
                <Briefcase size={14} />
                Espace partenaire Dedco
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Devenez partenaire Dedco
              </h1>
              <p className="text-base sm:text-lg opacity-90 max-w-2xl mx-auto leading-relaxed mb-8">
                Rejoignez la marketplace N°1 de l'aménagement intérieur au Bénin.
                Vendez vos créations ou accompagnez des clients dans leurs projets.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Choix du type */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="display-lg mb-2 text-center">Quel type de partenaire êtes-vous ?</h2>
          <p className="text-sm text-[var(--text-2)] mb-8 text-center">
            Sélectionnez votre profil pour découvrir les avantages et démarrer votre candidature.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Artisan */}
            <motion.button
              type="button"
              onClick={() => handleChoose("artisan")}
              className="dedco-card p-6 text-left hover:shadow-lg hover:border-amber transition-all cursor-pointer group"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -3 }}
            >
              <div className="w-14 h-14 rounded-full bg-[var(--amber-pale)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Hammer size={28} className="text-[var(--amber)]" strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-lg mb-1">Artisan</h3>
              <p className="text-sm text-[var(--text-2)] mb-3">
                Vendez vos créations sur la marketplace et recevez des commandes sur-mesure.
              </p>
              <div className="flex items-center gap-1 text-xs font-semibold text-[var(--amber)]">
                Découvrir <ArrowRight size={14} />
              </div>
            </motion.button>

            {/* Designer */}
            <motion.button
              type="button"
              onClick={() => handleChoose("designer")}
              className="dedco-card p-6 text-left hover:shadow-lg hover:border-forest transition-all cursor-pointer group"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -3 }}
            >
              <div className="w-14 h-14 rounded-full bg-[var(--forest-pale)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Palette size={28} className="text-[var(--forest)]" strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-lg mb-1">Designer d'intérieur</h3>
              <p className="text-sm text-[var(--text-2)] mb-3">
                Accompagnez les clients dans leurs projets d'aménagement et soyez payé pour votre expertise.
              </p>
              <div className="flex items-center gap-1 text-xs font-semibold text-[var(--forest)]">
                Découvrir <ArrowRight size={14} />
              </div>
            </motion.button>
          </div>
        </section>
      </div>
    );
  }

  // ── Étape : Avantages + étapes + bouton continuer ──
  if (step === "benefits" && info) {
    const PartnerIcon = info.icon;
    return (
      <div className="dedco-fade-in">
        {/* Hero adapté au type */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${info.color} 0%, var(--terracotta) 100%)` }} />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center text-white">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-semibold mb-4">
                <PartnerIcon size={14} />
                {info.label}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold mb-3">
                Devenez {info.label.toLowerCase()} Dedco
              </h1>
              <p className="text-base opacity-90 max-w-2xl mx-auto leading-relaxed">
                {info.tagline}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Bouton retour */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-sm text-[var(--text-3)] hover:text-[var(--amber)] transition-colors font-medium"
          >
            <ArrowLeft size={16} /> Changer de profil
          </button>
        </div>

        {/* Avantages */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="display-lg mb-6 text-center">Pourquoi nous rejoindre ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {info.benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="dedco-card p-5"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mb-3" style={{ background: `${info.color === 'var(--amber)' ? 'var(--amber-pale)' : 'var(--forest-pale)'}` }}>
                  <span style={{ color: info.color }}>{b.icon}</span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{b.title}</h3>
                <p className="text-sm text-[var(--text-2)] leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="py-8" style={{ background: "var(--bg-warm)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="display-lg mb-6 text-center">Comment ça marche ?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {info.steps.map((s, i) => (
                <motion.div
                  key={s.num}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="dedco-card p-5"
                >
                  <div className="w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center mb-3 font-numeric" style={{ background: info.color }}>
                    {s.num}
                  </div>
                  <h3 className="font-display font-bold text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-[var(--text-2)] leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="dedco-card p-8">
            <CheckCircle2 size={36} className="mx-auto mb-3" style={{ color: info.color }} />
            <h2 className="display-md mb-2">Prêt à commencer ?</h2>
            <p className="text-sm text-[var(--text-2)] mb-6">
              Remplissez le formulaire de candidature. Notre équipe vous répond sous 48-72h.
            </p>
            <button
              type="button"
              onClick={handleContinue}
              className="dedco-btn dedco-btn-primary dedco-btn-lg"
            >
              Continuer ma candidature <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </div>
    );
  }

  // ── Étape : Formulaire de candidature ──
  if (step === "form" && info) {
    const PartnerIcon = info.icon;
    return (
      <div className="dedco-fade-in max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-sm text-[var(--text-3)] hover:text-[var(--amber)] transition-colors mb-4 font-medium"
        >
          <ArrowLeft size={16} /> Retour aux avantages
        </button>

        <div className="dedco-card p-6 sm:p-8">
          {/* En-tête du formulaire */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: info.color === 'var(--amber)' ? 'var(--amber-pale)' : 'var(--forest-pale)' }}>
              <PartnerIcon size={24} style={{ color: info.color }} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="display-md">Candidature {info.label.toLowerCase()}</h2>
              <p className="text-xs text-[var(--text-3)]">Notre équipe vous répond sous 48-72h</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                Nom <span className="text-terracotta">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--text-3)" }} />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Akindélé"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-md border focus:outline-none focus:ring-2 transition-all"
                  style={{ background: "var(--bg-cream)", borderColor: "var(--border)", color: "var(--text-1)" }}
                />
              </div>
            </div>

            {/* Prénom */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                Prénom <span className="text-terracotta">*</span>
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
                {info.specialties.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Expérience */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
                {info.experienceLabel} <span className="text-terracotta">*</span>
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

            {/* KYC info */}
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center" style={{ background: "var(--bg-warm)" }}>
              <Upload size={20} className="mx-auto text-[var(--text-3)] mb-2" />
              <p className="text-xs text-[var(--text-3)]">
                Pièce d'identité, selfie et photos de réalisations seront demandés après examen de votre candidature.
              </p>
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
      </div>
    );
  }

  // Fallback
  return null;
}
