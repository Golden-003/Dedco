"use client";

import { motion } from "framer-motion";
import { Hammer, ShieldCheck, DollarSign, Star, Package, CheckCircle2, ArrowRight } from "lucide-react";
import { useDedcoStore } from "@/lib/store";

const STEPS = [
  { num: "1", title: "Inscrivez-vous", desc: "Créez un compte artisan avec votre spécialité, ville et portfolio." },
  { num: "2", title: "Complétez votre profil", desc: "Ajoutez vos réalisations, certifications et description de savoir-faire." },
  { num: "3", title: "Vérification KYC", desc: "Soumettez vos documents d'identité. Notre équipe valide en 48-72h." },
  { num: "4", title: "Publiez vos produits", desc: "Créez vos fiches produits avec photos, prix et descriptions." },
  { num: "5", title: "Recevez des commandes", desc: "Gérez vos commandes et livrez. Le paiement est sécurisé par Mobile Money." },
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

export function BecomeArtisanPage() {
  const navigate = useDedcoStore((s) => s.navigate);
  const goBack = useDedcoStore((s) => s.goBack);

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
            <button
              onClick={() => navigate({ page: "register" })}
              className="dedco-btn dedco-btn-light dedco-btn-xl"
            >
              Commencer maintenant <ArrowRight size={18} />
            </button>
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

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 text-center">
        <div className="dedco-card p-8 sm:p-10">
          <CheckCircle2 size={40} className="mx-auto text-[var(--forest)] mb-4" />
          <h2 className="display-lg mb-3">Prêt à commencer ?</h2>
          <p className="text-sm text-[var(--text-2)] mb-6 max-w-md mx-auto">
            Inscrivez-vous en 2 minutes et commencez à vendre vos créations.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate({ page: "register" })}
              className="dedco-btn dedco-btn-primary"
            >
              Inscription artisan <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate({ page: "help-center" })}
              className="dedco-btn dedco-btn-ghost"
            >
              En savoir plus
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
