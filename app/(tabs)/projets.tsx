import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Plus, FileText } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/theme';

const STEPS = [
  { num: '1', title: 'Décrivez votre besoin', desc: "Pièce à aménager, style souhaité, budget, photos d'inspiration." },
  { num: '2', title: 'Recevez des propositions', desc: 'Des designers et artisans vous soumettent leurs idées avec devis.' },
  { num: '3', title: 'Choisissez et démarrez', desc: "Sélectionnez votre proposition préférée, l'artisan commence la fabrication." },
  { num: '4', title: 'Suivez et recevez', desc: "Suivez l'avancement étape par étape, jusqu'à la livraison." },
];

export default function ProjetsScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bgCream }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
          <View>
            <Text style={{ fontSize: 24, fontFamily: 'Quache-Bold', color: Colors.text1, letterSpacing: -0.02 }}>Mes projets</Text>
            <Text style={{ fontSize: 11, color: Colors.text3, fontFamily: 'PlusJakartaSans-Medium', marginTop: 2 }}>0 projet en cours</Text>
          </View>
          <Pressable onPress={() => router.push('/brief')} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: Colors.ink, borderRadius: 12 }}>
            <Plus size={13} color="white" strokeWidth={2.2} />
            <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-Bold', color: 'white' }}>Nouveau</Text>
          </Pressable>
        </View>

        {/* Process */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 8 }}>
          <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.text3, textTransform: 'uppercase', letterSpacing: 0.14 }}>Comment ça marche</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
        </View>

        {STEPS.map((step) => (
          <View key={step.num} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontFamily: 'Quache-Bold', color: Colors.text1 }}>{step.num}</Text>
            </View>
            <View style={{ flex: 1, paddingTop: 4 }}>
              <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Bold', color: Colors.text1, marginBottom: 2 }}>{step.title}</Text>
              <Text style={{ fontSize: 11.5, color: Colors.text3, fontFamily: 'PlusJakartaSans-Medium', lineHeight: 18 }}>{step.desc}</Text>
            </View>
          </View>
        ))}

        {/* CTA */}
        <Pressable onPress={() => router.push('/brief')} style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: Colors.ink, borderRadius: 14 }}>
          <Plus size={16} color="white" strokeWidth={2} />
          <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-ExtraBold', color: 'white' }}>Démarrer un projet</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
