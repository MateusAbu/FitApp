import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore, themePalettes } from '../store/useThemeStore';
import { getMockDataForTable, addMockDataItem, updateMockDataItem, deleteMockDataItem } from './mockData';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                        process.env.EXPO_PUBLIC_SUPABASE_KEY || 
                        'placeholder-anon-key';

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY && !process.env.EXPO_PUBLIC_SUPABASE_KEY)) {
  console.warn('Supabase URL or Anon Key is missing. Using local development mock credentials.');
}

const realSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Mock Query Builder ───────────────────────────────────────

class MockQueryBuilder {
  private tableName: string;
  private currentData: any[];
  private pendingInsert: any[] | null;
  private pendingUpdate: any | null;
  private pendingDelete: boolean;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.currentData = getMockDataForTable(tableName);
    this.pendingInsert = null;
    this.pendingUpdate = null;
    this.pendingDelete = false;
  }

  select(columns?: string, options?: { count?: string }) {
    return this;
  }

  eq(column: string, value: any) {
    if (this.pendingUpdate) {
      // Aplicar update aos itens filtrados
      const filtered = this.currentData.filter((item) => item[column] === value);
      filtered.forEach((item) => {
        updateMockDataItem(this.tableName, item.id, this.pendingUpdate);
      });
      this.currentData = filtered.map((item) => ({ ...item, ...this.pendingUpdate }));
      return this;
    }
    if (this.pendingDelete) {
      const filtered = this.currentData.filter((item) => item[column] === value);
      filtered.forEach((item) => {
        deleteMockDataItem(this.tableName, item.id);
      });
      this.currentData = [];
      return this;
    }
    this.currentData = this.currentData.filter((item) => item[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.currentData = this.currentData.filter((item) => item[column] !== value);
    return this;
  }

  or(filterString: string) {
    if (filterString.includes('.is.null')) {
      const matchField = filterString.match(/(\w+)\.is\.null/);
      const matchEq = filterString.match(/(\w+)\.eq\.([^\s,)]+)/);
      if (matchField && matchEq) {
        const field = matchField[1];
        const eqValue = matchEq[2];
        this.currentData = this.currentData.filter(
          (item) => item[field] === null || item[field] === eqValue
        );
      }
    }
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const asc = options?.ascending !== false;
    this.currentData = [...this.currentData].sort((a, b) => {
      const valA = a[column];
      const valB = b[column];
      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });
    return this;
  }

  limit(count: number) {
    this.currentData = this.currentData.slice(0, count);
    return this;
  }

  insert(values: any) {
    const list = Array.isArray(values) ? values : [values];
    const createdItems = list.map((val) => {
      const newItem = {
        id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        created_at: new Date().toISOString(),
        ...val,
      };
      // Auto-injetar dados do exercício para workout_exercises e template_exercises
      if (this.tableName === 'workout_exercises' || this.tableName === 'template_exercises') {
        const exercises = getMockDataForTable('exercises');
        const originalExercise = exercises.find((e) => e.id === val.exercise_id);
        if (originalExercise) {
          (newItem as any).exercises = {
            name: originalExercise.name,
            category: originalExercise.category,
            description: originalExercise.description,
          };
        }
      }
      addMockDataItem(this.tableName, newItem);
      return newItem;
    });
    this.currentData = createdItems;
    this.pendingInsert = createdItems;
    return this;
  }

  update(values: any) {
    this.pendingUpdate = values;
    return this;
  }

  delete() {
    this.pendingDelete = true;
    return this;
  }

  upsert(values: any) {
    const list = Array.isArray(values) ? values : [values];
    const results = list.map((val) => {
      const existing = getMockDataForTable(this.tableName).find(
        (item) =>
          item.id === val.id ||
          (this.tableName === 'profiles' &&
            item.email?.toLowerCase() === val.email?.toLowerCase())
      );
      if (existing) {
        updateMockDataItem(this.tableName, existing.id, val);
        return { ...existing, ...val };
      }
      const newItem = {
        id: val.id || `mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        created_at: new Date().toISOString(),
        ...val,
      };
      addMockDataItem(this.tableName, newItem);
      return newItem;
    });

    // Se estiver inserindo na tabela 'profiles', loga o usuário automaticamente
    if (this.tableName === 'profiles' && results.length > 0) {
      const profile = results[0];
      const token = `demo-${profile.id}-token`;

      // Define o tema apropriado
      if (profile.role === 'personal') {
        useThemeStore.getState().setTheme(themePalettes.forge);
      } else {
        useThemeStore.getState().setTheme(themePalettes.ocean);
      }

      useAuthStore.getState().setSession(token, {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        fullName: profile.full_name,
        personalId: profile.personal_id,
        inviteCode: profile.invite_code,
        isPremium: profile.is_premium || false,
      });
    }

    this.currentData = results;
    return this;
  }

  async then(onfulfilled?: (value: any) => any) {
    const result = {
      data: this.currentData,
      error: null,
      count: this.currentData.length,
    };
    if (onfulfilled) {
      return onfulfilled(result);
    }
    return result;
  }

  async single() {
    return {
      data: this.currentData[0] || null,
      error: this.currentData[0] ? null : new Error('Not found'),
    };
  }

  async maybeSingle() {
    return { data: this.currentData[0] || null, error: null };
  }
}

// ─── Mock Auth ────────────────────────────────────────────────

const mockAuth = {
  getSession: async () => {
    const sessionToken = useAuthStore.getState().sessionToken;
    const profile = useAuthStore.getState().profile;
    if (sessionToken && profile) {
      return {
        data: {
          session: {
            access_token: sessionToken,
            user: { id: profile.id, email: profile.email },
          },
        },
        error: null,
      };
    }
    return { data: { session: null }, error: null };
  },
  onAuthStateChange: (callback: any) => {
    return {
      data: { subscription: { unsubscribe: () => {} } },
    };
  },
  signOut: async () => {
    useAuthStore.getState().logout();
    useThemeStore.getState().resetTheme();
    return { error: null };
  },
  signInWithPassword: async ({ email, password }: any) => {
    const profiles = getMockDataForTable('profiles');
    const user = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { data: { user: null, session: null }, error: new Error('Usuário não encontrado.') };
    }

    if (user.role === 'personal') {
      useThemeStore.getState().setTheme(themePalettes.forge);
    } else {
      useThemeStore.getState().setTheme(themePalettes.ocean);
    }

    const token = `demo-${user.id}-token`;
    const userProfile = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      personalId: user.personal_id,
      inviteCode: user.invite_code,
      isPremium: user.is_premium || false,
    };
    useAuthStore.getState().setSession(token, userProfile);

    return {
      data: {
        user: { id: user.id, email: user.email },
        session: { access_token: token, user: { id: user.id } },
      },
      error: null,
    };
  },
  signUp: async ({ email, password }: any) => {
    const existing = getMockDataForTable('profiles').find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { data: { user: null }, error: new Error('E-mail já cadastrado.') };
    }
    const mockUserId = `mock-user-${Date.now()}`;
    return {
      data: {
        user: { id: mockUserId, email },
      },
      error: null,
    };
  }
};

const useMocks = () => {
  const sessionToken = useAuthStore.getState().sessionToken;
  const isDemo = sessionToken && sessionToken.startsWith('demo-');
  const isEnvMissing = !process.env.EXPO_PUBLIC_SUPABASE_URL || 
                       (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY && !process.env.EXPO_PUBLIC_SUPABASE_KEY) || 
                       process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder') || 
                       (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')) ||
                       (process.env.EXPO_PUBLIC_SUPABASE_KEY && process.env.EXPO_PUBLIC_SUPABASE_KEY.includes('placeholder'));
  
  return isDemo || isEnvMissing;
};

// ─── Proxy Handler ────────────────────────────────────────────

export const supabase = new Proxy(realSupabase, {
  get(target, prop, receiver) {
    if (useMocks()) {
      if (prop === 'from') {
        return (tableName: string) => new MockQueryBuilder(tableName);
      }
      if (prop === 'auth') {
        return mockAuth;
      }
    }
    return Reflect.get(target, prop, receiver);
  },
});
