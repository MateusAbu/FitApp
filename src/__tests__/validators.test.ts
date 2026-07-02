import { validateEmail, validatePassword, validateInviteCode } from '../shared/utils/validators';

describe('Validators Utility', () => {
  describe('validateEmail', () => {
    it('should return error message for empty email', () => {
      expect(validateEmail('')).toBe('auth.emailRequired');
    });

    it('should return error message for invalid format', () => {
      expect(validateEmail('invalid-email')).toBe('auth.invalidEmail');
      expect(validateEmail('invalid@domain')).toBe('auth.invalidEmail');
    });

    it('should return undefined for valid email', () => {
      expect(validateEmail('test@example.com')).toBeUndefined();
    });
  });

  describe('validatePassword', () => {
    it('should return error message for empty password', () => {
      expect(validatePassword('')).toBe('auth.passwordRequired');
    });

    it('should return error message for short password', () => {
      expect(validatePassword('12345')).toBe('auth.passwordLength');
    });

    it('should return undefined for valid password', () => {
      expect(validatePassword('123456')).toBeUndefined();
    });
  });

  describe('validateInviteCode', () => {
    it('should return error message for empty code', () => {
      expect(validateInviteCode('')).toBe('auth.inviteCodeRequired');
    });

    it('should return error message for invalid length', () => {
      expect(validateInviteCode('123')).toBe('auth.inviteCodeLength');
      expect(validateInviteCode('1234567')).toBe('auth.inviteCodeLength');
    });

    it('should return undefined for valid code', () => {
      expect(validateInviteCode('ABCDEF')).toBeUndefined();
    });
  });
});
