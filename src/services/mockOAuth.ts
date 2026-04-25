/**
 * OAuth Mock Provider — Development only
 *
 * Simulates OAuth login (Google/Microsoft) in development without real credentials.
 * This allows the UI to work fully while OAuth credentials are being configured.
 *
 * To enable: set VITE_USE_MOCK_OAUTH=true in .env.local
 * To disable: remove the env var or set it to false
 *
 * REAL CREDS WHEN READY:
 * - Google: https://console.cloud.google.com → Credentials → OAuth 2.0
 * - Microsoft: https://portal.azure.com → App registrations
 */

import { GOOGLE_CLIENT_ID, MICROSOFT_CLIENT_ID } from '@/lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OAuthProvider = 'google' | 'microsoft';

interface MockUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: OAuthProvider;
}

// ─── Storage key ──────────────────────────────────────────────────────────────

const MOCK_TOKEN_KEY = 'facturex_mock_oauth_token';
const MOCK_USER_KEY = 'facturex_mock_oauth_user';

// ─── Mock OAuth flow ─────────────────────────────────────────────────────────

/**
 * Opens a simulated OAuth popup/redirect.
 * In real OAuth, this would redirect to Google/Microsoft authorization page.
 * In mock mode, we simulate the happy path.
 */
export const initiateOAuthMock = async (provider: OAuthProvider): Promise<MockUser> => {
  const useMock = import.meta.env.VITE_USE_MOCK_OAUTH === 'true';

  if (!useMock) {
    throw new Error('Mock OAuth disabled. Configure real OAuth credentials.');
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Generate a mock user based on provider
  const mockUsers: Record<OAuthProvider, MockUser> = {
    google: {
      id: `google_${Date.now()}`,
      email: 'dev.user@gmail.com',
      name: 'Dev User (Google)',
      picture: 'https://ui-avatars.com/api/?name=Dev+User&background=10b981&color=fff',
      provider: 'google',
    },
    microsoft: {
      id: `microsoft_${Date.now()}`,
      email: 'dev.user@outlook.com',
      name: 'Dev User (Microsoft)',
      picture: 'https://ui-avatars.com/api/?name=Dev+User&background=0078d4&color=fff',
      provider: 'microsoft',
    },
  };

  const user = mockUsers[provider];
  const token = `mock_token_${provider}_${Date.now()}`;

  // Store mock session
  localStorage.setItem(MOCK_TOKEN_KEY, token);
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));

  return user;
};

/**
 * Sign out from mock OAuth
 */
export const signOutMockOAuth = () => {
  localStorage.removeItem(MOCK_TOKEN_KEY);
  localStorage.removeItem(MOCK_USER_KEY);
};

/**
 * Get current mock user (if any)
 */
export const getMockOAuthUser = (): MockUser | null => {
  if (import.meta.env.VITE_USE_MOCK_OAUTH !== 'true') return null;

  const stored = localStorage.getItem(MOCK_USER_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as MockUser;
  } catch {
    return null;
  }
};

/**
 * Check if OAuth is configured (real or mock)
 */
export const isOAuthConfigured = (): boolean => {
  // Check if real credentials are set
  if (GOOGLE_CLIENT_ID || MICROSOFT_CLIENT_ID) return true;

  // Check if mock mode is enabled
  if (import.meta.env.VITE_USE_MOCK_OAUTH === 'true') return true;

  return false;
};

/**
 * Get available OAuth providers
 */
export const getAvailableProviders = (): OAuthProvider[] => {
  const providers: OAuthProvider[] = [];

  if (GOOGLE_CLIENT_ID) providers.push('google');
  else if (import.meta.env.VITE_USE_MOCK_OAUTH === 'true') providers.push('google');

  if (MICROSOFT_CLIENT_ID) providers.push('microsoft');
  else if (import.meta.env.VITE_USE_MOCK_OAUTH === 'true') providers.push('microsoft');

  return providers;
};
