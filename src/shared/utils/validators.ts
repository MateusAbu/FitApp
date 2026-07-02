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

export function validateInviteCode(code: string): string | undefined {
  if (!code) return 'auth.inviteCodeRequired';
  if (code.trim().length !== 6) return 'auth.inviteCodeLength';
  return undefined;
}
