import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Dumbbell, PlayCircle, TrendingUp, Settings } from 'lucide-react-native';
import { useTheme } from '../../providers/ThemeProvider';

export default function StudentLayout() {
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
        name="index"
        options={{
          title: 'Meus Treinos',
          tabBarLabel: 'Treinos',
          tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="workout-execution"
        options={{
          title: 'Executar Treino',
          tabBarLabel: 'Execução',
          tabBarIcon: ({ color, size }) => <PlayCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="evolution"
        options={{
          title: 'Meu Progresso',
          tabBarLabel: 'Evolução',
          tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configurações',
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
