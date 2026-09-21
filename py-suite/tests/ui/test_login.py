"""
Maps to shared-test-plan.md: AUTH-004, AUTH-005

NOTE: intentionally does NOT use storage_state_path (it's testing the login
flow itself). Other UI tests should depend on storage_state_path to skip
logging in via the UI every test.
"""
import pytest
from src.pages.login_page import LoginPage


@pytest.mark.ui
def test_auth_004_valid_credentials_redirect_to_dashboard(page, standard_user):
    login_page = LoginPage(page)
    login_page.goto()
    login_page.login(standard_user["email"], standard_user["password"])
    login_page.expect_redirected_to_dashboard()


@pytest.mark.ui
def test_auth_005_invalid_credentials_show_inline_error(page, standard_user):
    login_page = LoginPage(page)
    login_page.goto()
    login_page.login(standard_user["email"], "wrong-password")
    login_page.expect_login_error()
