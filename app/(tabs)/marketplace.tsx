import { View, Text, ScrollView, Pressable, Image, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Search, Star, Heart, SlidersHorizontal } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';

const CATEGORIES = ['Tout', 'Tables', 'Fauteuils', 'Canapés', 'Lits', 'Rangements', 'Luminaires', 'Miroirs', 'Tapis', 'Textiles', 'Vases', 'Poterie', 'Sculptures', 'Tableaux', 'Cadres', 'Objets d\'art', 'Déco'];

const PRODUCTS = [
  { id: 1, name: 'Table basse Wax', price: 145000, rating: 4.9, cat: 'Tables', img: 'https://images.unsplash.com/photo-1581428982868-e410dd047a90?auto=format&fit=crop&w=400&q=85', badge: 'UNIQUE' },
  { id: 2, name: 'Fauteuil Sahel', price: 245000, rating: 4.8, cat: 'Fauteuils', img: 'https://images.unsplash.com/photo-1566921895456-1cee64031c33?auto=format&fit=crop&w=400&q=85', badge: 'NOUVEAU' },
  { id: 3, name: 'Lampe Bogolan', price: 65000, rating: 4.7, cat: 'Luminaires', img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=85' },
  { id: 4, name: 'Miroir Raffia', price: 95000, rating: 5.0, cat: 'Miroirs', img: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=400&q=85', badge: 'UNIQUE' },
  { id: 5, name: 'Commode Porto-Novo', price: 385000, rating: 4.9, cat: 'Rangements', img: 'https://images.unsplash.com/photo-1517467139951-f5a925c9f9de?auto=format&fit=crop&w=400&q=85' },
  { id: 6, name: 'Vase Terre Cuite', price: 45000, rating: 4.8, cat: 'Vases', img: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=400&q=85', badge: 'NOUVEAU' },
];

function formatFCFA(n: number) { return n.toLocaleString('fr-FR') + ' FCFA'; }

export default function MarketplaceScreen() {
  const [category, setCategory] = useState('Tout');
  const [query, setQuery] = useState('');

  const filtered = PRODUCTS.filter(p => {
    if (category !== 'Tout' && p.cat !== category) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgCream }}>
      {/* Header */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <View>
            <Text style={{ fontSize: 24, fontFamily: 'Quache-Bold', color: Colors.text1, letterSpacing: -0.02 }}>Marketplace</Text>
            <Text style={{ fontSize: 11, color: Colors.text3, fontFamily: 'PlusJakartaSans-Medium', marginTop: 2 }}>{filtered.length} pièces · Fabrication artisanale</Text>
          </View>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: Colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: Colors.border }}>
            <SlidersHorizontal size={15} color={Colors.text2} strokeWidth={2} />
            <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-SemiBold', color: Colors.text2 }}>Filtres</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, backgroundColor: Colors.bgWarm, borderRadius: 10, marginBottom: 12 }}>
          <Search size={14} color={Colors.text3} strokeWidth={2} />
          <TextInput
            placeholder="Rechercher une pièce, un matériau…"
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, fontSize: 12.5, color: Colors.text1, fontFamily: 'PlusJakartaSans-Medium' }}
          />
        </View>
      </View>

      {/* Categories scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 8, paddingBottom: 12 }}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setCategory(cat)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 999,
              backgroundColor: category === cat ? Colors.ink : Colors.bgCard,
              borderWidth: 1,
              borderColor: category === cat ? Colors.ink : Colors.border,
            }}
          >
            <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-SemiBold', color: category === cat ? 'white' : Colors.text2 }}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Sort bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: 12 }}>
        <Text style={{ fontSize: 11, color: Colors.text3, fontFamily: 'PlusJakartaSans-Medium' }}><Text style={{ color: Colors.text1, fontFamily: 'PlusJakartaSans-ExtraBold' }}>{filtered.length}</Text> résultats</Text>
      </View>

      {/* Products grid */}
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 20, gap: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/product/${item.id}`)} style={{ flex: 1, backgroundColor: Colors.bgCard, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border }}>
            <View style={{ position: 'relative', width: '100%', aspectRatio: 1, backgroundColor: Colors.bgWarm }}>
              <Image source={{ uri: item.img }} style={{ width: '100%', height: '100%' }} />
              {item.badge && (
                <View style={{ position: 'absolute', top: 8, left: 8, paddingVertical: 3, paddingHorizontal: 8, backgroundColor: item.badge === 'UNIQUE' ? 'rgba(191,121,59,0.92)' : 'rgba(84,140,69,0.92)', borderRadius: 999 }}>
                  <Text style={{ fontSize: 8, fontFamily: 'PlusJakartaSans-ExtraBold', color: 'white', textTransform: 'uppercase', letterSpacing: 0.06 }}>{item.badge}</Text>
                </View>
              )}
              <Pressable style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center' }}>
                <Heart size={14} color={Colors.text2} strokeWidth={2} />
              </Pressable>
            </View>
            <View style={{ padding: 12 }}>
              <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-SemiBold', color: Colors.text1, marginBottom: 4 }} numberOfLines={1}>{item.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 }}>
                <Star size={10} color={Colors.amber} fill={Colors.amber} />
                <Text style={{ fontSize: 10, color: Colors.text1, fontFamily: 'PlusJakartaSans-ExtraBold' }}>{item.rating}</Text>
              </View>
              <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans-Bold', color: Colors.amberDark }}>{formatFCFA(item.price)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

// Fix: import TextInput
import { TextInput } from 'react-native';
