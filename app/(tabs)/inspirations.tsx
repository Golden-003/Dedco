import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { Search, Bookmark } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/theme';

const SCENES = [
  { id: 1, name: 'Salon Tropical Adjamé', tag: 'Salon', count: '5 pièces · Kofi Akindélé', img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=85', h: 260 },
  { id: 2, name: 'Chambre Sahélienne', tag: 'Chambre', count: '3 pièces · Sophie Kpadé', img: 'https://images.unsplash.com/photo-1566921895456-1cee64031c33?auto=format&fit=crop&w=400&q=85', h: 240 },
];

export default function InspirationsScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bgCream }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl }}>
        <Text style={{ fontSize: 24, fontFamily: 'Quache-Bold', color: Colors.text1, letterSpacing: -0.02, marginBottom: 4 }}>Inspirations</Text>
        <Text style={{ fontSize: 11, color: Colors.text3, fontFamily: 'PlusJakartaSans-Medium', marginBottom: 20 }}>Découvrez des scènes aménagées par nos designers.</Text>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, backgroundColor: Colors.bgWarm, borderRadius: 10, marginBottom: 20 }}>
          <Search size={14} color={Colors.text3} strokeWidth={2} />
          <Text style={{ fontSize: 12.5, color: Colors.text3, fontFamily: 'PlusJakartaSans-Medium' }}>Rechercher une ambiance, un style…</Text>
        </View>
      </View>

      {/* Featured scene */}
      <View style={{ paddingHorizontal: Spacing.lg, marginBottom: 12 }}>
        <Pressable onPress={() => router.push(`/scene/${SCENES[0].id}`)} style={{ borderRadius: 20, overflow: 'hidden' }}>
          <Image source={{ uri: SCENES[0].img }} style={{ width: '100%', height: 280 }} />
          <View style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(30,24,19,0.78) 0%, rgba(30,24,19,0.15) 45%, transparent 70%)' }} />
          <View style={{ position: 'absolute', top: 12, left: 12, paddingVertical: 3, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 999 }}>
            <Text style={{ fontSize: 9, fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.text1, textTransform: 'uppercase', letterSpacing: 0.04 }}>{SCENES[0].tag}</Text>
          </View>
          <View style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center' }}>
            <Bookmark size={15} color={Colors.text2} strokeWidth={2} />
          </View>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 }}>
            <Text style={{ color: 'white', fontSize: 22, fontFamily: 'Quache-Bold', letterSpacing: -0.02, marginBottom: 4 }}>{SCENES[0].name}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'PlusJakartaSans-Medium' }}>{SCENES[0].count}</Text>
          </View>
        </Pressable>
      </View>

      {/* Masonry */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: 20, gap: 12 }}>
        {SCENES.slice(1).map((s) => (
          <Pressable key={s.id} onPress={() => router.push(`/scene/${s.id}`)} style={{ borderRadius: 16, overflow: 'hidden' }}>
            <Image source={{ uri: s.img }} style={{ width: '100%', height: s.h }} />
            <View style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(30,24,19,0.78) 0%, transparent 60%)' }} />
            <View style={{ position: 'absolute', top: 10, left: 10, paddingVertical: 3, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 999 }}>
              <Text style={{ fontSize: 9, fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.text1, textTransform: 'uppercase', letterSpacing: 0.04 }}>{s.tag}</Text>
            </View>
            <View style={{ position: 'absolute', bottom: 12, left: 12 }}>
              <Text style={{ color: 'white', fontSize: 16, fontFamily: 'Quache-Bold', letterSpacing: -0.02 }}>{s.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: 'PlusJakartaSans-Medium' }}>{s.count}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
