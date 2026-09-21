"""
Maps to shared-test-plan.md: VIS-001, VIS-002

NEW: the original scaffold had no test for role-based visibility at all — a
real coverage gap given this system's stated requirement of "full but
appropriate visibility" into employee data. Mirrors
ts-suite/tests/api/employeeVisibility.spec.ts. Compensation/salary is used
as the illustrative restricted field; swap for whatever your system gates.
"""
import pytest
from pydantic import BaseModel
from src.api.api_client import ApiClient


class StandardVisibleFields(BaseModel):
    employeeId: str
    name: str
    position: str
    skills: list[str]
    qualifications: list[str]
    currentProjects: list[str]
    previousProjects: list[str]
    utilizationPercent: float
    availableHoursThisWeek: float


@pytest.mark.api
def test_vis_001_standard_user_sees_appropriate_fields_only(api_base_url, standard_user, sample_employee_id):
    auth_api = ApiClient(api_base_url)
    status, login = auth_api.login(standard_user["email"], standard_user["password"])
    assert status == 200 and login is not None

    employee_api = ApiClient(api_base_url, auth_token=login.token)
    status, body = employee_api.get(f"/employees/{sample_employee_id}", StandardVisibleFields)

    assert status == 200
    assert body.position

    # Confirm a manager-only field does NOT leak through for a standard user.
    # Adjust "compensation" to whatever field your app actually restricts.
    raw = employee_api.session.get(f"{api_base_url}/employees/{sample_employee_id}").json()
    assert "compensation" not in raw

    auth_api.close()
    employee_api.close()


@pytest.mark.api
def test_vis_002_manager_sees_full_profile_including_restricted_fields(api_base_url, admin_user, sample_employee_id):
    auth_api = ApiClient(api_base_url)
    status, login = auth_api.login(admin_user["email"], admin_user["password"])
    assert status == 200 and login is not None

    employee_api = ApiClient(api_base_url, auth_token=login.token)
    response = employee_api.session.get(f"{api_base_url}/employees/{sample_employee_id}?view=full")

    assert response.status_code == 200
    assert "compensation" in response.json()

    auth_api.close()
    employee_api.close()
