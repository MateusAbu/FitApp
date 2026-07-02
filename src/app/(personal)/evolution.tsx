import { Redirect } from 'expo-router';

// Evolução agora vive dentro de student-detail.tsx
// Este stub existe apenas para que o Expo Router não quebre
export default function EvolutionRedirect() {
  return <Redirect href="/(personal)/dashboard" />;
}
