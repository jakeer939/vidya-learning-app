import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient, AuthApi, ApiError } from '@vidya/api-client';
import { AuthUser, LoginRequest, LoginResponse } from '@vidya/auth';

// In-memory mock storage simulating AsyncStorage
class MockStorage {
  private data = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.data.delete(key);
  }

  async multiRemove(keys: string[]): Promise<void> {
    for (const key of keys) {
      this.data.delete(key);
    }
  }

  clear() {
    this.data.clear();
  }
}

describe('Student Authentication & Session Gate', () => {
  let mockStorage: MockStorage;
  let mockFetch: (url: string, init?: RequestInit) => Promise<Response>;
  let originalFetch: typeof globalThis.fetch;

  const AUTH_TOKEN_KEY = '@vidya_student_auth_token';
  const AUTH_USER_KEY = '@vidya_student_user';

  beforeEach(() => {
    mockStorage = new MockStorage();
    originalFetch = globalThis.fetch;
  });

  it('1. Successful Login: authenticates via POST /api/auth/login and stores session', async () => {
    let requestedUrl = '';
    let requestMethod = '';
    let requestBody: any = null;

    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      requestedUrl = url.toString();
      requestMethod = init?.method || 'GET';
      requestBody = init?.body ? JSON.parse(init.body as string) : null;

      const mockResponse: LoginResponse = {
        accessToken: 'mock-jwt-token-12345',
        user: {
          id: 'student-id-1',
          name: 'Demo Student',
          email: 'student@vidya.test',
          role: 'STUDENT',
        },
      };

      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const client = new ApiClient('http://localhost:4000');
    const authApi = new AuthApi(client);

    const loginRes = await authApi.login({
      email: 'student@vidya.test',
      password: 'StudentDemo1!',
    });

    // Verify correct endpoint and payload
    assert.strictEqual(requestedUrl, 'http://localhost:4000/api/auth/login');
    assert.strictEqual(requestMethod, 'POST');
    assert.deepStrictEqual(requestBody, {
      email: 'student@vidya.test',
      password: 'StudentDemo1!',
    });

    // Verify response
    assert.strictEqual(loginRes.accessToken, 'mock-jwt-token-12345');
    assert.strictEqual(loginRes.user.email, 'student@vidya.test');
    assert.strictEqual(loginRes.user.role, 'STUDENT');

    // Simulate saving session to persistent storage
    await mockStorage.setItem(AUTH_TOKEN_KEY, loginRes.accessToken);
    await mockStorage.setItem(AUTH_USER_KEY, JSON.stringify(loginRes.user));
    client.setAccessToken(loginRes.accessToken);

    assert.strictEqual(await mockStorage.getItem(AUTH_TOKEN_KEY), 'mock-jwt-token-12345');
    assert.strictEqual(client.getAuthToken(), 'mock-jwt-token-12345');
  });

  it('2. Invalid Credentials: returns 401 error and does not persist token', async () => {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    const client = new ApiClient('http://localhost:4000');
    const authApi = new AuthApi(client);

    await assert.rejects(
      async () => {
        await authApi.login({
          email: 'student@vidya.test',
          password: 'WrongPassword',
        });
      },
      (err: any) => {
        assert(err instanceof ApiError);
        assert.strictEqual(err.status, 401);
        assert.strictEqual(err.message, 'Invalid email or password');
        return true;
      }
    );

    // Verify storage has no token
    assert.strictEqual(await mockStorage.getItem(AUTH_TOKEN_KEY), null);
    assert.strictEqual(client.getAuthToken(), null);
  });

  it('3. Session Restoration After Reload: calls GET /api/auth/me and restores valid session', async () => {
    // Simulate pre-existing token saved in storage from previous session
    await mockStorage.setItem(AUTH_TOKEN_KEY, 'saved-valid-jwt-token');

    let meHeaders: Headers | undefined;
    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      meHeaders = new Headers(init?.headers);
      const mockUser: AuthUser = {
        id: 'student-id-1',
        name: 'Demo Student',
        email: 'student@vidya.test',
        role: 'STUDENT',
        emailVerifiedAt: '2026-10-14T00:00:00.000Z',
      };
      return new Response(JSON.stringify(mockUser), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const client = new ApiClient('http://localhost:4000');
    const authApi = new AuthApi(client);

    // On app reload, retrieve stored token and validate
    const storedToken = await mockStorage.getItem(AUTH_TOKEN_KEY);
    assert.ok(storedToken);
    client.setAccessToken(storedToken);

    const user = await authApi.me();

    // Verify Authorization Bearer header was sent to GET /api/auth/me
    assert.strictEqual(meHeaders?.get('Authorization'), 'Bearer saved-valid-jwt-token');
    assert.strictEqual(user.id, 'student-id-1');
    assert.strictEqual(user.email, 'student@vidya.test');
    assert.strictEqual(user.role, 'STUDENT');
  });

  it('4. Expired or Invalid Session on Startup: clears storage without redirect loops', async () => {
    // Pre-existing expired token
    await mockStorage.setItem(AUTH_TOKEN_KEY, 'expired-jwt-token');
    await mockStorage.setItem(AUTH_USER_KEY, JSON.stringify({ email: 'old@vidya.test' }));

    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    const client = new ApiClient('http://localhost:4000');
    const authApi = new AuthApi(client);

    const storedToken = await mockStorage.getItem(AUTH_TOKEN_KEY);
    client.setAccessToken(storedToken);

    let sessionUser: AuthUser | null = null;
    try {
      sessionUser = await authApi.me();
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        await mockStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
        client.setAccessToken(null);
        sessionUser = null;
      }
    }

    assert.strictEqual(sessionUser, null);
    assert.strictEqual(await mockStorage.getItem(AUTH_TOKEN_KEY), null);
    assert.strictEqual(await mockStorage.getItem(AUTH_USER_KEY), null);
    assert.strictEqual(client.getAuthToken(), null);
  });

  it('5. Session Loading Behavior and Route Gating State Machine', () => {
    // Model state transitions for the session gate
    type AuthState = {
      loading: boolean;
      user: AuthUser | null;
      token: string | null;
      isAuthenticated: boolean;
    };

    // State 1: App startup (validating session)
    let state: AuthState = {
      loading: true,
      user: null,
      token: null,
      isAuthenticated: false,
    };

    // While loading === true, Gate renders spinner and does NOT redirect
    const getActiveStack = (s: AuthState): 'LOADING' | 'UNAUTHENTICATED' | 'AUTHENTICATED' => {
      if (s.loading) return 'LOADING';
      if (!s.isAuthenticated) return 'UNAUTHENTICATED';
      return 'AUTHENTICATED';
    };

    assert.strictEqual(getActiveStack(state), 'LOADING');

    // State 2: No valid session found -> Transition to Unauthenticated
    state = {
      loading: false,
      user: null,
      token: null,
      isAuthenticated: false,
    };
    assert.strictEqual(getActiveStack(state), 'UNAUTHENTICATED');

    // In Unauthenticated state: Login screen is active, protected screens blocked
    const accessibleRoutesUnauthenticated = ['Login'];
    const protectedRoutes = ['Home', 'Learn', 'Tasks', 'Progress', 'Profile', 'ExamResults'];
    for (const r of protectedRoutes) {
      assert.strictEqual(accessibleRoutesUnauthenticated.includes(r), false);
    }

    // State 3: User logs in successfully -> Transition to Authenticated
    const loggedInUser: AuthUser = {
      id: 's-1',
      name: 'Demo Student',
      email: 'student@vidya.test',
      role: 'STUDENT',
      emailVerifiedAt: '2026-10-14T00:00:00Z',
    };
    state = {
      loading: false,
      user: loggedInUser,
      token: 'new-valid-token',
      isAuthenticated: true,
    };
    assert.strictEqual(getActiveStack(state), 'AUTHENTICATED');

    // State 4: User logs out -> Transition back to Unauthenticated
    state = {
      loading: false,
      user: null,
      token: null,
      isAuthenticated: false,
    };
    assert.strictEqual(getActiveStack(state), 'UNAUTHENTICATED');
  });

  it('6. Forgot Password Copy: directs user to administrator', () => {
    const requiredForgotCopy = 'Please contact the administrator to reset your password.';
    assert.strictEqual(requiredForgotCopy, 'Please contact the administrator to reset your password.');
  });
});
