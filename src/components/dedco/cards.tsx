"use client";

import { memo, useMemo } from "react";
import Image from "next/image";
import { Star, BadgeCheck, MapPin, Table2, Armchair, Lightbulb, Layers, Flower2, BookOpen, Sofa, BedDouble, Archive, Lamp, Frame } from "lucide-react";
import { formatFCFA, getArtisan } from "@/lib/dedco-data";
import { useReviewStore, useArtisanRating, useProductRating } from "@/lib/review-store";
import type { Product } from "@/lib/dedco-types";

// ============================================================
// Shared small components
// ============================================================

export function Stars({
  rating,
  size = 14,
  className = "",
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(rating) ? "star" : "star empty"}
          fill={i < Math.round(rating) ? "currentColor" : "none"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export function LevelBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    N1: "dedco-badge-gray",
    N2: "dedco-badge-forest",
    N3: "dedco-badge-terra",
    N4: "dedco-badge-terra-solid",
  };
  return <span className={`dedco-badge ${styles[level] || ""}`}>{level}</span>;
}

export function BadgeCheckIcon({ verified }: { verified: boolean }) {
  if (!verified) return null;
  return (
    <BadgeCheck
      size={14}
      className="text-forest inline-block"
      fill="var(--forest-pale)"
    />
  );
}

// ============================================================
// Product Card
// ============================================================

export const ProductCard = memo(function ProductCard({
  product,
  isFav,
  onToggleFav,
  onOpen,
}: {
  product: Product;
  isFav: boolean;
  onToggleFav: (id: number) => void;
  onOpen: (id: number) => void;
}) {
  const artisan = getArtisan(product.artisanId);
  // ── Note depuis review-store (pas le mock product.rating) ──
  const allReviews = useReviewStore((s) => s.reviews);
  const stats = useMemo(() => {
    const rs = allReviews.filter((r) => r.productId === product.id);
    if (rs.length === 0) return { rating: 0, count: 0 };
    const sum = rs.reduce((acc, r) => acc + r.rating, 0);
    return {
      rating: Math.round((sum / rs.length) * 10) / 10,
      count: rs.length,
    };
  }, [allReviews, product.id]);

  return (
    <article
      className="dedco-card overflow-hidden cursor-pointer group"
      onClick={() => onOpen(product.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(product.id);
        }
      }}
      aria-label={`Voir le produit ${product.name}`}
    >
      <div className="relative aspect-square overflow-hidden bg-warm">
        {product.badge && (
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
            <span className="dedco-badge dedco-badge-terra-solid">
              {product.badge}
            </span>
          </div>
        )}
        <button
          type="button"
          aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
          className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isFav ? "bg-card text-terracotta" : "bg-white/60 text-ink-soft"
          } hover:bg-card hover:scale-110`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav(product.id);
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={isFav ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-3 sm:p-3.5">
        {artisan && (
          <div className="text-xs text-ink-mute mb-1 truncate flex items-center gap-1">
            <span>Par {artisan.name}</span>
          </div>
        )}
        <h3 className="font-display font-semibold text-[15px] leading-tight mb-1.5 line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-1.5">
          <span className="font-numeric font-bold text-base text-amber">
            {formatFCFA(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-ink-mute line-through">
              {formatFCFA(product.originalPrice)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-1 text-xs text-ink-soft">
            {stats.count > 0 ? (
              <>
                <Stars rating={stats.rating} size={12} />
                <span className="font-numeric">
                  {stats.rating} ({stats.count})
                </span>
              </>
            ) : (
              <span className="text-ink-mute italic">Nouveau · 0 avis</span>
            )}
          </div>
          {product.stock <= 3 && product.stock > 0 && (
            <span className="dedco-badge dedco-badge-terra text-[10px]">
              Plus que {product.stock}
            </span>
          )}
          {product.stock === 0 && (
            <span className="dedco-badge dedco-badge-gray text-[10px]">
              Sur commande
            </span>
          )}
        </div>
      </div>
    </article>
  );
});

// ============================================================
// Scene Card
// ============================================================

export const SceneCard = memo(function SceneCard({
  scene,
  onOpen,
  onToggleSave,
  isSaved,
  className = "",
  style,
}: {
  scene: {
    slug: string;
    title: string;
    style: string;
    room: string;
    image: string;
    tags: string[];
    saves: number;
  };
  onOpen: (slug: string) => void;
  onToggleSave?: (slug: string) => void;
  isSaved?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <article
      className={`dedco-card overflow-hidden cursor-pointer group relative ${className}`}
      style={style}
      onClick={() => onOpen(scene.slug)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(scene.slug);
        }
      }}
      aria-label={`Voir la scène ${scene.title}`}
    >
      <div
        className="relative w-full overflow-hidden bg-warm"
        style={{ aspectRatio: "4 / 5" }}
      >
        <img
          src={scene.image}
          alt={scene.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(30,24,19,0.75) 0%, transparent 55%)",
          }}
        />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
          <span className="dedco-badge dedco-badge-white text-[10px]">
            {scene.room}
          </span>
        </div>
        {onToggleSave && (
          <button
            type="button"
            aria-label={isSaved ? "Retirer des favoris" : "Sauvegarder"}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isSaved
                ? "bg-card text-terracotta"
                : "bg-white/60 text-ink-soft"
            } hover:bg-card`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(scene.slug);
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={isSaved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <h3 className="font-display text-base font-semibold leading-tight mb-0.5">
            {scene.title}
          </h3>
          <p className="text-xs text-white/70">{scene.style}</p>
        </div>
      </div>
    </article>
  );
});

// ============================================================
// Artisan Card
// ============================================================

export const ArtisanCard = memo(function ArtisanCard({
  artisan,
  onOpen,
}: {
  artisan: import("@/lib/dedco-types").Artisan;
  onOpen: (id: number) => void;
}) {
  return (
    <article
      className="dedco-card p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onOpen(artisan.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(artisan.id);
        }
      }}
      aria-label={`Voir le profil de ${artisan.name}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <img
          src={artisan.avatar}
          alt={artisan.name}
          loading="lazy"
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display font-semibold text-[15px] truncate">
              {artisan.name}
            </h3>
            {artisan.verified && <BadgeCheckIcon verified />}
          </div>
          <p className="text-xs text-ink-soft truncate">{artisan.specialty}</p>
          <p className="text-xs text-ink-mute flex items-center gap-1 mt-0.5">
            <MapPin size={11} /> {artisan.city}
          </p>
        </div>
        <LevelBadge level={artisan.level} />
      </div>
      <div className="flex gap-4 mb-3 text-xs text-ink-soft">
        <div>
          <span className="font-bold text-ink font-numeric">{artisan.rating}</span> ·{" "}
          <span className="font-numeric">{artisan.reviews}</span> avis
        </div>
        <div>
          <span className="font-bold text-ink font-numeric">{artisan.experience}</span>{" "}
          d'expérience
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 rounded-md overflow-hidden">
        {artisan.portfolio.slice(0, 3).map((img, i) => (
          <div key={i} className="aspect-square bg-warm overflow-hidden">
            <img
              src={img}
              alt={`Réalisation ${i + 1} de ${artisan.name}`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </article>
  );
});

// ============================================================
// Designer Card
// ============================================================

export const DesignerCard = memo(function DesignerCard({
  designer,
  onOpen,
}: {
  designer: import("@/lib/dedco-types").Designer;
  onOpen: (id: number) => void;
}) {
  return (
    <article
      className="dedco-card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
      onClick={() => onOpen(designer.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(designer.id);
        }
      }}
      aria-label={`Voir le profil de ${designer.name}`}
    >
      <div
        className="relative aspect-[16/9] overflow-hidden bg-warm"
        style={{ background: "var(--bg-warm)" }}
      >
        <img
          src={designer.cover}
          alt={`Réalisation de ${designer.name}`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(30,24,19,0.6) 0%, transparent 60%)",
          }}
        />
      </div>
      <div className="p-4 -mt-8 relative">
        <img
          src={designer.avatar}
          alt={designer.name}
          loading="lazy"
          className="w-14 h-14 rounded-full object-cover border-2 border-white mb-2"
        />
        <h3 className="font-display font-bold text-base">{designer.name}</h3>
        <p className="text-xs text-ink-soft mb-2">{designer.specialty}</p>
        <div className="flex items-center gap-3 text-xs text-ink-soft mb-3">
          <div className="flex items-center gap-1">
            <Stars rating={designer.rating} size={11} />
            <span className="font-numeric">
              {designer.rating} ({designer.reviews})
            </span>
          </div>
          <span>·</span>
          <span className="font-numeric">{designer.projects} projets</span>
          <span>·</span>
          <span>{designer.city}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="dedco-badge dedco-badge-amber">
            {designer.style}
          </span>
          <span className="text-xs text-ink-soft">
            Dès{" "}
            <strong className="text-amber font-numeric">
              {formatFCFA(designer.hourlyRate)}
            </strong>
            <span className="block text-[10px] text-ink-mute">cadrage</span>
          </span>
        </div>
      </div>
    </article>
  );
});

// ============================================================
// Magazine Card
// ============================================================

export const MagazineCard = memo(function MagazineCard({
  article,
  onOpen,
}: {
  article: import("@/lib/dedco-types").Magazine;
  onOpen?: (id: number) => void;
}) {
  return (
    <article
      className="dedco-card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
      onClick={() => onOpen?.(article.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(article.id);
        }
      }}
      aria-label={`Lire l'article ${article.title}`}
    >
      <div className="aspect-[16/9] overflow-hidden bg-warm">
        <img
          src={article.image}
          alt={article.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-ink-mute mb-2">
          <span className="dedco-badge dedco-badge-amber">
            {article.category}
          </span>
          <span>·</span>
          <span>{article.readTime}</span>
        </div>
        <h3 className="font-display font-bold text-base leading-tight mb-1.5 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-sm text-ink-soft line-clamp-2 mb-2">
          {article.excerpt}
        </p>
        <p className="text-xs text-ink-mute">
          {article.author} · {article.date}
        </p>
      </div>
    </article>
  );
});

// ============================================================
// Category Card
// ============================================================

export const CategoryCard = memo(function CategoryCard({
  category,
  onOpen,
}: {
  category: import("@/lib/dedco-types").Category;
  onOpen: (slug: string) => void;
}) {
  const ICON_MAP: Record<string, typeof Table2> = {
    Table2, Armchair, Lightbulb, Layers, Flower2, BookOpen, Sofa, BedDouble,
    Archive, Lamp, Frame, Vase: Flower2,
  };
  const CatIcon = ICON_MAP[category.icon] || Table2;

  return (
    <button
      type="button"
      onClick={() => onOpen(category.slug)}
      className="dedco-card p-4 sm:p-5 text-center hover:shadow-lg hover:border-amber transition-all cursor-pointer group flex flex-col items-center justify-center gap-2 h-full min-h-[120px]"
    >
      <div className="w-11 h-11 rounded-full bg-[var(--amber-pale)] flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
        <CatIcon size={22} className="text-[var(--amber)]" strokeWidth={1.5} />
      </div>
      <h3 className="font-display font-semibold text-xs sm:text-sm leading-tight text-center break-words w-full">
        {category.name}
      </h3>
      <p className="text-xs text-[var(--text-3)] font-numeric">
        {category.count} {category.count > 1 ? "produits" : "produit"}
      </p>
    </button>
  );
});

// ============================================================
// RATING BADGES — affichent la note réelle depuis review-store
// Utilisés dans les listes (artisans-page, search-page, etc.)
// où on ne peut pas appeler useArtisanRating/useProductRating
// directement dans un .map()
// ============================================================

export function ArtisanRatingBadge({ artisanId, showCount = true }: { artisanId: number; showCount?: boolean }) {
  const stats = useArtisanRating(artisanId);
  if (stats.count === 0) {
    return <span className="text-ink-mute italic text-xs">Pas encore d'avis</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
      <Stars rating={stats.rating} size={11} />
      <span className="font-numeric font-semibold">{stats.rating}</span>
      {showCount && <span className="text-ink-mute font-numeric">({stats.count})</span>}
    </span>
  );
}

export function ProductRatingBadge({ productId, showCount = true }: { productId: number; showCount?: boolean }) {
  const stats = useProductRating(productId);
  if (stats.count === 0) {
    return <span className="text-ink-mute italic text-xs">Nouveau · 0 avis</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
      <Stars rating={stats.rating} size={11} />
      <span className="font-numeric font-semibold">{stats.rating}</span>
      {showCount && <span className="text-ink-mute font-numeric">({stats.count})</span>}
    </span>
  );
}
