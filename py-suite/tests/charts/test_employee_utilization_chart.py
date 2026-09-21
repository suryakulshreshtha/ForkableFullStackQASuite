"""
Maps to shared-test-plan.md: CHART-001

Replaces the earlier placeholder (a generic "revenue chart"), which didn't
match this system: the CRM's dashboard chart shows an employee's utilization
percentage over time. Mirrors
ts-suite/tests/charts/employeeUtilizationChart.spec.ts exactly.
"""
import os
import pytest
from pydantic import BaseModel
from src.api.api_client import ApiClient


class UtilizationData(BaseModel):
    periodLabels: list[str]
    utilizationPercent: list[float]


@pytest.mark.charts
def test_chart_001_employee_utilization_chart_matches_api_data(page, api_base_url):
    employee_id = os.environ.get("QA_SAMPLE_EMPLOYEE_ID", "EMP-1001")  # adjust to a real seeded employee

    api = ApiClient(api_base_url)
    status, api_data = api.get(f"/employees/{employee_id}/utilization", UtilizationData)
    api.close()
    assert status == 200
    assert api_data is not None

    page.goto(f"/employees/{employee_id}")
    canvas = page.locator("canvas#employee-utilization-chart")  # adjust to actual canvas id
    canvas.wait_for(state="visible")

    chart_data = page.evaluate(
        """() => {
            const canvasEl = document.querySelector('canvas#employee-utilization-chart');
            const chartInstance = window.Chart?.getChart(canvasEl);
            return {
                labels: chartInstance?.data?.labels ?? [],
                values: chartInstance?.data?.datasets?.[0]?.data ?? [],
            };
        }"""
    )

    assert chart_data["labels"] == api_data.periodLabels
    assert chart_data["values"] == api_data.utilizationPercent
