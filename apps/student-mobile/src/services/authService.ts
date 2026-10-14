import { ApiClient, AuthApi, ApiError } from '@vidya/api-client';
import { AuthUser, LoginResponse } from '@vidya/auth';

export const AUTH_TOKEN_KEY = '@vidya_student_auth_token';
export const AUTH_USER_KEY = '@vidya_student_user';

export interface StorageProvider {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
}

// In-memory fallback for test and server environments
const memoryMap = new Map<string, string>();
export const memoryStorage: StorageProvider = {
  getItem: async (key: string) => memoryMap.get(key) ?? null,
  setItem: async (key: string, val: string) => {
    memoryMap.set(key, val);
  },
  removeItem: async (key: string) => {
    memoryMap.delete(key);
  },
  multiRemove: async (keys: string[]) => {
    for (const k of keys) {
      memoryMap.delete(k);
    }
  },
};

let activeStorage: StorageProvider | null = null;

export const setStorageProvider = (provider: StorageProvider | null) => {
  activeStorage = provider;
};

export const getStorage = (): StorageProvider => {
  if (activeStorage) return activeStorage;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const asyncStorage = require('@react-native-async-storage/async-storage');
    activeStorage = asyncStorage.default || asyncStorage;
    return activeStorage!;
  } catch {
    return memoryStorage;
  }
};

const getPlatformOS = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rn = require('react-native');
    return rn?.Platform?.OS || 'web';
  } catch {
    return 'web';
  }
};

/**
 * Resolves the Fastify / NestJS API base URL.
 * Supports EXPO_PUBLIC_API_URL, Android emulator loopback (10.0.2.2), and localhost.
 */
export const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (getPlatformOS() === 'android') {
    return 'http://10.0.2.2:4000';
  }
  return 'http://localhost:4000';
};

let clientInstance: ApiClient | null = null;
let authApiInstance: AuthApi | null = null;

export const getApiClient = (): ApiClient => {
  if (!clientInstance) {
    clientInstance = new ApiClient({
      baseUrl: getApiBaseUrl(),
    });
  }
  return clientInstance;
};

export const getAuthApi = (): AuthApi => {
  if (!authApiInstance) {
    authApiInstance = new AuthApi(getApiClient());
  }
  return authApiInstance;
};

/**
 * Reset instances (used for testing or environment changes).
 */
export const resetClientInstances = () => {
  clientInstance = null;
  authApiInstance = null;
  memoryMap.clear();
};

export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await getStorage().getItem(AUTH_TOKEN_KEY);
  } catch (err) {
    console.warn('Failed to load student token from storage:', err);
    return null;
  }
};

export const getStoredUser = async (): Promise<AuthUser | null> => {
  try {
    const raw = await getStorage().getItem(AUTH_USER_KEY);
    if (raw) {
      return JSON.parse(raw) as AuthUser;
    }
  } catch (err) {
    console.warn('Failed to load student user from storage:', err);
  }
  return null;
};

export const saveStoredAuth = async (token: string, user: AuthUser): Promise<void> => {
  try {
    const storage = getStorage();
    await storage.setItem(AUTH_TOKEN_KEY, token);
    await storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    getApiClient().setAccessToken(token);
  } catch (err) {
    console.warn('Failed to save student auth session:', err);
  }
};

export const clearStoredAuth = async (): Promise<void> => {
  try {
    const storage = getStorage();
    await storage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
    getApiClient().setAccessToken(null);
  } catch (err) {
    console.warn('Failed to clear student auth session:', err);
  }
};

/**
 * Performs student login via POST /api/auth/login.
 */
export const loginStudent = async (
  email: string,
  pass: string
): Promise<{ token: string; user: AuthUser }> => {
  const authApi = getAuthApi();
  const res: LoginResponse = await authApi.login({
    email,
    password: pass,
  });

  // Login payload omits emailVerifiedAt — hydrate the full AuthUser from /me.
  getApiClient().setAccessToken(res.accessToken);
  const studentUser = await authApi.me();

  await saveStoredAuth(res.accessToken, studentUser);
  return { token: res.accessToken, user: studentUser };
};

/**
 * Validates session against GET /api/auth/me on app launch or reload.
 * Returns the fresh AuthUser if session is valid, or null if expired/unauthenticated.
 */
export const validateSession = async (): Promise<AuthUser | null> => {
  const token = await getStoredToken();
  if (!token) {
    getApiClient().setAccessToken(null);
    return null;
  }

  getApiClient().setAccessToken(token);

  try {
    const authApi = getAuthApi();
    const user = await authApi.me();
    // Refresh cached user in storage
    await getStorage().setItem(AUTH_USER_KEY, JSON.stringify(user));
    return user;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      // Session expired or invalid
      await clearStoredAuth();
      return null;
    }

    // Network error during reload: if cached user exists, return it to prevent harsh logout loop
    const cachedUser = await getStoredUser();
    if (cachedUser) {
      return cachedUser;
    }

    await clearStoredAuth();
    return null;
  }
};

export const logoutStudent = async (): Promise<void> => {
  await clearStoredAuth();
};
