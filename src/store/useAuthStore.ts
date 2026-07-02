import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type UserRole = 'personal' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string | null;
  personalId: string | null;
  inviteCode?: string;
  isPremium?: boolean;
}

interface AuthState {
  sessionToken: string | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  setSession: (token: string | null, profile: UserProfile | null) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      sessionToken: null,
      profile: null,
      isAuthenticated: false,
      setSession: (token, profile) =>
        set((state) => {
          // Retornar novo estado mantendo a imutabilidade
          return {
            ...state,
            sessionToken: token,
            profile: profile ? { ...profile } : null,
            isAuthenticated: !!token,
          };
        }),
      updateProfile: (updatedFields) =>
        set((state) => {
          // Retornar novo estado mantendo a imutabilidade
          return {
            ...state,
            profile: state.profile
              ? { ...state.profile, ...updatedFields }
              : null,
          };
        }),
      logout: () =>
        set((state) => {
          // Retornar novo estado mantendo a imutabilidade
          return {
            ...state,
            sessionToken: null,
            profile: null,
            isAuthenticated: false,
          };
        }),
    }),
    {
      name: 'fitapp-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
