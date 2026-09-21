import { test, expect } from '@playwright/test';
import { ApiClient } from '../../src/api/apiClient';
import { z } from 'zod';

// Maps to shared-test-plan.md: VIS-001, VIS-002
//
// NEW: the original scaffold had no test for role-based visibility at all —
// a real coverage gap given this system's stated requirement of "full but
// appropriate visibility" into employee data. Compensation/salary is used
// below as the illustrative restricted field; swap for whatever fields your
// system actually gates by role.

const StandardVisibleFields = z.object({
  employeeId: z.string(),
  name: z.string(),
  position: z.string(),
  skills: z.array(z.string()),
  qualifications: z.array(z.string()),
  currentProjects: z.array(z.string()),
  previousProjects: z.array(z.string()),
  utilizationPercent: z.number(),
  availableHoursThisWeek: z.number(),
});

test.describe('Employee profile visibility by role', () => {
  test('VIS-001: standard user sees appropriate (non-restricted) fields only', async () => {
    const authApi = await ApiClient.create(process.env.API_BASE_URL || 'http://localhost:3000/api');
    const { body: login } = await authApi.login(
      process.env.QA_STANDARD_USER_EMAIL!,
      process.env.QA_STANDARD_USER_PASSWORD!
    );
    const employeeApi = await ApiClient.create(
      process.env.API_BASE_URL || 'http://localhost:3000/api',
      login.token
    );

    const employeeId = process.env.QA_SAMPLE_EMPLOYEE_ID || 'EMP-1001';
    const { status, body } = await employeeApi.get(`/employees/${employeeId}`, StandardVisibleFields);

    expect(status).toBe(200);
    // Confirms the standard-visibility fields are present...
    expect(body.position).toBeTruthy();
    // ...and that a manager-only field is NOT leaking through to this role.
    // Adjust "compensation" to whatever field your app actually restricts.
    expect(body).not.toHaveProperty('compensation');

    await authApi.dispose();
    await employeeApi.dispose();
  });

  test('VIS-002: manager/admin sees full employee profile including restricted fields', async () => {
    const authApi = await ApiClient.create(process.env.API_BASE_URL || 'http://localhost:3000/api');
    const { body: login } = await authApi.login(
      process.env.QA_ADMIN_USER_EMAIL!,
      process.env.QA_ADMIN_USER_PASSWORD!
    );
    const employeeApi = await ApiClient.create(
      process.env.API_BASE_URL || 'http://localhost:3000/api',
      login.token
    );

    const employeeId = process.env.QA_SAMPLE_EMPLOYEE_ID || 'EMP-1001';
    const res = await employeeApi.rawGet(`/employees/${employeeId}?view=full`);
    const body = await res.json();

    expect(res.status()).toBe(200);
    expect(body).toHaveProperty('compensation');

    await authApi.dispose();
    await employeeApi.dispose();
  });
});
