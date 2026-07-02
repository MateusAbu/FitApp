import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { LayoutDashboard, Users, Dumbbell, BookOpen, Settings } from 'lucide-react-native';
import { useTheme } from '../../providers/ThemeProvider';

export default function PersonalLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primaryColor,
        tabBarInactiveTintColor: theme.textMuted || '#5A6070',
        tabBarStyle: {
          backgroundColor: theme.bg || theme.backgroundColor,
          borderTopWidth: 1,
          borderTopColor: theme.border || 'rgba(255,255,255,0.06)',
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: theme.bg || theme.backgroundColor,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.border || 'rgba(255,255,255,0.06)',
        },
        headerTintColor: theme.text || theme.textColor,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Início',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Meus Alunos',
          tabBarLabel: 'Alunos',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Fichas Modelo',
          tabBarLabel: 'Fichas',
          tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Biblioteca',
          tabBarLabel: 'Exercícios',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Branding & Planos',
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
      {/* Rotas ocultas (acessadas via router.push, não na tab bar) */}
      <Tabs.Screen
        name="student-detail"
        options={{
          href: null,
          title: 'Detalhes do Aluno',
        }}
      />
      <Tabs.Screen
        name="evolution"
        options={{
          href: null,
          title: 'Evolução',
        }}
      />
    </Tabs>
  );
}
