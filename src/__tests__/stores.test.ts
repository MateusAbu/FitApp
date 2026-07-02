import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

describe('Zustand Stores', () => {
  describe('useAuthStore', () => {
    beforeEach(() => {
      const { logout } = useAuthStore.getState();
      logout();
    });

    it('should initialize with default values', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.sessionToken).toBeNull();
      expect(state.profile).toBeNull();
    });

    it('should set session and update state correctly', () => {
      const { setSession } = useAuthStore.getState();
      const mockProfile = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'personal' as const,
        fullName: 'John Doe',
        personalId: null,
        inviteCode: 'INV123',
      };

      setSession('mock-jwt-token', mockProfile);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.sessionToken).toBe('mock-jwt-token');
      expect(state.profile).toEqual(mockProfile);
    });

    it('should clear session on logout', () => {
      const { setSession, logout } = useAuthStore.getState();
      const mockProfile = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'student' as const,
        fullName: 'Jane Doe',
        personalId: 'personal-123',
        inviteCode: null,
      };

      setSession('mock-jwt-token', mockProfile);
      logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.sessionToken).toBeNull();
      expect(state.profile).toBeNull();
    });
  });

  describe('useThemeStore', () => {
    beforeEach(() => {
      const { resetTheme } = useThemeStore.getState();
      resetTheme();
    });

    it('should initialize with default themes', () => {
      const state = useThemeStore.getState();
      expect(state.theme.brandName).toBe('NeoStrength');
      expect(state.theme.primaryColor).toBe('#F26A3A');
      expect(state.theme.secondaryColor).toBe('#B84418');
      expect(state.theme.backgroundColor).toBe('#0A0B0E');
      expect(state.theme.textColor).toBe('#F4F2EC');
    });

    it('should set theme and update values correctly', () => {
      const { setTheme } = useThemeStore.getState();
      const customTheme = {
        brandName: 'Extreme Body',
        primaryColor: '#EF4444',
        secondaryColor: '#F59E0B',
        backgroundColor: '#111827',
        textColor: '#F9FAFB',
        logoUrl: 'https://logo.com/img.png',
      };

      setTheme(customTheme);

      const state = useThemeStore.getState();
      expect(state.theme.brandName).toBe('Extreme Body');
      expect(state.theme.primaryColor).toBe('#EF4444');
      expect(state.theme.secondaryColor).toBe('#F59E0B');
      expect(state.theme.backgroundColor).toBe('#111827');
      expect(state.theme.textColor).toBe('#F9FAFB');
      expect(state.theme.logoUrl).toBe('https://logo.com/img.png');
    });
  });
});
