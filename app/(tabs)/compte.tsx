import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { Pencil, Package, FolderOpen, Heart, Star, MapPin, CreditCard, Bell, Globe, HelpCircle, Settings, LogOut, ChevronRight } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/theme';

const MENU_SECTIONS = [
  {
    title: 'Activité',
    items: [
      { icon: Package, label: 'Mes commandes', count: '12', route: '/(tabs)/projets' },
      { icon: FolderOpen, label: 'Mes projets', count: '0', route: '/(tabs)/projets' },
      { icon: Heart, label: 'Mes favoris', count: '8', route: '/(tabs)/marketplace' },
      { icon: Star, label: 'Mes avis', count: '5', route: '/(tabs)/marketplace' },
    ],
  },
  {
    title: 'Compte',
    items: [
      { icon: MapPin, label: 'Adresses de livraison', route: '/(tabs)/marketplace' },
      { icon: CreditCard, label: 'Moyens de paiement', route: '/(tabs)/marketplace' },
    ],
  },
  {
    title: 'Préférences',
    items: [
      { icon: Bell, label: 'Notifications', route: '/(tabs)/marketplace' },
      { icon: Globe, label: 'Langue & devise', route: '/(tabs)/marketplace', value: 'FR · FCFA' },
      { icon: HelpCircle, label: 'Aide & support', route: '/(tabs)/marketplace' },
      { icon: Settings, label: 'Paramètres', route: '/(tabs)/marketplace' },
    ],
  },
];

export default function CompteScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bgCream }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: 40 }}>
        {/* Profile header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&crop=faces&w=160&q=85' }} style={{ width: 64, height: 64, borderRadius: 999, borderWidth: 1, borderColor: Colors.border }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 21, fontFamily: 'Quache-Bold', color: Colors.text1, letterSpacing: -0.02 }}>Fatou Kossou</Text>
              <Text style={{ fontSize: 11.5, color: Colors.text3, fontFamily: 'PlusJakartaSans-Medium', marginTop: 2 }}>fatou.kossou@email.bj</Text>
            </View>
          </View>
          <Pressable style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.bgWarm, justifyContent: 'center', alignItems: 'center' }}>
            <Pencil size={16} color={Colors.text2} strokeWidth={1.8} />
          </Pressable>
        </View>

        {/* Menu sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.text3, textTransform: 'uppercase', letterSpacing: 0.14 }}>{section.title}</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
            </View>
            <View style={{ backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, overflow: 'hidden' }}>
              {section.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Pressable key={item.label} onPress={() => router.push(item.route as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: idx < section.items.length - 1 ? 1 : 0, borderBottomColor: Colors.border }}>
                    <Icon size={18} color={Colors.text1} strokeWidth={1.6} />
                    <Text style={{ flex: 1, fontSize: 13.5, fontFamily: 'PlusJakartaSans-SemiBold', color: Colors.text1 }}>{item.label}</Text>
                    {item.count && <Text style={{ fontSize: 11, color: Colors.text3, fontFamily: 'PlusJakartaSans-SemiBold', marginRight: 4 }}>{item.count}</Text>}
                    {item.value && <Text style={{ fontSize: 11, color: Colors.text3, fontFamily: 'PlusJakartaSans-SemiBold', marginRight: 4 }}>{item.value}</Text>}
                    <ChevronRight size={14} color={Colors.text3} strokeWidth={2} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Déconnexion */}
        <Pressable onPress={() => router.push('/auth')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 8 }}>
          <LogOut size={16} color={Colors.terracotta} strokeWidth={1.8} />
          <Text style={{ fontSize: 13.5, fontFamily: 'PlusJakartaSans-Bold', color: Colors.terracotta }}>Se déconnecter</Text>
        </Pressable>

        <Text style={{ textAlign: 'center', fontSize: 10, color: Colors.text3, marginTop: 20, letterSpacing: 0.04 }}>Dedco · version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}
