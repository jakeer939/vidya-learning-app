import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  loginStudent,
  validateSession,
  logoutStudent,
  getStoredToken,
  getStoredUser,
  getApiClient,
  resetClientInstances,
  setStorageProvider,
  memoryStorage,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
} from '../src/services/authService';
import { ApiError } from '@vidya/api-client';
import { LoginResponse, AuthUser } from '@vidya/auth';

describe('authService Integration Tests', () => {
  beforeEach(() => {
    resetClientInstances();
    setStorageProvider(memoryStorage);
  });

  it('loginStudent: saves token, updates ApiClient accessToken, and stores user', async () => {
    const calledUrls: string[] = [];
    let calledBody: any = null;

    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = url.toString();
      calledUrls.push(path);

      if (path.endsWith('/api/auth/login')) {
        calledBody = init?.body ? JSON.parse(init.body as string) : null;
        const mockRes: LoginResponse = {
          accessToken: 'jwt-student-token-abc',
          user: {
            id: 'student-99',
            name: 'Priya Patel',
            email: 'priya@vidya.test',
            role: 'STUDENT',
          },
        };
        return new Response(JSON.stringify(mockRes), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (path.endsWith('/api/auth/me')) {
        const mockUser: AuthUser = {
          id: 'student-99',
          name: 'Priya Patel',
          email: 'priya@vidya.test',
          role: 'STUDENT',
          emailVerifiedAt: '2026-10-14T10:00:00.000Z',
        };
        return new Response(JSON.stringify(mockUser), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    };

    const result = await loginStudent('priya@vidya.test', 'SecretPass123!');

    assert.deepStrictEqual(calledUrls, [
      'http://localhost:4000/api/auth/login',
      'http://localhost:4000/api/auth/me',
    ]);
    assert.deepStrictEqual(calledBody, {
      email: 'priya@vidya.test',
      password: 'SecretPass123!',
    });
    assert.strictEqual(result.token, 'jwt-student-token-abc');
    assert.strictEqual(result.user.name, 'Priya Patel');
    assert.strictEqual(result.user.emailVerifiedAt, '2026-10-14T10:00:00.000Z');

    // Storage and client assertions
    assert.strictEqual(await getStoredToken(), 'jwt-student-token-abc');
    const storedUser = await getStoredUser();
    assert.strictEqual(storedUser?.id, 'student-99');
    assert.strictEqual(storedUser?.emailVerifiedAt, '2026-10-14T10:00:00.000Z');
    assert.strictEqual(getApiClient().getAuthToken(), 'jwt-student-token-abc');
  });

  it('loginStudent: throws ApiError on 401 invalid credentials', async () => {
    globalThis.fetch = async () => {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    await assert.rejects(
      async () => {
        await loginStudent('priya@vidya.test', 'BadPassword');
      },
      (err: any) => {
        assert(err instanceof ApiError);
        assert.strictEqual(err.status, 401);
        assert.strictEqual(err.message, 'Invalid email or password');
        return true;
      }
    );

    assert.strictEqual(await getStoredToken(), null);
    assert.strictEqual(getApiClient().getAuthToken(), null);
  });

  it('validateSession: restores valid session via GET /api/auth/me', async () => {
    await memoryStorage.setItem(AUTH_TOKEN_KEY, 'restored-token-xyz');

    let authHeader = '';
    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      authHeader = new Headers(init?.headers).get('Authorization') || '';
      const mockUser: AuthUser = {
        id: 'student-100',
        name: 'Rahul Varma',
        email: 'rahul@vidya.test',
        role: 'STUDENT',
        emailVerifiedAt: '2026-10-14T10:00:00Z',
      };
      return new Response(JSON.stringify(mockUser), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const user = await validateSession();

    assert.strictEqual(authHeader, 'Bearer restored-token-xyz');
    assert.strictEqual(user?.id, 'student-100');
    assert.strictEqual(user?.name, 'Rahul Varma');
    assert.strictEqual(getApiClient().getAuthToken(), 'restored-token-xyz');
  });

  it('validateSession: handles 401 expired session by clearing token and returning null', async () => {
    await memoryStorage.setItem(AUTH_TOKEN_KEY, 'expired-token');
    await memoryStorage.setItem(AUTH_USER_KEY, JSON.stringify({ email: 'old@vidya.test' }));

    globalThis.fetch = async () => {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const user = await validateSession();

    assert.strictEqual(user, null);
    assert.strictEqual(await getStoredToken(), null);
    assert.strictEqual(await getStoredUser(), null);
    assert.strictEqual(getApiClient().getAuthToken(), null);
  });

  it('logoutStudent: clears stored auth and resets client token', async () => {
    await memoryStorage.setItem(AUTH_TOKEN_KEY, 'active-token');
    await memoryStorage.setItem(AUTH_USER_KEY, JSON.stringify({ email: 'user@vidya.test' }));
    getApiClient().setAccessToken('active-token');

    await logoutStudent();

    assert.strictEqual(await getStoredToken(), null);
    assert.strictEqual(await getStoredUser(), null);
    assert.strictEqual(getApiClient().getAuthToken(), null);
  });
});
