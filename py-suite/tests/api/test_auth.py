"""Maps to shared-test-plan.md: AUTH-001, AUTH-002, AUTH-003"""
import pytest
from src.api.api_client import ApiClient


@pytest.fixture
def api(api_base_url):
    client = ApiClient(api_base_url)
    yield client
    client.close()


@pytest.mark.api
def test_auth_001_valid_credentials_return_200_and_token(api, standard_user):
    status, body = api.login(standard_user["email"], standard_user["password"])
    assert status == 200
    assert body is not None
    assert body.token
    assert body.user.email == standard_user["email"]


@pytest.mark.api
def test_auth_002_invalid_password_returns_401(api, standard_user):
    res = api.raw_post("/auth/login", {"email": standard_user["email"], "password": "wrong-password"})
    assert res.status_code == 401
    # NOTE: adjust once the real error response shape is confirmed —
    # assert against the structured error schema directly if one exists.


@pytest.mark.api
def test_auth_003_malformed_payload_returns_400(api):
    res = api.raw_post("/auth/login", {"email": "not-an-email"})  # missing password
    assert res.status_code == 400
