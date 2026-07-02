import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider, Persister } from '@tanstack/react-query-persist-client';
import React from 'react';

// Criando cliente de Query com tempos de vida de cache personalizados (gcTime de 7 dias, staleTime de 5 min)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 dias
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Persister customizado usando AsyncStorage para evitar pacotes nativos extras
const persister: Persister = {
  persistClient: async (client) => {
    try {
      await AsyncStorage.setItem('FITAPP_OFFLINE_CACHE', JSON.stringify(client));
    } catch (error) {
      console.error('Erro ao persistir o cache do TanStack Query:', error);
    }
  },
  restoreClient: async () => {
    try {
      const cacheString = await AsyncStorage.getItem('FITAPP_OFFLINE_CACHE');
      if (!cacheString) return undefined;
      return JSON.parse(cacheString);
    } catch (error) {
      console.error('Erro ao restaurar o cache do TanStack Query:', error);
      return undefined;
    }
  },
  removeClient: async () => {
    try {
      await AsyncStorage.removeItem('FITAPP_OFFLINE_CACHE');
    } catch (error) {
      console.error('Erro ao remover o cache do TanStack Query:', error);
    }
  },
};

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7 }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
