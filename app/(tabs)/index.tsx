import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { Search, Bell, ShoppingBag, Star } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';

const CATEGORIES = [
  { name: 'Tables', icon: '🪑' },
  { name: 'Fauteuils', icon: '💺' },
  { name: 'Luminaires', icon: '💡' },
  { name: 'Vases', icon: '🏺' },
  { name: 'Déco', icon: '🖼️' },
  { name: 'Tapis', icon: '🧶' },
];

const PRODUCTS = [
  { id: 1, name: 'Table basse Wax', price: '145 000 FCFA', rating: 4.9, img: 'https://images.unsplash.com/photo-1581428982868-e410dd047a90?auto=format&fit=crop&w=400&q=85' },
  { id: 2, name: 'Fauteuil Sahel', price: '245 000 FCFA', rating: 4.8, img: 'https://images.unsplash.com/photo-1566921895456-1cee64031c33?auto=format&fit=crop&w=400&q=85' },
];

export default function HomeScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bgCream }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View>
            <Text style={{ fontSize: 11, color: Colors.text3, fontFamily: 'PlusJakartaSans-Medium' }}>Bonjour, Fatou</Text>
            <Text style={{ fontSize: 20, fontFamily: 'Quache-Bold', color: Colors.text1, letterSpacing: -0.02 }}>
              Dedco<Text style={{ color: Colors.amber }}>.</Text>
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => router.push('/(tabs)/marketplace')} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgWarm, justifyContent: 'center', alignItems: 'center' }}>
              <Bell size={18} color={Colors.text2} strokeWidth={1.8} />
            </Pressable>
            <Pressable onPress={() => router.push('/panier')} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgWarm, justifyContent: 'center', alignItems: 'center' }}>
              <ShoppingBag size={18} color={Colors.text2} strokeWidth={1.8} />
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <Pressable onPress={() => router.push('/(tabs)/marketplace')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, backgroundColor: Colors.bgWarm, borderRadius: 10, marginBottom: 20 }}>
          <Search size={14} color={Colors.text3} strokeWidth={2} />
          <Text style={{ fontSize: 12.5, color: Colors.text3, fontFamily: 'PlusJakartaSans-Medium' }}>Rechercher une pièce, un matériau…</Text>
        </Pressable>
      </View>

      {/* Hero */}
      <View style={{ paddingHorizontal: Spacing.lg, marginBottom: 24 }}>
        <View style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', height: 200 }}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=85' }} style={{ width: '100%', height: '100%' }} />
          <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(30,24,19,0.4)' }} />
          <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            <Text style={{ color: 'white', fontSize: 22, fontFamily: 'Quache-Bold', letterSpacing: -0.02, marginBottom: 4 }}>Salon Bois & Wax</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'PlusJakartaSans-Medium' }}>6 pièces · Afro-contemporain</Text>
          </View>
        </View>
      </View>

      {/* Catégories */}
      <View style={{ paddingHorizontal: Spacing.lg, marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontFamily: 'Quache-Bold', color: Colors.text1, marginBottom: 12, letterSpacing: -0.01 }}>Catégories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {CATEGORIES.map((cat) => (
            <Pressable key={cat.name} onPress={() => router.push('/(tabs)/marketplace')} style={{ alignItems: 'center', gap: 6, minWidth: 64 }}>
              <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
              </View>
              <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans-SemiBold', color: Colors.text2 }}>{cat.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Bannière projet */}
      <View style={{ paddingHorizontal: Spacing.lg, marginBottom: 24 }}>
        <Pressable onPress={() => router.push('/brief')} style={{ borderRadius: 20, padding: 20, overflow: 'hidden', backgroundColor: Colors.amber }}>
          <Text style={{ color: 'white', fontSize: 9, fontFamily: 'PlusJakartaSans-ExtraBold', textTransform: 'uppercase', letterSpacing: 0.14, opacity: 0.85, marginBottom: 8 }}>Sur-mesure</Text>
          <Text style={{ color: 'white', fontSize: 22, fontFamily: 'Quache-Bold', letterSpacing: -0.02, marginBottom: 4 }}>Brief artisan</Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontFamily: 'PlusJakartaSans-Medium', marginBottom: 14 }}>Décrivez votre pièce, recevez des devis sous 48h</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 999 }}>
            <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-Bold', color: Colors.amberDark }}>Démarrer</Text>
          </View>
        </Pressable>
      </View>

      {/* Coups de cœur */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: 20 }}>
        <Text style={{ fontSize: 16, fontFamily: 'Quache-Bold', color: Colors.text1, marginBottom: 12, letterSpacing: -0.01 }}>Coups de cœur</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {PRODUCTS.map((p) => (
            <Pressable key={p.id} onPress={() => router.push(`/product/${p.id}`)} style={{ flex: 1, backgroundColor: Colors.bgCard, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border }}>
              <Image source={{ uri: p.img }} style={{ width: '100%', height: 140 }} />
              <View style={{ padding: 12 }}>
                <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-SemiBold', color: Colors.text1, marginBottom: 4 }}>{p.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 }}>
                  <Star size={10} color={Colors.amber} fill={Colors.amber} />
                  <Text style={{ fontSize: 10, color: Colors.text3, fontFamily: 'PlusJakartaSans-SemiBold' }}>{p.rating}</Text>
                </View>
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans-Bold', color: Colors.amberDark }}>{p.price}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
