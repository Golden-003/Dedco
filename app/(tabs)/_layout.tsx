import { Tabs } from 'expo-router';
import { Home, LayoutGrid, Store, FolderOpen, User } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.amber,
        tabBarInactiveTintColor: Colors.text3,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'PlusJakartaSans-Medium',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="inspirations"
        options={{
          title: 'Inspirations',
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marché',
          tabBarIcon: ({ color, size }) => <Store color={color} size={size} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="projets"
        options={{
          title: 'Projets',
          tabBarIcon: ({ color, size }) => <FolderOpen color={color} size={size} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="compte"
        options={{
          title: 'Compte',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  );
}
