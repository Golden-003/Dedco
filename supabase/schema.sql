-- ═══════════════════════════════════════════════════════════════
-- DEDCO — Schéma de base de données Supabase (v2 — complet)
-- Marketplace béninoise d'artisanat + brief sur-mesure (artisan/designer)
-- À exécuter dans Supabase → SQL Editor → New query
--
-- Ce fichier remplace la version prototype (6 tables). Il couvre
-- l'intégralité du modèle métier observé dans le code du site web
-- (types TS, stores Zustand, machines d'états, pages mock) afin de
-- servir de backend unique pour le site web ET l'app mobile React
-- Native.
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════
-- 0. FONCTIONS UTILITAIRES
-- ═══════════════════════════════════════════════════════════════

-- updated_at automatique
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Identifiants métiers lisibles (BRA-000001, CMD-000042, ...)
-- Stockés dans une colonne `display_id` séparée de la PK uuid.
CREATE OR REPLACE FUNCTION public.set_display_id()
RETURNS TRIGGER AS $$
DECLARE
  prefix  text := TG_ARGV[0];
  seqname text := TG_ARGV[1];
  n       bigint;
BEGIN
  IF NEW.display_id IS NULL THEN
    EXECUTE format('SELECT nextval(%L)', seqname) INTO n;
    NEW.display_id := prefix || '-' || lpad(n::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- NOTE : les fonctions helper RLS (is_admin, owns_artisan, owns_designer,
-- current_role_name) sont définies plus bas (juste avant la section 20),
-- une fois que `profiles`, `artisans` et `designers` existent — une
-- fonction LANGUAGE sql est validée contre le catalogue dès sa création,
-- contrairement à plpgsql.

-- ═══════════════════════════════════════════════════════════════
-- 1. ENUMS
-- ═══════════════════════════════════════════════════════════════

CREATE TYPE user_role AS ENUM ('client','artisan','designer','maison','admin');
CREATE TYPE artisan_level AS ENUM ('N1','N2','N3','N4');
CREATE TYPE subscription_plan AS ENUM ('gratuit','pro','boutique');
CREATE TYPE subscription_status AS ENUM ('active','expired','cancelled');

CREATE TYPE order_status AS ENUM ('pending','payé','en_fabrication','expédié','livré','litige','annulé');
CREATE TYPE order_type AS ENUM ('marketplace','custom');

CREATE TYPE brief_artisan_status AS ENUM (
  'DRAFT','SUBMITTED','NEEDS_INFO','UNDER_REVIEW','PUBLISHED','PROPOSALS_RECEIVED',
  'IN_DISCUSSION','ARTISAN_SELECTED','AWAITING_DEPOSIT','CONVERTED_TO_PROJECT',
  'EXPIRED','CANCELLED','CLOSED'
);
CREATE TYPE proposal_status AS ENUM ('pending','accepted','rejected','withdrawn');

CREATE TYPE project_artisan_status AS ENUM (
  'AWAITING_DEPOSIT','CONFIRMED','PREPARATION','IN_PRODUCTION','UPDATE_REQUIRED',
  'CHANGE_REQUEST_PENDING','READY_FOR_DELIVERY','DELIVERY_SCHEDULED','IN_TRANSIT',
  'DELIVERED_PENDING_CONFIRMATION','DELIVERED_CONFIRMED','PAYMENT_RELEASED',
  'COMPLAINT_OPENED','DISPUTE','COMPLETED','CANCELLED'
);
CREATE TYPE change_request_status AS ENUM (
  'CHANGE_REQUESTED','CHANGE_PENDING_CLIENT','CHANGE_ACCEPTED','CHANGE_REJECTED','CHANGE_CANCELLED'
);
CREATE TYPE milestone_type AS ENUM ('PREPARATION','IN_PRODUCTION','READY_FOR_DELIVERY','DELIVERY');
CREATE TYPE milestone_status AS ENUM ('pending','in_progress','done');

CREATE TYPE brief_designer_status AS ENUM (
  'DRAFT','SUBMITTED','NEEDS_INFO','PENDING_DESIGNER_RESPONSE','ACCEPTED','DECLINED',
  'AWAITING_PAYMENT','BOOKING_CONFIRMED','KICKOFF_SCHEDULED','CONVERTED_TO_DESIGN_PROJECT',
  'CANCELLED','EXPIRED'
);
CREATE TYPE design_project_status AS ENUM (
  'KICKOFF_SCHEDULED','IN_PROGRESS','DELIVERABLE_READY','DELIVERED_PENDING_VALIDATION',
  'COMPLETED','CANCELLED'
);
CREATE TYPE project_scope AS ENUM ('prototype','standard','premium');
CREATE TYPE meeting_mode AS ENUM ('visio','presentiel','tel');

CREATE TYPE dispute_status AS ENUM ('OPEN','WAITING_ARTISAN','WAITING_CLIENT','UNDER_REVIEW','RESOLVED','CLOSED');
CREATE TYPE kyc_status AS ENUM ('none','pending','verified','rejected');
CREATE TYPE kyc_step AS ENUM ('identity','address','selfie','confirmation');

CREATE TYPE notification_type AS ENUM (
  'brief_artisan','brief_designer','project','message','payment','delivery',
  'review','system','litige','order'
);

CREATE TYPE wallet_txn_type AS ENUM ('credit','debit');
CREATE TYPE wallet_txn_status AS ENUM ('completed','pending','failed');

CREATE TYPE conversation_context AS ENUM ('project_artisan','design_project','order','direct','dispute');
CREATE TYPE payment_provider AS ENUM ('mtn','moov');

-- ═══════════════════════════════════════════════════════════════
-- 2. PROFILS UTILISATEURS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role NOT NULL DEFAULT 'client',
  first_name    TEXT,
  last_name     TEXT,
  email         TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  city          TEXT,
  kyc_status    kyc_status NOT NULL DEFAULT 'none',
  locale        TEXT DEFAULT 'fr',
  push_token    TEXT,                    -- legacy simple, voir device_tokens pour multi-device
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-création du profil à l'inscription Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.email,''), '@', 1)),
    NEW.phone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Device tokens (push notifications multi-appareils — app mobile)
CREATE TABLE public.device_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  platform    TEXT NOT NULL CHECK (platform IN ('ios','android','web')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- ═══════════════════════════════════════════════════════════════
-- 3. PROFILS PROFESSIONNELS — ARTISANS & DESIGNERS
-- ═══════════════════════════════════════════════════════════════
-- Le rôle "maison" (hybride) possède une ligne dans artisans ET dans
-- designers, toutes deux liées au même profile_id.

CREATE TABLE public.artisans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_id      TEXT UNIQUE,             -- ART-000001
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  avatar_url      TEXT,
  cover_url       TEXT,
  specialty       TEXT,
  city            TEXT,
  level           artisan_level DEFAULT 'N1',
  rating          NUMERIC(2,1) DEFAULT 0,
  reviews_count   INTEGER DEFAULT 0,
  products_count  INTEGER DEFAULT 0,
  bio             TEXT,
  experience      TEXT,
  portfolio       TEXT[] DEFAULT '{}',
  trust_score     INTEGER DEFAULT 0,
  verified        BOOLEAN DEFAULT FALSE,
  subscription_plan subscription_plan DEFAULT 'gratuit',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE SEQUENCE seq_art;
CREATE TRIGGER trg_artisans_display_id BEFORE INSERT ON public.artisans
  FOR EACH ROW EXECUTE FUNCTION public.set_display_id('ART','seq_art');
CREATE TRIGGER trg_artisans_updated_at BEFORE UPDATE ON public.artisans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.designers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_id      TEXT UNIQUE,             -- DES-000001
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  avatar_url      TEXT,
  cover_url       TEXT,
  specialty       TEXT,
  city            TEXT,
  hourly_rate     INTEGER,
  rating          NUMERIC(2,1) DEFAULT 0,
  reviews_count   INTEGER DEFAULT 0,
  projects_count  INTEGER DEFAULT 0,
  bio             TEXT,
  style           TEXT,
  verified        BOOLEAN DEFAULT FALSE,
  subscription_plan subscription_plan DEFAULT 'gratuit',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE SEQUENCE seq_des;
CREATE TRIGGER trg_designers_display_id BEFORE INSERT ON public.designers
  FOR EACH ROW EXECUTE FUNCTION public.set_display_id('DES','seq_des');
CREATE TRIGGER trg_designers_updated_at BEFORE UPDATE ON public.designers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type  TEXT NOT NULL CHECK (owner_type IN ('artisan','designer')),
  owner_id    UUID NOT NULL,              -- artisans.id ou designers.id
  plan        subscription_plan NOT NULL,
  status      subscription_status NOT NULL DEFAULT 'active',
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 4. CATALOGUE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id     UUID REFERENCES public.artisans(id) ON DELETE SET NULL,
  category_id    INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  price          INTEGER NOT NULL,
  original_price INTEGER,
  rating         NUMERIC(2,1) DEFAULT 0,
  reviews_count  INTEGER DEFAULT 0,
  materials      TEXT[] DEFAULT '{}',
  colors         TEXT[] DEFAULT '{}',
  tags           TEXT[] DEFAULT '{}',
  stock          INTEGER DEFAULT 1,
  delay_days     INTEGER DEFAULT 7,
  badge          TEXT,
  badge_color    TEXT DEFAULT 'amber',
  is_new         BOOLEAN DEFAULT FALSE,
  is_active      BOOLEAN DEFAULT TRUE,
  description    TEXT,
  dimensions     TEXT,
  weight         TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  sort_order  INTEGER DEFAULT 0
);

CREATE TABLE public.scenes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id  UUID REFERENCES public.designers(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  room         TEXT NOT NULL,
  style        TEXT,
  image_url    TEXT NOT NULL,
  tag_label    TEXT,
  count_label  TEXT,
  saves        INTEGER DEFAULT 0,
  is_featured  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.scene_hotspots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id    UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE,
  x           NUMERIC NOT NULL,   -- position % (0-100)
  y           NUMERIC NOT NULL
);

CREATE TABLE public.magazine_articles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  category    TEXT,
  author      TEXT,
  read_time   TEXT,
  image_url   TEXT,
  excerpt     TEXT,
  content     TEXT,
  featured    BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  subtitle    TEXT,
  image_url   TEXT NOT NULL,
  cta_label   TEXT,
  cta_route   JSONB,             -- { "page": "marketplace-category", "category": "tables" }
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 5. FAVORIS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE public.saved_scenes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  scene_id    UUID REFERENCES public.scenes(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, scene_id)
);

-- ═══════════════════════════════════════════════════════════════
-- 6. ADRESSES & MOYENS DE PAIEMENT
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name  TEXT,
  last_name   TEXT,
  phone       TEXT,
  ville       TEXT,
  quartier    TEXT,
  indication  TEXT,
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.payment_methods (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider      payment_provider NOT NULL,
  phone_number  TEXT NOT NULL,
  is_default    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 7. COMMANDES MARKETPLACE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id      TEXT UNIQUE,               -- CMD-000001
  invoice_id      TEXT UNIQUE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            order_type NOT NULL DEFAULT 'marketplace',
  status          order_status NOT NULL DEFAULT 'pending',
  subtotal        INTEGER NOT NULL,
  shipping        INTEGER DEFAULT 0,
  garantie        INTEGER DEFAULT 0,
  total           INTEGER NOT NULL,
  payment_method  TEXT,
  payment_ref     TEXT,
  address_id      UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  delivery_first_name TEXT,
  delivery_last_name  TEXT,
  delivery_phone      TEXT,
  delivery_ville      TEXT,
  delivery_quartier   TEXT,
  delivery_indication TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  delivered_at    TIMESTAMPTZ
);
CREATE SEQUENCE seq_cmd;
CREATE TRIGGER trg_orders_display_id BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_display_id('CMD','seq_cmd');
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES public.products(id) ON DELETE SET NULL,
  artisan_id  UUID REFERENCES public.artisans(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,        -- snapshot au moment de l'achat
  price       INTEGER NOT NULL,     -- snapshot
  qty         INTEGER NOT NULL DEFAULT 1,
  color       TEXT,
  image       TEXT,
  dimensions  TEXT
);

CREATE TABLE public.order_timeline (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  done        BOOLEAN DEFAULT FALSE,
  sort_order  INTEGER DEFAULT 0,
  happened_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════════
-- 8. AVIS (marketplace + sur-mesure)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  project_id        UUID,                 -- projects_artisan.id ou design_projects.id (voir project_type)
  project_type      TEXT CHECK (project_type IN ('artisan','design')),
  product_id        UUID REFERENCES public.products(id) ON DELETE SET NULL,
  artisan_id        UUID REFERENCES public.artisans(id) ON DELETE SET NULL,
  designer_id       UUID REFERENCES public.designers(id) ON DELETE SET NULL,
  author_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating            SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  sub_rating_qualite        SMALLINT CHECK (sub_rating_qualite BETWEEN 1 AND 5),
  sub_rating_delais         SMALLINT CHECK (sub_rating_delais BETWEEN 1 AND 5),
  sub_rating_communication  SMALLINT CHECK (sub_rating_communication BETWEEN 1 AND 5),
  comment           TEXT,
  verified          BOOLEAN DEFAULT TRUE,   -- toujours lié à une commande/projet réel
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 9. BRIEF ARTISAN — machine d'états (13 statuts)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.briefs_artisan (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id            TEXT UNIQUE,             -- BRA-000001
  client_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  description           TEXT,
  category              TEXT NOT NULL,
  zone                  TEXT,
  piece                 TEXT,
  style                 TEXT,
  dimensions            TEXT,
  materials             TEXT[] DEFAULT '{}',
  budget_min            INTEGER,
  budget_max            INTEGER,
  inspirations          TEXT[] DEFAULT '{}',    -- URLs images
  constraints           TEXT,
  status                brief_artisan_status NOT NULL DEFAULT 'DRAFT',
  selected_proposal_id  UUID,
  linked_project_id     UUID,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  expires_at            TIMESTAMPTZ
);
CREATE SEQUENCE seq_bra;
CREATE TRIGGER trg_briefs_artisan_display_id BEFORE INSERT ON public.briefs_artisan
  FOR EACH ROW EXECUTE FUNCTION public.set_display_id('BRA','seq_bra');
CREATE TRIGGER trg_briefs_artisan_updated_at BEFORE UPDATE ON public.briefs_artisan
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.brief_artisan_proposals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id          TEXT UNIQUE,             -- PROP-000001
  brief_id            UUID NOT NULL REFERENCES public.briefs_artisan(id) ON DELETE CASCADE,
  artisan_id          UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  price               INTEGER NOT NULL,
  delivery_time       TEXT,
  materials           TEXT,
  images              TEXT[] DEFAULT '{}',
  payment_conditions  TEXT,
  message             TEXT,
  status              proposal_status NOT NULL DEFAULT 'pending',
  submitted_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE SEQUENCE seq_prop;
CREATE TRIGGER trg_proposals_display_id BEFORE INSERT ON public.brief_artisan_proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_display_id('PROP','seq_prop');

ALTER TABLE public.briefs_artisan
  ADD CONSTRAINT fk_selected_proposal FOREIGN KEY (selected_proposal_id)
  REFERENCES public.brief_artisan_proposals(id) ON DELETE SET NULL;

CREATE TABLE public.brief_artisan_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id    UUID NOT NULL REFERENCES public.briefs_artisan(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  from_status brief_artisan_status,
  to_status   brief_artisan_status,
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 10. PROJET ARTISAN — sur-mesure post-brief (16 statuts)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.projects_artisan (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id        TEXT UNIQUE,             -- PRA-000001
  brief_id          UUID REFERENCES public.briefs_artisan(id) ON DELETE SET NULL,
  proposal_id       UUID REFERENCES public.brief_artisan_proposals(id) ON DELETE SET NULL,
  client_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artisan_id        UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  status            project_artisan_status NOT NULL DEFAULT 'AWAITING_DEPOSIT',
  title             TEXT NOT NULL,
  image             TEXT,
  price_initial     INTEGER NOT NULL,
  price_final       INTEGER NOT NULL,
  montant_paye      INTEGER DEFAULT 0,
  materiaux         TEXT,
  dimensions        TEXT,
  delai_initial     TEXT,
  delai_final       TEXT,
  quantite          INTEGER DEFAULT 1,
  livraison_adresse TEXT,
  livraison_phone   TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE SEQUENCE seq_pra;
CREATE TRIGGER trg_projects_artisan_display_id BEFORE INSERT ON public.projects_artisan
  FOR EACH ROW EXECUTE FUNCTION public.set_display_id('PRA','seq_pra');
CREATE TRIGGER trg_projects_artisan_updated_at BEFORE UPDATE ON public.projects_artisan
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.briefs_artisan
  ADD CONSTRAINT fk_linked_project FOREIGN KEY (linked_project_id)
  REFERENCES public.projects_artisan(id) ON DELETE SET NULL;

-- Jalons de fabrication (4 par projet : préparation, fabrication, prêt, livraison)
CREATE TABLE public.project_artisan_milestones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects_artisan(id) ON DELETE CASCADE,
  type          milestone_type NOT NULL,
  status        milestone_status NOT NULL DEFAULT 'pending',
  percentage    SMALLINT,
  photos        TEXT[] DEFAULT '{}',
  comment       TEXT,
  completed_at  TIMESTAMPTZ,
  UNIQUE(project_id, type)
);

-- Auto-création des 4 jalons à la création d'un projet artisan
CREATE OR REPLACE FUNCTION public.create_default_milestones()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_artisan_milestones (project_id, type) VALUES
    (NEW.id, 'PREPARATION'),
    (NEW.id, 'IN_PRODUCTION'),
    (NEW.id, 'READY_FOR_DELIVERY'),
    (NEW.id, 'DELIVERY');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_projects_artisan_create_milestones
  AFTER INSERT ON public.projects_artisan
  FOR EACH ROW EXECUTE FUNCTION public.create_default_milestones();

-- Demandes de modification en cours de projet
CREATE TABLE public.project_artisan_change_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id    TEXT UNIQUE,             -- MOD-000001
  project_id    UUID NOT NULL REFERENCES public.projects_artisan(id) ON DELETE CASCADE,
  field         TEXT NOT NULL,           -- materiaux | dimensions | prix | delai | couleur | quantite | livraison_adresse | ...
  label         TEXT,
  old_value     TEXT,
  new_value     TEXT,
  reason        TEXT,
  price_impact  INTEGER DEFAULT 0,
  delay_impact  TEXT,
  status        change_request_status NOT NULL DEFAULT 'CHANGE_REQUESTED',
  requested_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE SEQUENCE seq_mod;
CREATE TRIGGER trg_change_requests_display_id BEFORE INSERT ON public.project_artisan_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_display_id('MOD','seq_mod');

-- ═══════════════════════════════════════════════════════════════
-- 11. BRIEF DESIGNER — machine d'états (12 statuts)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.briefs_designer (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id      TEXT UNIQUE,             -- BRD-000001
  client_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  designer_id     UUID REFERENCES public.designers(id) ON DELETE SET NULL,
  piece           TEXT,
  style           TEXT,
  superficie      TEXT,
  budget_min      INTEGER,
  budget_max      INTEGER,
  description     TEXT,
  inspirations    TEXT[] DEFAULT '{}',
  status          brief_designer_status NOT NULL DEFAULT 'DRAFT',
  linked_project_id UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ
);
CREATE SEQUENCE seq_brd;
CREATE TRIGGER trg_briefs_designer_display_id BEFORE INSERT ON public.briefs_designer
  FOR EACH ROW EXECUTE FUNCTION public.set_display_id('BRD','seq_brd');
CREATE TRIGGER trg_briefs_designer_updated_at BEFORE UPDATE ON public.briefs_designer
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.brief_designer_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id    UUID NOT NULL REFERENCES public.briefs_designer(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  from_status brief_designer_status,
  to_status   brief_designer_status,
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 12. PROJET DESIGNER — prestation d'aménagement
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.design_projects (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id            TEXT UNIQUE,             -- PRD-000001
  brief_id              UUID REFERENCES public.briefs_designer(id) ON DELETE SET NULL,
  client_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  designer_id           UUID NOT NULL REFERENCES public.designers(id) ON DELETE CASCADE,
  scope                 project_scope NOT NULL DEFAULT 'standard',
  status                design_project_status NOT NULL DEFAULT 'KICKOFF_SCHEDULED',
  title                 TEXT NOT NULL,
  image                 TEXT,
  prestation_label      TEXT,
  prix                  INTEGER NOT NULL,
  montant_paye          INTEGER DEFAULT 0,
  solde                 INTEGER DEFAULT 0,
  livrables_promis      TEXT[] DEFAULT '{}',
  revisions_incluses    INTEGER DEFAULT 0,
  piece                 TEXT,
  style                 TEXT,
  superficie            TEXT,
  budget_conseil_min    INTEGER,
  budget_conseil_max    INTEGER,
  rdv_cadrage_at        TIMESTAMPTZ,
  rdv_cadrage_mode      meeting_mode,
  date_demarrage        DATE,
  date_livraison        DATE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE SEQUENCE seq_prd;
CREATE TRIGGER trg_design_projects_display_id BEFORE INSERT ON public.design_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_display_id('PRD','seq_prd');
CREATE TRIGGER trg_design_projects_updated_at BEFORE UPDATE ON public.design_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.briefs_designer
  ADD CONSTRAINT fk_designer_linked_project FOREIGN KEY (linked_project_id)
  REFERENCES public.design_projects(id) ON DELETE SET NULL;

CREATE TABLE public.design_project_deliverables (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.design_projects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  url           TEXT NOT NULL,
  version       INTEGER DEFAULT 1,
  delivered_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 13. LITIGES / RÉCLAMATIONS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.disputes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id        TEXT UNIQUE,             -- REC-000001
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id          UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  project_id        UUID,                    -- projects_artisan.id ou design_projects.id
  project_type      TEXT CHECK (project_type IN ('artisan','design')),
  artisan_id        UUID REFERENCES public.artisans(id) ON DELETE SET NULL,
  designer_id       UUID REFERENCES public.designers(id) ON DELETE SET NULL,
  motif             TEXT NOT NULL,
  description       TEXT,
  attachments       TEXT[] DEFAULT '{}',
  amount            INTEGER,
  status            dispute_status NOT NULL DEFAULT 'OPEN',
  dedco_decision    TEXT,
  opened_at         TIMESTAMPTZ DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ
);
CREATE SEQUENCE seq_rec;
CREATE TRIGGER trg_disputes_display_id BEFORE INSERT ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_display_id('REC','seq_rec');

CREATE TABLE public.dispute_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id    UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message       TEXT NOT NULL,
  attachments   TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 14. MESSAGERIE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context       conversation_context NOT NULL DEFAULT 'direct',
  context_id    UUID,                    -- project_artisan.id / design_project.id / order.id / dispute.id
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at    TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text            TEXT,
  image_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 15. MOODBOARDS (client / designer)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.moodboards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_moodboards_updated_at BEFORE UPDATE ON public.moodboards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.moodboard_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moodboard_id  UUID NOT NULL REFERENCES public.moodboards(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES public.products(id) ON DELETE SET NULL,
  image_url     TEXT,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 16. WALLET (artisan / designer)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.wallets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type  TEXT NOT NULL CHECK (owner_type IN ('artisan','designer')),
  owner_id    UUID NOT NULL,             -- artisans.id ou designers.id
  balance     INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_type, owner_id)
);
CREATE TRIGGER trg_wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.wallet_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id        TEXT UNIQUE,             -- TX-000001
  wallet_id         UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type              wallet_txn_type NOT NULL,
  label             TEXT NOT NULL,
  amount            INTEGER NOT NULL,        -- toujours positif, le signe est donné par `type`
  reference         TEXT,
  status            wallet_txn_status NOT NULL DEFAULT 'pending',
  related_order_id      UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  related_project_id    UUID,               -- projects_artisan.id ou design_projects.id
  related_project_type  TEXT CHECK (related_project_type IN ('artisan','design')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE SEQUENCE seq_tx;
CREATE TRIGGER trg_wallet_txn_display_id BEFORE INSERT ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_display_id('TX','seq_tx');

-- Auto-création du wallet à la création d'un profil artisan/designer
CREATE OR REPLACE FUNCTION public.create_wallet_for_professional()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (owner_type, owner_id) VALUES (TG_ARGV[0], NEW.id)
  ON CONFLICT (owner_type, owner_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_artisans_create_wallet AFTER INSERT ON public.artisans
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_professional('artisan');
CREATE TRIGGER trg_designers_create_wallet AFTER INSERT ON public.designers
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_professional('designer');

-- ═══════════════════════════════════════════════════════════════
-- 17. KYC (vérification identité artisan / designer)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.kyc_submissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  step              kyc_step NOT NULL DEFAULT 'identity',
  identity_doc_url  TEXT,
  address_doc_url   TEXT,
  selfie_url        TEXT,
  status            kyc_status NOT NULL DEFAULT 'pending',
  rejection_reason  TEXT,
  reviewed_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_kyc_updated_at BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- 18. NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id  TEXT UNIQUE,               -- NOT-000001
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  read        BOOLEAN DEFAULT FALSE,
  route       JSONB,                     -- { "page": "projet-detail", "projectId": "PRA-000012" }
  linked_id   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE SEQUENCE seq_not;
CREATE TRIGGER trg_notifications_display_id BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_display_id('NOT','seq_not');

-- ═══════════════════════════════════════════════════════════════
-- 19. INDEX DE PERFORMANCE
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_artisan ON public.products(artisan_id);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_product_images_product ON public.product_images(product_id);
CREATE INDEX idx_scenes_designer ON public.scenes(designer_id);
CREATE INDEX idx_scene_hotspots_scene ON public.scene_hotspots(scene_id);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_saved_scenes_user ON public.saved_scenes(user_id);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_timeline_order ON public.order_timeline(order_id);
CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_reviews_artisan ON public.reviews(artisan_id);
CREATE INDEX idx_reviews_designer ON public.reviews(designer_id);
CREATE INDEX idx_briefs_artisan_client ON public.briefs_artisan(client_id);
CREATE INDEX idx_briefs_artisan_status ON public.briefs_artisan(status);
CREATE INDEX idx_proposals_brief ON public.brief_artisan_proposals(brief_id);
CREATE INDEX idx_proposals_artisan ON public.brief_artisan_proposals(artisan_id);
CREATE INDEX idx_projects_artisan_client ON public.projects_artisan(client_id);
CREATE INDEX idx_projects_artisan_artisan ON public.projects_artisan(artisan_id);
CREATE INDEX idx_projects_artisan_status ON public.projects_artisan(status);
CREATE INDEX idx_milestones_project ON public.project_artisan_milestones(project_id);
CREATE INDEX idx_change_requests_project ON public.project_artisan_change_requests(project_id);
CREATE INDEX idx_briefs_designer_client ON public.briefs_designer(client_id);
CREATE INDEX idx_briefs_designer_designer ON public.briefs_designer(designer_id);
CREATE INDEX idx_design_projects_client ON public.design_projects(client_id);
CREATE INDEX idx_design_projects_designer ON public.design_projects(designer_id);
CREATE INDEX idx_disputes_user ON public.disputes(user_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);
CREATE INDEX idx_dispute_messages_dispute ON public.dispute_messages(dispute_id);
CREATE INDEX idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_moodboard_items_moodboard ON public.moodboard_items(moodboard_id);
CREATE INDEX idx_wallet_txn_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read);
CREATE INDEX idx_kyc_user ON public.kyc_submissions(user_id);

-- ═══════════════════════════════════════════════════════════════
-- 20. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

-- Rôle courant + helpers RLS (SECURITY DEFINER pour éviter la récursion RLS
-- : sans SECURITY DEFINER, une policy sur `profiles` qui interroge `profiles`
-- se re-déclenche elle-même). Définis ici, après les tables qu'ils lisent.
CREATE OR REPLACE FUNCTION public.current_role_name()
RETURNS text AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.owns_artisan(a_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.artisans WHERE id = a_id AND profile_id = auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.owns_designer(d_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.designers WHERE id = d_id AND profile_id = auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magazine_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefs_artisan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_artisan_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_artisan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects_artisan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_artisan_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_artisan_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefs_designer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_designer_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_project_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moodboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moodboard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ── Profils ──
-- Pas de lecture publique de `profiles` (contient email/téléphone) : la table
-- brute reste strictement owner+admin. Pour exposer nom/avatar dans les avis,
-- messages ou fiches artisan/designer, utiliser la vue publique ci-dessous.
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE VIEW public.profiles_public AS
  SELECT id, first_name, last_name, avatar_url, role FROM public.profiles;
GRANT SELECT ON public.profiles_public TO anon, authenticated;

CREATE POLICY "Users manage own device tokens" ON public.device_tokens FOR ALL USING (auth.uid() = user_id);

-- ── Artisans / Designers (profils pro publics) ──
CREATE POLICY "Public read artisans" ON public.artisans FOR SELECT USING (TRUE);
CREATE POLICY "Artisan updates own profile" ON public.artisans FOR UPDATE USING (profile_id = auth.uid() OR public.is_admin());
CREATE POLICY "Public read designers" ON public.designers FOR SELECT USING (TRUE);
CREATE POLICY "Designer updates own profile" ON public.designers FOR UPDATE USING (profile_id = auth.uid() OR public.is_admin());
CREATE POLICY "Owner reads own subscription" ON public.subscriptions FOR SELECT USING (
  public.owns_artisan(owner_id) OR public.owns_designer(owner_id) OR public.is_admin()
);

-- ── Catalogue (lecture publique) ──
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (TRUE);
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (is_active = TRUE OR public.is_admin() OR public.owns_artisan(artisan_id));
CREATE POLICY "Artisan manages own products" ON public.products FOR INSERT WITH CHECK (public.owns_artisan(artisan_id));
CREATE POLICY "Artisan updates own products" ON public.products FOR UPDATE USING (public.owns_artisan(artisan_id) OR public.is_admin());
CREATE POLICY "Artisan deletes own products" ON public.products FOR DELETE USING (public.owns_artisan(artisan_id) OR public.is_admin());
CREATE POLICY "Public read product images" ON public.product_images FOR SELECT USING (TRUE);
CREATE POLICY "Public read scenes" ON public.scenes FOR SELECT USING (TRUE);
CREATE POLICY "Public read hotspots" ON public.scene_hotspots FOR SELECT USING (TRUE);
CREATE POLICY "Public read magazine" ON public.magazine_articles FOR SELECT USING (TRUE);
CREATE POLICY "Public read active collections" ON public.collections FOR SELECT USING (is_active = TRUE OR public.is_admin());

-- ── Favoris / scènes sauvegardées (owner only) ──
CREATE POLICY "Users manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own saved scenes" ON public.saved_scenes FOR ALL USING (auth.uid() = user_id);

-- ── Adresses / paiement (owner only) ──
CREATE POLICY "Users manage own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own payment methods" ON public.payment_methods FOR ALL USING (auth.uid() = user_id);

-- ── Commandes ──
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING (
  auth.uid() = user_id OR public.is_admin()
  OR EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = orders.id AND public.owns_artisan(oi.artisan_id))
);
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin updates orders" ON public.orders FOR UPDATE USING (public.is_admin());
CREATE POLICY "Users read own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND (o.user_id = auth.uid() OR public.is_admin()))
  OR public.owns_artisan(artisan_id)
);
CREATE POLICY "Users read own order timeline" ON public.order_timeline FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_timeline.order_id AND (o.user_id = auth.uid() OR public.is_admin()))
);

-- ── Avis : lecture publique, écriture par l'auteur ──
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "Author inserts own review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = author_id);

-- ── Brief artisan ──
CREATE POLICY "Client manages own brief" ON public.briefs_artisan FOR ALL USING (
  client_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "Artisans read published briefs" ON public.briefs_artisan FOR SELECT USING (
  status IN ('PUBLISHED','PROPOSALS_RECEIVED','IN_DISCUSSION') AND public.current_role_name() IN ('artisan','maison')
);
CREATE POLICY "Client reads proposals on own brief" ON public.brief_artisan_proposals FOR SELECT USING (
  public.is_admin() OR public.owns_artisan(artisan_id)
  OR EXISTS (SELECT 1 FROM public.briefs_artisan b WHERE b.id = brief_artisan_proposals.brief_id AND b.client_id = auth.uid())
);
CREATE POLICY "Artisan submits proposal" ON public.brief_artisan_proposals FOR INSERT WITH CHECK (public.owns_artisan(artisan_id));
CREATE POLICY "Artisan updates own proposal" ON public.brief_artisan_proposals FOR UPDATE USING (public.owns_artisan(artisan_id));
CREATE POLICY "Read brief history if party" ON public.brief_artisan_history FOR SELECT USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.briefs_artisan b WHERE b.id = brief_artisan_history.brief_id AND b.client_id = auth.uid())
);

-- ── Projet artisan ──
CREATE POLICY "Party reads own artisan project" ON public.projects_artisan FOR SELECT USING (
  client_id = auth.uid() OR public.owns_artisan(artisan_id) OR public.is_admin()
);
CREATE POLICY "Artisan updates own project" ON public.projects_artisan FOR UPDATE USING (
  public.owns_artisan(artisan_id) OR client_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "Party reads milestones" ON public.project_artisan_milestones FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects_artisan p WHERE p.id = project_artisan_milestones.project_id
    AND (p.client_id = auth.uid() OR public.owns_artisan(p.artisan_id) OR public.is_admin()))
);
CREATE POLICY "Artisan updates milestones" ON public.project_artisan_milestones FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects_artisan p WHERE p.id = project_artisan_milestones.project_id AND public.owns_artisan(p.artisan_id))
);
CREATE POLICY "Party reads change requests" ON public.project_artisan_change_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects_artisan p WHERE p.id = project_artisan_change_requests.project_id
    AND (p.client_id = auth.uid() OR public.owns_artisan(p.artisan_id) OR public.is_admin()))
);
CREATE POLICY "Party creates change request" ON public.project_artisan_change_requests FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects_artisan p WHERE p.id = project_artisan_change_requests.project_id
    AND (p.client_id = auth.uid() OR public.owns_artisan(p.artisan_id)))
);
CREATE POLICY "Party updates change request" ON public.project_artisan_change_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects_artisan p WHERE p.id = project_artisan_change_requests.project_id
    AND (p.client_id = auth.uid() OR public.owns_artisan(p.artisan_id)))
);

-- ── Brief / projet designer (miroir du modèle artisan) ──
CREATE POLICY "Client manages own designer brief" ON public.briefs_designer FOR ALL USING (
  client_id = auth.uid() OR public.owns_designer(designer_id) OR public.is_admin()
);
CREATE POLICY "Read designer brief history if party" ON public.brief_designer_history FOR SELECT USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.briefs_designer b WHERE b.id = brief_designer_history.brief_id
    AND (b.client_id = auth.uid() OR public.owns_designer(b.designer_id)))
);
CREATE POLICY "Party reads own design project" ON public.design_projects FOR SELECT USING (
  client_id = auth.uid() OR public.owns_designer(designer_id) OR public.is_admin()
);
CREATE POLICY "Designer updates own design project" ON public.design_projects FOR UPDATE USING (
  public.owns_designer(designer_id) OR client_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "Party reads deliverables" ON public.design_project_deliverables FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.design_projects p WHERE p.id = design_project_deliverables.project_id
    AND (p.client_id = auth.uid() OR public.owns_designer(p.designer_id) OR public.is_admin()))
);
CREATE POLICY "Designer uploads deliverables" ON public.design_project_deliverables FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.design_projects p WHERE p.id = design_project_deliverables.project_id AND public.owns_designer(p.designer_id))
);

-- ── Litiges ──
CREATE POLICY "Party reads own dispute" ON public.disputes FOR SELECT USING (
  user_id = auth.uid() OR public.owns_artisan(artisan_id) OR public.owns_designer(designer_id) OR public.is_admin()
);
CREATE POLICY "User opens dispute" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin updates dispute" ON public.disputes FOR UPDATE USING (public.is_admin());
CREATE POLICY "Party reads dispute messages" ON public.dispute_messages FOR SELECT USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.disputes d WHERE d.id = dispute_messages.dispute_id
    AND (d.user_id = auth.uid() OR public.owns_artisan(d.artisan_id) OR public.owns_designer(d.designer_id)))
);
CREATE POLICY "Party posts dispute message" ON public.dispute_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ── Messagerie ──
CREATE POLICY "Participant reads conversation" ON public.conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid())
);
CREATE POLICY "Participant reads participants" ON public.conversation_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Participant reads messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Participant sends message" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid())
);

-- ── Moodboards (owner only) ──
CREATE POLICY "Users manage own moodboards" ON public.moodboards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own moodboard items" ON public.moodboard_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.moodboards m WHERE m.id = moodboard_items.moodboard_id AND m.user_id = auth.uid())
);

-- ── Wallet (owner only, écriture réservée aux Edge Functions via service role) ──
CREATE POLICY "Owner reads own wallet" ON public.wallets FOR SELECT USING (
  public.owns_artisan(owner_id) OR public.owns_designer(owner_id) OR public.is_admin()
);
CREATE POLICY "Owner reads own wallet transactions" ON public.wallet_transactions FOR SELECT USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.wallets w WHERE w.id = wallet_transactions.wallet_id
    AND (public.owns_artisan(w.owner_id) OR public.owns_designer(w.owner_id)))
);

-- ── KYC ──
CREATE POLICY "Users manage own KYC" ON public.kyc_submissions FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- ── Notifications (owner only) ──
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- 21. DONNÉES DE BASE (catégories)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.categories (name, slug, icon, sort_order) VALUES
('Tables', 'tables', 'Table2', 1),
('Fauteuils', 'fauteuils', 'Armchair', 2),
('Canapés', 'canapes', 'Sofa', 3),
('Lits', 'lits', 'BedDouble', 4),
('Rangements', 'rangements', 'Archive', 5),
('Luminaires', 'luminaires', 'Lamp', 6),
('Miroirs', 'miroirs', 'Frame', 7),
('Tapis', 'tapis', 'Square', 8),
('Textiles', 'textiles', 'Layers', 9),
('Vases', 'vases', 'Flower', 10),
('Poterie', 'poterie', 'Circle', 11),
('Sculptures', 'sculptures', 'Shapes', 12),
('Tableaux', 'tableaux', 'Image', 13),
('Cadres', 'cadres', 'Frame', 14),
('Objets d''art', 'objets-art', 'Gem', 15),
('Déco', 'deco', 'Sparkles', 16)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- NOTE — Supabase Storage (buckets à créer via Dashboard ou CLI,
-- pas de SQL DDL dédié) :
--   avatars            (public)   — photos de profil
--   product-images      (public)   — photos produits/catalogue
--   scene-images        (public)   — photos scènes/inspirations
--   brief-inspirations  (private)  — pièces jointes briefs
--   project-photos      (private)  — photos jalons de fabrication
--   kyc-documents        (private)  — pièces d'identité (accès admin + owner uniquement)
--   dispute-attachments (private)  — pièces jointes litiges
--   chat-attachments    (private)  — images envoyées en messagerie
--   moodboard-images    (private)  — images custom moodboard
-- Policies Storage à répliquer sur le même modèle owner/admin que RLS ci-dessus.
-- ═══════════════════════════════════════════════════════════════
