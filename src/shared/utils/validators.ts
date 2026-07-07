export function validateEmail(email: string): string | undefined {
  if (!email) return 'auth.emailRequired';
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) return 'auth.invalidEmail';
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'auth.passwordRequired';
  if (password.length < 6) return 'auth.passwordLength';
  return undefined;
}

// Regras de senha forte (cadastro). Fonte única: usada pelo validador e pela
// checklist ao vivo na tela de cadastro. Login continua usando validatePassword.
export const PASSWORD_RULES = [
  { key: 'length', test: (p: string) => p.length >= 8 },
  { key: 'upper', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'number', test: (p: string) => /[0-9]/.test(p) },
  { key: 'special', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export function validatePasswordStrength(password: string): string | undefined {
  if (!password) return 'auth.passwordRequired';
  if (!PASSWORD_RULES.every((rule) => rule.test(password))) return 'auth.passwordWeak';
  return undefined;
}

export function validatePasswordMatch(password: string, confirm: string): string | undefined {
  if (!confirm) return 'auth.passwordConfirmRequired';
  if (password !== confirm) return 'auth.passwordMismatch';
  return undefined;
}

export function validateInviteCode(code: string): string | undefined {
  if (!code) return 'auth.inviteCodeRequired';
  if (code.trim().length !== 6) return 'auth.inviteCodeLength';
  return undefined;
}
