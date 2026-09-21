import { test, expect } from '@playwright/test';
import { ApiClient } from '../../src/api/apiClient';
import { z } from 'zod';

// Maps to shared-test-plan.md: CHART-001
//
// Replaces the earlier placeholder (a generic "revenue chart"), which
// didn't match this system: the CRM's dashboard chart shows an employee's
// utilization percentage over time, not revenue.
//
// Strategy unchanged: read the LIVE Chart.js instance data via
// page.evaluate() rather than pixel/visual snapshotting, and assert it
// against the API's data for the same employee.

const UtilizationSchema = z.object({
  periodLabels: z.array(z.string()), // e.g. week/month labels
  utilizationPercent: z.array(z.number()),
});

test('CHART-001: employee utilization chart matches API data', async ({ page }) => {
  const employeeId = process.env.QA_SAMPLE_EMPLOYEE_ID || 'EMP-1001'; // adjust to a real seeded employee
  const api = await ApiClient.create(process.env.API_BASE_URL || 'http://localhost:3000/api');
  const { body: apiData } = await api.get(`/employees/${employeeId}/utilization`, UtilizationSchema);
  await api.dispose();

  await page.goto(`/employees/${employeeId}`);
  const canvas = page.locator('canvas#employee-utilization-chart'); // adjust to actual canvas id
  await expect(canvas).toBeVisible();

  const chartData = await page.evaluate(() => {
    const canvasEl = document.querySelector('canvas#employee-utilization-chart') as HTMLCanvasElement;
    // @ts-expect-error - Chart is a global loaded by the app, not typed here
    const chartInstance = window.Chart?.getChart(canvasEl);
    return {
      labels: chartInstance?.data?.labels ?? [],
      values: chartInstance?.data?.datasets?.[0]?.data ?? [],
    };
  });

  expect(chartData.labels).toEqual(apiData?.periodLabels);
  expect(chartData.values).toEqual(apiData?.utilizationPercent);
});
