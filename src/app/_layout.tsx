import { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryProvider } from '../providers/QueryProvider';
import { ThemeProvider as CustomThemeProvider } from '../providers/ThemeProvider';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { supabase } from '../services/supabase';
import '../services/i18n';

export { ErrorBoundary } from 'expo-router';

// Impede que a tela de splash suma antes de carregar fontes/estado
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <QueryProvider>
      <CustomThemeProvider>
        <RootLayoutNav />
      </CustomThemeProvider>
    </QueryProvider>
  );
}

function RootLayoutNav() {
  const { isAuthenticated, profile, setSession, logout } = useAuthStore();
  const { setTheme, resetTheme } = useThemeStore();
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const isNavigationReady = !!rootNavigationState?.key;

  // Sincronização inicial e monitoramento do estado de login
  useEffect(() => {
    // Busca sessão ativa ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id, session.access_token);
      } else {
        logout();
        resetTheme();
        SplashScreen.hideAsync();
      }
    });

    // Inscrição para mudanças no Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        fetchProfile(session.user.id, session.access_token);
      } else {
        logout();
        resetTheme();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Busca o perfil do usuário e seu tema customizado
  const fetchProfile = async (userId: string, token: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Usando maybeSingle para evitar lançar erro se o profile for nulo inicialmente

      if (error) throw error;

      if (data) {
        const userProfile = {
          id: data.id,
          email: data.email,
          role: data.role,
          fullName: data.full_name,
          personalId: data.personal_id,
          inviteCode: data.invite_code,
          isPremium: data.is_premium || false,
        };

        setSession(token, userProfile);

        // Se for Personal ou Aluno associado a um Personal, busca as cores do tema
        const themeUserId = data.role === 'personal' ? data.id : data.personal_id;
        if (themeUserId) {
          const { data: themeData } = await supabase
            .from('personal_themes')
            .select('*')
            .eq('personal_id', themeUserId)
            .maybeSingle();

          if (themeData) {
            setTheme({
              primaryColor: themeData.primary_color,
              secondaryColor: themeData.secondary_color,
              backgroundColor: themeData.background_color,
              textColor: themeData.text_color,
              logoUrl: themeData.logo_url,
              brandName: themeData.brand_name,
            });
          }
        }
      }
    } catch (e) {
      console.error('Erro ao sincronizar perfil/tema:', e);
    } finally {
      // Oculta a tela de splash apenas após toda a inicialização
      SplashScreen.hideAsync();
    }
  };

  // Proteção e Roteamento de telas baseado no papel (role) e autenticação
  useEffect(() => {
    if (!isNavigationReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inPersonalGroup = segments[0] === '(personal)';
    const inStudentGroup = segments[0] === '(student)';

    const performRedirect = () => {
      if (!isAuthenticated) {
        if (!inAuthGroup) {
          router.replace('/(auth)/login');
        }
      } else if (profile) {
        if (profile.role === 'personal') {
          if (!inPersonalGroup) {
            router.replace('/(personal)/dashboard');
          }
        } else if (profile.role === 'student') {
          if (!inStudentGroup) {
            router.replace('/(student)');
          }
        }
      }
    };

    // Posterga o redirecionamento para o próximo ciclo de eventos para evitar corrida de montagem
    const timer = setTimeout(performRedirect, 0);
    return () => clearTimeout(timer);
  }, [isAuthenticated, profile, segments, isNavigationReady]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(personal)" options={{ headerShown: false }} />
      <Stack.Screen name="(student)" options={{ headerShown: false }} />
    </Stack>
  );
}
