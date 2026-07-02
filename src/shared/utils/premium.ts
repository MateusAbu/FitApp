import { useAuthStore } from '../../store/useAuthStore';

// E-mails que possuem acesso Premium automático para testes (sem pagar)
export const VIP_EMAILS = [
  'personal@fitapp.com', // Demo Personal
  'aluno@fitapp.com',    // Demo Aluno
  'mateus@fitapp.com',   // E-mail do proprietário para testes gratuitos
];

/**
 * Verifica se o usuário logado possui acesso Premium.
 * Retorna true se estiver na lista VIP de testes ou se o perfil tiver a flag isPremium ativa.
 */
export const checkPremiumStatus = (email?: string | null, isPremiumFlag?: boolean): boolean => {
  if (!email) return false;
  if (isPremiumFlag) return true;
  return VIP_EMAILS.some((vip) => vip.toLowerCase() === email.toLowerCase());
};
