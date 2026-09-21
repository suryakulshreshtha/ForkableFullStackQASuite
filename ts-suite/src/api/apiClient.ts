import { APIRequestContext, request } from '@playwright/test';
import { z } from 'zod';

/**
 * Thin wrapper around Playwright's APIRequestContext.
 * - Centralizes base URL + auth header handling.
 * - Callers pass a zod schema to validate + get a typed response back,
 *   so contract drift (API changes shape) fails loudly instead of
 *   silently breaking downstream UI tests that consume the same field.
 */
export class ApiClient {
  private constructor(private ctx: APIRequestContext) {}

  static async create(baseURL: string, authToken?: string): Promise<ApiClient> {
    const ctx = await request.newContext({
      baseURL,
      extraHTTPHeaders: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    return new ApiClient(ctx);
  }

  private static readonly LoginSchema = z.object({
    token: z.string(),
    user: z.object({ id: z.union([z.string(), z.number()]), email: z.string().email() }),
  });

  /**
   * FIX: previously this parsed the success schema unconditionally, so a
   * 401/500 error body (which won't match LoginSchema) made login() itself
   * throw a ZodError. A caller testing "invalid password -> 401" via
   * `expect(api.login(...)).rejects.toThrow()` would then pass on ANY
   * server error, not specifically on 401 — a false-positive risk. Only
   * parse the schema on a 2xx response; otherwise return the raw status
   * and body untouched so callers can assert the exact status they expect.
   */
  async login(email: string, password: string) {
    const res = await this.ctx.post('/auth/login', { data: { email, password } });
    const status = res.status();
    const json = await res.json().catch(() => undefined);
    if (status >= 200 && status < 300) {
      return { status, body: ApiClient.LoginSchema.parse(json) };
    }
    return { status, body: undefined, raw: json };
  }

  async get<T>(path: string, schema: z.ZodType<T>) {
    const res = await this.ctx.get(path);
    const json = await res.json().catch(() => undefined);
    return { status: res.status(), body: json !== undefined ? schema.parse(json) : undefined };
  }

  async post<T>(path: string, data: unknown, schema: z.ZodType<T>) {
    const res = await this.ctx.post(path, { data });
    const json = await res.json().catch(() => undefined);
    return { status: res.status(), body: json !== undefined ? schema.parse(json) : undefined };
  }

  /**
   * Escape hatch for negative-path tests where the response won't validate
   * against any success schema (4xx/5xx). Mirrors py-suite's raw_post().
   * Always prefer this for error-case assertions over threading a failing
   * parse through get()/post().
   */
  async rawPost(path: string, data: unknown) {
    return this.ctx.post(path, { data });
  }

  async rawGet(path: string) {
    return this.ctx.get(path);
  }

  async dispose() {
    await this.ctx.dispose();
  }
}
