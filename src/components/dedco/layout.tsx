"use client";

import { useEffect, useState, useRef } from "react";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronLeft,
  ChevronDown,
  User,
  LayoutDashboard,
  Wallet,
  ShoppingBag as OrdersIcon,
  LogOut,
  Briefcase,
  Wrench,
  Palette,
  Shield,
  Home as HomeIcon,
  FolderKanban,
  Bell,
} from "lucide-react";
import type { Route } from "@/lib/dedco-types";
import { useDedcoStore, type AppRoute, type CurrentUser, type UserRole } from "@/lib/store";
import { useNotificationStore } from "@/lib/notification-store";
import { WelcomePopup } from "@/components/dedco/welcome-popup";

// ============================================================
// Navbar (desktop) + mobile menu
// ============================================================

const NAV_LINKS: { label: string; route: Route }[] = [
  { label: "Accueil", route: { name: "home" } },
  { label: "Inspirations", route: { name: "inspirations" } },
  { label: "Marketplace", route: { name: "marketplace" } },
  { label: "Designers d'espace", route: { name: "designers" } },
  { label: "Magazine", route: { name: "magazine" } },
];

// ============================================================
// UserMenu — Distinction visiteur vs connecté
// Visiteur (currentUser = null) → boutons "Connexion" + "S'inscrire"
// Connecté → avatar + dropdown avec actions selon le rôle
// ============================================================

const ROLE_DASHBOARD: Record<UserRole, AppRoute["page"]> = {
  client: "profile",
  artisan: "artisan-dashboard",
  designer: "designer-dashboard",
  admin: "admin-dashboard",
  maison: "maison-dashboard",
};

const ROLE_LABEL: Record<UserRole, string> = {
  client: "Client",
  artisan: "Artisan",
  designer: "Designer",
  admin: "Admin",
  maison: "Maison déco",
};

const ROLE_ICON: Record<UserRole, React.ReactNode> = {
  client: <HomeIcon size={14} />,
  artisan: <Wrench size={14} />,
  designer: <Palette size={14} />,
  admin: <Shield size={14} />,
  maison: <Briefcase size={14} />,
};

function UserMenu({
  currentUser,
  navigate,
  logout,
}: {
  currentUser: CurrentUser | null;
  navigate: (r: AppRoute) => void;
  logout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── VISITEUR : pas encore connecté ──
  if (!currentUser) {
    return (
      <div className="hidden sm:flex items-center gap-2 ml-2">
        <button
          type="button"
          onClick={() => navigate({ page: "login" })}
          className="dedco-btn dedco-btn-ghost dedco-btn-sm"
        >
          Connexion
        </button>
        <button
          type="button"
          onClick={() => navigate({ page: "register" })}
          className="dedco-btn dedco-btn-primary dedco-btn-sm"
        >
          S'inscrire
        </button>
      </div>
    );
  }

  // ── CONNECTÉ : avatar + dropdown ──
  const isPrestataire = currentUser.role !== "client";

  return (
    <div className="relative ml-2 hidden sm:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-warm transition-colors"
        aria-label="Menu utilisateur"
        aria-expanded={open}
      >
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-8 h-8 rounded-full object-cover border-2 border-amber"
        />
        <div className="hidden md:flex flex-col items-start leading-tight">
          <span className="text-xs font-semibold text-ink max-w-[100px] truncate">
            {currentUser.name.split(" ")[0]}
          </span>
          <span className="text-[10px] text-ink-mute flex items-center gap-1">
            {ROLE_ICON[currentUser.role]}
            {ROLE_LABEL[currentUser.role]}
          </span>
        </div>
        <ChevronDown size={14} className={`text-ink-mute transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-card rounded-lg shadow-lg border border-border overflow-hidden z-50">
          {/* Header card */}
          <div className="p-4 bg-amber-pale/50 border-b border-border">
            <div className="flex items-center gap-3">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="text-sm font-display font-semibold truncate">{currentUser.name}</p>
                <p className="text-xs text-ink-mute truncate">{currentUser.email}</p>
              </div>
            </div>
            <span className="dedco-badge dedco-badge-amber mt-2 inline-flex">
              {ROLE_ICON[currentUser.role]}
              {ROLE_LABEL[currentUser.role]}
            </span>
          </div>

          {/* Actions */}
          <div className="py-1">
            {/* Prestataire : "Mon espace" → dashboard uniquement.
                Pas de "Mes projets" / "Mes commandes" — ce sont des concepts
                client. Le prestataire accède à tout depuis sa sidebar. */}
            {isPrestataire && (
              <button
                type="button"
                onClick={() => {
                  navigate({ page: ROLE_DASHBOARD[currentUser.role] } as AppRoute);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-warm transition-colors"
              >
                <LayoutDashboard size={16} className="text-amber" />
                Mon espace {ROLE_LABEL[currentUser.role]}
              </button>
            )}

            {/* Client : Mon profil + Mes projets + Mes commandes */}
            {!isPrestataire && (
              <>
                <button
                  type="button"
                  onClick={() => { navigate({ page: "profile" }); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-warm transition-colors"
                >
                  <User size={16} className="text-amber" />
                  Mon profil
                </button>
                <button
                  type="button"
                  onClick={() => { navigate({ page: "client-projets" }); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-warm transition-colors"
                >
                  <FolderKanban size={16} className="text-amber" />
                  Mes projets
                </button>
                <button
                  type="button"
                  onClick={() => { navigate({ page: "order-history" }); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-warm transition-colors"
                >
                  <OrdersIcon size={16} className="text-amber" />
                  Mes commandes
                </button>
              </>
            )}

            {/* Wallet — uniquement pour artisans et designers (pas les clients) */}
            {(currentUser.role === "artisan" || currentUser.role === "designer") && (
              <button
                type="button"
                onClick={() => {
                  navigate({
                    page:
                      currentUser.role === "artisan" ? "artisan-wallet"
                      : "designer-wallet",
                  });
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-warm transition-colors"
              >
                <Wallet size={16} className="text-amber" />
                Mon wallet
              </button>
            )}

            <div className="border-t border-border my-1" />
            <button
              type="button"
              onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-terracotta hover:bg-terracotta-pale transition-colors"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// NotificationBell — cloche avec badge non-lus
// ============================================================

export function NotificationBell({ navigate }: { navigate: (route: AppRoute) => void }) {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <button
      type="button"
      onClick={() => navigate({ page: "notifications" })}
      aria-label="Notifications"
      title="Notifications"
      className="relative w-10 h-10 rounded-full flex items-center justify-center text-ink-soft hover:bg-warm hover:text-ink transition-colors"
    >
      <Bell size={20} className={unreadCount > 0 ? "dedco-pulse" : ""} />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-terracotta text-white text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}

export function Navbar({
  currentRoute,
  onNavigate,
  cartCount,
  favCount,
  onOpenSearch,
  onOpenCart,
  onOpenFavorites,
}: {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  cartCount: number;
  favCount: number;
  onOpenSearch: () => void;
  onOpenCart: () => void;
  onOpenFavorites: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useDedcoStore((s) => s.navigate);
  const currentUser = useDedcoStore((s) => s.currentUser);
  const logout = useDedcoStore((s) => s.logout);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (route: Route) => currentRoute.name === route.name;

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-cream/95 backdrop-blur transition-shadow ${
          scrolled ? "shadow-sm" : ""
        }`}
        style={{
          backgroundColor: scrolled
            ? "rgba(247, 243, 237, 0.95)"
            : "var(--bg-cream)",
        }}
      >
        <nav
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4"
          aria-label="Navigation principale"
        >
          {/* Logo */}
          <button
            type="button"
            onClick={() => onNavigate({ name: "home" })}
            className="font-display text-2xl font-bold tracking-tight flex-shrink-0"
            aria-label="Retour à l'accueil Dedco"
          >
            <span className="text-terracotta">Dedco</span><span className="text-amber">.</span>
          </button>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-5">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => onNavigate(link.route)}
                className={`text-sm font-medium transition-colors relative pb-1 ${
                  isActive(link.route)
                    ? "text-amber border-b-2 border-amber"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search */}
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Rechercher"
              title="Rechercher"
              className="w-10 h-10 rounded-full flex items-center justify-center text-ink-soft hover:bg-warm hover:text-ink transition-colors"
            >
              <Search size={20} />
            </button>
            {/* Favoris — desktop only si connecté */}
            {currentUser && (
              <button
                type="button"
                onClick={onOpenFavorites}
                aria-label="Mes favoris"
                title="Mes favoris"
                className="hidden lg:flex relative w-10 h-10 rounded-full items-center justify-center text-ink-soft hover:bg-warm hover:text-ink transition-colors"
              >
                <Heart size={20} />
                {favCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-terracotta" />
                )}
              </button>
            )}
            {/* Panier — toujours visible */}
            <button
              type="button"
              onClick={onOpenCart}
              aria-label="Mon panier"
              title="Mon panier"
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-ink-soft hover:bg-warm hover:text-ink transition-colors"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-amber text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            {/* ── Cloche notifications — si connecté ── */}
            {currentUser && (
              <NotificationBell navigate={navigate} />
            )}
            {/* ── BLOC 8 — Distinction visiteur / connecté ── */}
            <div className="hidden lg:block">
              <UserMenu currentUser={currentUser} navigate={navigate} logout={logout} />
            </div>
            {/* Avatar/profil — mobile only si connecté */}
            {currentUser && (
              <button
                type="button"
                onClick={() => navigate({ page: ROLE_DASHBOARD[currentUser.role] } as AppRoute)}
                aria-label="Mon espace"
                className="lg:hidden w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </button>
            )}
            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
              className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-ink hover:bg-warm"
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="relative w-72 max-w-[80vw] bg-cream h-full dedco-slide-in-right flex flex-col">
            <div className="h-16 px-4 flex items-center justify-between border-b border-border">
              <span className="font-display text-xl font-bold">
                <span className="text-terracotta">Dedco</span><span className="text-amber">.</span>
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer le menu"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-warm"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => {
                    onNavigate(link.route);
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-base font-medium transition-colors ${
                    isActive(link.route)
                      ? "text-amber bg-amber-pale/50"
                      : "text-ink hover:bg-warm"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-border">
              {currentUser ? (
                <>
                  {/* Connecté sur mobile */}
                  <div className="flex items-center gap-3 mb-3">
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{currentUser.name}</p>
                      <p className="text-xs text-ink-mute truncate">{currentUser.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigate({ page: ROLE_DASHBOARD[currentUser.role] } as AppRoute);
                      setMobileOpen(false);
                    }}
                    className="dedco-btn dedco-btn-primary w-full mb-2"
                  >
                    Mon espace
                  </button>
                  {/* Liens rapides projets/commandes — CLIENT uniquement.
                      Les artisans/designers sont enfermés dans leur dashboard
                      (la sidebar gère toute la navigation). */}
                  {currentUser.role === "client" && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigate({ page: "client-projets" });
                          setMobileOpen(false);
                        }}
                        className="dedco-btn dedco-btn-ghost w-full text-sm"
                      >
                        Mes projets
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigate({ page: "order-history" });
                          setMobileOpen(false);
                        }}
                        className="dedco-btn dedco-btn-ghost w-full text-sm"
                      >
                        Mes commandes
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="dedco-btn dedco-btn-ghost w-full text-terracotta"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  {/* Pas connecté sur mobile */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigate({ page: "login" });
                        setMobileOpen(false);
                      }}
                      className="dedco-btn dedco-btn-ghost w-full"
                    >
                      Connexion
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigate({ page: "register" });
                        setMobileOpen(false);
                      }}
                      className="dedco-btn dedco-btn-secondary w-full"
                    >
                      S'inscrire
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// Bottom mobile nav (like prototype)
// ============================================================

const BOTTOM_NAV: {
  label: string;
  icon: React.ReactNode;
  route: Route;
}[] = [
  {
    label: "Accueil",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12l9-9 9 9v9a2 2 0 0 1-2 2h-4v-6H10v6H6a2 2 0 0 1-2-2z" />
      </svg>
    ),
    route: { name: "home" },
  },
  {
    label: "Inspirations",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    route: { name: "inspirations" },
  },
  {
    label: "Marketplace",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    route: { name: "marketplace" },
  },
  {
    label: "Designers",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a7 7 0 0 1 7 7c0 3-2 5-3 7H8c-1-2-3-4-3-7a7 7 0 0 1 7-7z" />
        <path d="M9 21h6" />
      </svg>
    ),
    route: { name: "designers" },
  },
];

export function BottomNav({
  currentRoute,
  onNavigate,
}: {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
}) {
  return (
    <nav
      aria-label="Navigation mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border safe-bottom"
      style={{ boxShadow: "0 -2px 12px rgba(30, 24, 19, 0.06)" }}
    >
      <div className="grid grid-cols-4">
        {BOTTOM_NAV.map((item) => {
          const active = currentRoute.name === item.route.name;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavigate(item.route)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                active ? "text-amber" : "text-ink-mute"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================================
// Footer
// ============================================================

export function Footer({
  onNavigate,
}: {
  onNavigate: (route: Route) => void;
}) {
  const navigate = useDedcoStore((s) => s.navigate);

  return (
    <footer
      className="mt-auto text-white pt-12 pb-16 lg:pb-12"
      style={{ backgroundColor: "var(--text-1)", color: "rgba(255,255,255,0.7)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2 lg:col-span-1">
            <div className="font-display text-2xl font-bold text-white mb-3">
              <span className="text-terracotta">Dedco</span><span className="text-amber">.</span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              La marketplace béninoise de l'artisanat d'aménagement intérieur.
              Créateurs vérifiés, paiement sécurisé, livraison tracée.
            </p>
            <div className="flex gap-3">
              {["Instagram", "Facebook", "WhatsApp"].map((s) => (
                <button
                  key={s}
                  type="button"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-amber hover:text-white transition-colors flex items-center justify-center text-[10px] font-semibold"
                  aria-label={s}
                >
                  {s[0]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Explorer</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button type="button" onClick={() => onNavigate({ name: "marketplace" })} className="hover:text-amber transition-colors">
                  Marketplace
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate({ name: "inspirations" })} className="hover:text-amber transition-colors">
                  Inspirations
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate({ name: "designers" })} className="hover:text-amber transition-colors">
                  Designers
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate({ page: "artisans" })} className="hover:text-amber transition-colors">
                  Artisans
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate({ name: "magazine" })} className="hover:text-amber transition-colors">
                  Magazine
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Artisans</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button type="button" onClick={() => navigate({ page: "become-artisan" })} className="hover:text-amber transition-colors">
                  Devenir artisan
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate({ page: "become-artisan" })} className="hover:text-amber transition-colors">
                  Niveaux de confiance
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate({ name: "marketplace" })} className="hover:text-amber transition-colors">
                  Abonnements
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate({ page: "help-center" })} className="hover:text-amber transition-colors">
                  Centre d'aide
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">À propos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button type="button" onClick={() => navigate({ page: "about" })} className="hover:text-amber transition-colors">
                  Notre mission
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate({ page: "about" })} className="hover:text-amber transition-colors">
                  Sécurité & confiance
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate({ page: "help-center" })} className="hover:text-amber transition-colors">
                  CGU & CGV
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate({ page: "plans-tarifs" })} className="hover:text-amber transition-colors">
                  Plans et tarifs
                </button>
              </li>
              {/* BLOC 8 — Contact → support (help-center) au lieu de messages (DM) */}
              <li>
                <button type="button" onClick={() => navigate({ page: "help-center" })} className="hover:text-amber transition-colors">
                  Contact support
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">
              Newsletter
            </h4>
            <p className="text-sm mb-3">
              Inspirations déco et nouveaux artisans chaque semaine.
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Votre email"
                aria-label="Votre adresse email"
                className="flex-1 min-w-0 px-3 py-2 rounded-md bg-white/10 text-white text-sm placeholder-white/50 border border-white/30 focus:outline-none focus:border-terracotta"
              />
              <button
                type="submit"
                className="dedco-btn dedco-btn-primary dedco-btn-sm"
              >
                OK
              </button>
            </form>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <p>© 2026 Dedco · Tous droits réservés</p>
            <span className="opacity-30">|</span>
            <p className="flex items-center gap-1.5 opacity-70">
              {/* Couleurs du drapeau béninois : vert, jaune, rouge */}
              <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: '#008751' }} />
              <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: '#FCD116' }} />
              <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: '#E8112D' }} />
              Cotonou, Bénin 🇧🇯
            </p>
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={() => navigate({ page: "about" })} className="hover:text-amber transition-colors">
              Mentions légales
            </button>
            <button type="button" onClick={() => navigate({ page: "settings" })} className="hover:text-amber transition-colors">
              Confidentialité
            </button>
            <button type="button" onClick={() => navigate({ page: "help-center" })} className="hover:text-amber transition-colors">
              Cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// Back button used in detail pages
// ============================================================

export function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-amber transition-colors mb-4 font-medium"
    >
      <ChevronLeft size={16} /> Retour
    </button>
  );
}
