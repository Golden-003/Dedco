-- ═══════════════════════════════════════════════════
-- DEDCO — Schéma de base de données Supabase
-- À exécuter dans Supabase → SQL Editor → New query
-- ═══════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══ TABLES ═══

CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.artisans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  cover_url TEXT,
  specialty TEXT,
  city TEXT,
  level TEXT DEFAULT 'N3',
  rating NUMERIC(2,1) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  products_count INTEGER DEFAULT 0,
  bio TEXT,
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  artisan_id UUID REFERENCES public.artisans(id) ON DELETE SET NULL,
  category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
  price INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  rating NUMERIC(2,1) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  materials TEXT[],
  delay_days INTEGER DEFAULT 7,
  badge TEXT,
  badge_color TEXT DEFAULT 'amber',
  is_new BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  dimensions TEXT,
  weight TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  room TEXT NOT NULL,
  style TEXT,
  image_url TEXT NOT NULL,
  tag_label TEXT,
  count_label TEXT,
  saves INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'fabrication',
  total INTEGER NOT NULL,
  items_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ ROW LEVEL SECURITY ═══

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (TRUE);
CREATE POLICY "Public read artisans" ON public.artisans FOR SELECT USING (TRUE);
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read scenes" ON public.scenes FOR SELECT USING (TRUE);
CREATE POLICY "Users read own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

-- ═══ DONNÉES ═══

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

INSERT INTO public.artisans (name, slug, avatar_url, specialty, city, level, rating, reviews_count, products_count, bio) VALUES
('Kofi Akindélé', 'kofi-akindele', 'https://images.unsplash.com/photo-1614023342667-6f060e9d1e04?auto=format&fit=crop&crop=faces&w=200&q=85', 'Mobilier bois', 'Cotonou', 'N3', 4.9, 128, 12, 'Artisan menuisier depuis 15 ans.'),
('Amara Dossou', 'amara-dossou', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&crop=faces&w=200&q=85', 'Mobilier & Rangements', 'Porto-Novo', 'N3', 4.8, 89, 8, 'Ébéniste reconnu.'),
('Sophie Kpadé', 'sophie-kpade', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&crop=faces&w=200&q=85', 'Luminaires & Déco', 'Cotonou', 'N2', 4.7, 67, 10, 'Créatrice de luminaires.'),
('Brice Gbénou', 'brice-gbenou', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&crop=faces&w=200&q=85', 'Sculpture & Mobilier', 'Abomey', 'N3', 4.9, 45, 6, 'Sculpteur sur bois.'),
('Mariam Boukari', 'mariam-boukari', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&crop=faces&w=200&q=85', 'Textiles & Poterie', 'Ouidah', 'N2', 4.8, 92, 7, 'Artisane textile et potière.'),
('Étienne Dossou-Yovo', 'etienne-dossou-yovo', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&crop=faces&w=200&q=85', 'Sculpture & Cadres', 'Cotonou', 'N3', 5.0, 34, 4, 'Sculpteur contemporain.'),
('Léa Houngbédji', 'lea-houngbedji', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&crop=faces&w=200&q=85', 'Céramique & Bronze', 'Cotonou', 'N2', 4.8, 56, 6, 'Céramiste et fondeuse.'),
('Aïcha Touré', 'aicha-toure', 'https://images.unsplash.com/photo-1559548331-f9cb98001426?auto=format&fit=crop&crop=faces&w=200&q=85', 'Peinture & Tableaux', 'Cotonou', 'N2', 4.8, 28, 5, 'Artiste peintre.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, artisan_id, category_id, price, image_url, rating, reviews_count, materials, delay_days, badge, badge_color, is_new, description, dimensions, weight) VALUES
('Table basse Wax', 'table-basse-wax', (SELECT id FROM public.artisans WHERE slug='kofi-akindele'), (SELECT id FROM public.categories WHERE slug='tables'), 145000, 'https://images.unsplash.com/photo-1581428982868-e410dd047a90?auto=format&fit=crop&w=600&q=85', 4.9, 23, ARRAY['Bois','Wax'], 10, 'UNIQUE', 'amber', FALSE, 'Table basse en bois iroko massif.', '110x60x40 cm', '18 kg'),
('Fauteuil Sahel', 'fauteuil-sahel', (SELECT id FROM public.artisans WHERE slug='amara-dossou'), (SELECT id FROM public.categories WHERE slug='fauteuils'), 245000, 'https://images.unsplash.com/photo-1566921895456-1cee64031c33?auto=format&fit=crop&w=600&q=85', 4.8, 17, ARRAY['Bois','Coton'], 14, 'NOUVEAU', 'forest', TRUE, 'Fauteuil en bois massif.', '75x80x90 cm', '22 kg'),
('Lampe Bogolan', 'lampe-bogolan', (SELECT id FROM public.artisans WHERE slug='sophie-kpade'), (SELECT id FROM public.categories WHERE slug='luminaires'), 65000, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=85', 4.7, 31, ARRAY['Ceramique','Bogolan'], 5, NULL, 'amber', FALSE, 'Lampe sur pied en céramique.', '30x30x45 cm', '3 kg'),
('Miroir Raffia', 'miroir-raffia', (SELECT id FROM public.artisans WHERE slug='sophie-kpade'), (SELECT id FROM public.categories WHERE slug='miroirs'), 95000, 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=85', 5.0, 8, ARRAY['Raffia','Bois'], 7, 'UNIQUE', 'amber', FALSE, 'Miroir encadré de raffia.', '60x80 cm', '4 kg'),
('Commode Porto-Novo', 'commode-porto-novo', (SELECT id FROM public.artisans WHERE slug='amara-dossou'), (SELECT id FROM public.categories WHERE slug='rangements'), 385000, 'https://images.unsplash.com/photo-1517467139951-f5a925c9f9de?auto=format&fit=crop&w=600&q=85', 4.9, 12, ARRAY['Bois'], 21, NULL, 'amber', FALSE, 'Commode en bois massif.', '90x45x110 cm', '35 kg'),
('Vase Terre Cuite', 'vase-terre-cuite', (SELECT id FROM public.artisans WHERE slug='mariam-boukari'), (SELECT id FROM public.categories WHERE slug='vases'), 45000, 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=600&q=85', 4.8, 19, ARRAY['Terre cuite'], 4, 'NOUVEAU', 'forest', TRUE, 'Vase en terre cuite tourné main.', '20x20x35 cm', '2 kg'),
('Canapé Iroko 3 places', 'canape-iroko-3-places', (SELECT id FROM public.artisans WHERE slug='kofi-akindele'), (SELECT id FROM public.categories WHERE slug='canapes'), 690000, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=85', 5.0, 6, ARRAY['Bois','Coton'], 25, 'UNIQUE', 'amber', FALSE, 'Canapé 3 places en iroko.', '210x90x85 cm', '65 kg'),
('Lit King Sahel', 'lit-king-sahel', (SELECT id FROM public.artisans WHERE slug='amara-dossou'), (SELECT id FROM public.categories WHERE slug='lits'), 540000, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=85', 4.8, 9, ARRAY['Bois','Coton'], 28, NULL, 'amber', FALSE, 'Lit king size en bois massif.', '200x180x120 cm', '55 kg'),
('Suspension Raphia', 'suspension-raphia', (SELECT id FROM public.artisans WHERE slug='sophie-kpade'), (SELECT id FROM public.categories WHERE slug='luminaires'), 78000, 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=85', 4.6, 22, ARRAY['Raphia','Metal'], 8, NULL, 'amber', FALSE, 'Lampe suspendue en raphia.', '40x40x30 cm', '1.5 kg'),
('Tapis Kente Maison', 'tapis-kente-maison', (SELECT id FROM public.artisans WHERE slug='mariam-boukari'), (SELECT id FROM public.categories WHERE slug='tapis'), 165000, 'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=600&q=85', 4.9, 14, ARRAY['Coton','Kente'], 12, NULL, 'amber', FALSE, 'Tapis en coton kente tissé main.', '200x140 cm', '8 kg')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.scenes (title, slug, room, style, image_url, tag_label, count_label, saves, is_featured) VALUES
('Salon Tropical Adjamé', 'salon-tropical-adjame', 'Salon', 'Afro-contemporain', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=85', 'Salon', '5 pièces · Kofi Akindélé', 234, TRUE),
('Chambre Sahélienne', 'chambre-sahelienne', 'Chambre', 'Tropical minimaliste', 'https://images.unsplash.com/photo-1566921895456-1cee64031c33?auto=format&fit=crop&w=600&q=85', 'Chambre', '3 pièces · Sophie Kpadé', 189, FALSE),
('Bureau Afro-contemporain', 'bureau-afro-contemporain', 'Bureau', 'Afro-contemporain', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=85', 'Bureau', '4 pièces · Amara Dossou', 156, FALSE),
('Entrée Zen', 'entree-zen', 'Entrée', 'Tropical minimaliste', 'https://images.unsplash.com/photo-1604264726154-26480e76f4e1?auto=format&fit=crop&w=600&q=85', 'Entrée', '2 pièces · Sophie Kpadé', 143, FALSE),
('Salon Bois & Wax', 'salon-bois-wax', 'Salon', 'Afro-contemporain', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=85', 'Salon', '6 pièces · Kofi Akindélé', 312, FALSE),
('Salle à Manger Kente', 'salle-a-manger-kente', 'Salle à manger', 'Afro-contemporain', 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=600&q=85', 'Salle à manger', '5 pièces · Mariam Boukari', 178, FALSE),
('Cuisine Terre Cuite', 'cuisine-terre-cuite', 'Cuisine', 'Méditerranée africaine', 'https://images.unsplash.com/photo-1617364852223-75f57e78dc96?auto=format&fit=crop&w=600&q=85', 'Cuisine', '3 pièces · Mariam Boukari', 98, FALSE),
('Chambre Sahel', 'chambre-sahel', 'Chambre', 'Tropical minimaliste', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=85', 'Chambre', '4 pièces · Amara Dossou', 205, FALSE)
ON CONFLICT (slug) DO NOTHING;
