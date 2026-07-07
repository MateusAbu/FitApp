import {
  validateEmail,
  validatePassword,
  validatePasswordStrength,
  validatePasswordMatch,
  validateInviteCode,
} from '../shared/utils/validators';

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

  describe('validatePasswordStrength', () => {
    it('should reject a password under 8 characters', () => {
      expect(validatePasswordStrength('Ab1!')).toBe('auth.passwordWeak');
    });

    it('should require an uppercase letter', () => {
      expect(validatePasswordStrength('abcd123!')).toBe('auth.passwordWeak');
    });

    it('should require a number', () => {
      expect(validatePasswordStrength('Abcdefg!')).toBe('auth.passwordWeak');
    });

    it('should require a special character', () => {
      expect(validatePasswordStrength('Abcd1234')).toBe('auth.passwordWeak');
    });

    it('should return undefined for a strong password', () => {
      expect(validatePasswordStrength('Abcd123!')).toBeUndefined();
    });
  });

  describe('validatePasswordMatch', () => {
    it('should require the confirmation field', () => {
      expect(validatePasswordMatch('abcd1234', '')).toBe('auth.passwordConfirmRequired');
    });

    it('should return error when passwords differ', () => {
      expect(validatePasswordMatch('abcd1234', 'abcd9999')).toBe('auth.passwordMismatch');
    });

    it('should return undefined when passwords match', () => {
      expect(validatePasswordMatch('abcd1234', 'abcd1234')).toBeUndefined();
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
