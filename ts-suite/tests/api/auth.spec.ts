import { test, expect } from '@playwright/test';
import { ApiClient } from '../../src/api/apiClient';

// Maps to shared-test-plan.md: AUTH-001, AUTH-002, AUTH-003

test.describe('Auth API', () => {
  let api: ApiClient;

  test.beforeAll(async () => {
    api = await ApiClient.create(process.env.API_BASE_URL || 'http://localhost:3000/api');
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test('AUTH-001: valid credentials return 200 + token', async () => {
    const { status, body } = await api.login(
      process.env.QA_STANDARD_USER_EMAIL!,
      process.env.QA_STANDARD_USER_PASSWORD!
    );
    expect(status).toBe(200);
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe(process.env.QA_STANDARD_USER_EMAIL);
  });

  // FIX: previously asserted `.rejects.toThrow()` on api.login(), which
  // threw because the LoginSchema parse failed on the error body — that
  // passes on ANY thrown error (a 500 would pass too), not specifically a
  // 401. rawPost() bypasses schema parsing so the status itself is the
  // assertion, matching what AUTH-002 in the shared test plan actually asks.
  test('AUTH-002: invalid password returns 401', async () => {
    const res = await api.rawPost('/auth/login', {
      email: process.env.QA_STANDARD_USER_EMAIL!,
      password: 'wrong-password',
    });
    expect(res.status()).toBe(401);
    // NOTE: once the real error response shape is known, also assert its
    // schema here (e.g. { error: { code, message } }) rather than status alone.
  });

  test('AUTH-003: malformed payload returns 400', async () => {
    const res = await api.rawPost('/auth/login', { email: 'not-an-email' }); // missing password
    expect(res.status()).toBe(400);
  });
});
