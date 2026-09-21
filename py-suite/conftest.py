import os
import pytest
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

load_dotenv()


@pytest.fixture(scope="session")
def base_url() -> str:
    return os.environ.get("BASE_URL", "http://localhost:3000")


@pytest.fixture(scope="session")
def api_base_url() -> str:
    return os.environ.get("API_BASE_URL", "http://localhost:3000/api")


@pytest.fixture(scope="session")
def standard_user() -> dict:
    return {
        "email": os.environ["QA_STANDARD_USER_EMAIL"],
        "password": os.environ["QA_STANDARD_USER_PASSWORD"],
    }


@pytest.fixture(scope="session")
def admin_user() -> dict:
    return {
        "email": os.environ["QA_ADMIN_USER_EMAIL"],
        "password": os.environ["QA_ADMIN_USER_PASSWORD"],
    }


@pytest.fixture(scope="session")
def sample_employee_id() -> str:
    return os.environ.get("QA_SAMPLE_EMPLOYEE_ID", "EMP-1001")


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args, base_url):
    # Applies to pytest-playwright's built-in page/context fixtures.
    return {**browser_context_args, "base_url": base_url}


@pytest.fixture(scope="session")
def storage_state_path(tmp_path_factory, base_url, standard_user):
    """
    Logs in once via UI and saves storage_state so UI tests (other than the
    login flow itself) can skip the login screen entirely. Mirrors the TS
    suite's storageState approach in playwright.config.ts.
    """
    path = tmp_path_factory.mktemp("auth") / "user.json"
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(base_url=base_url)
        page = context.new_page()
        page.goto("/login")
        page.get_by_label("Email", exact=False).fill(standard_user["email"])
        page.get_by_label("Password", exact=False).fill(standard_user["password"])
        page.get_by_role("button", name="Log in").or_(
            page.get_by_role("button", name="Sign in")
        ).click()
        page.wait_for_url("**/dashboard**")
        context.storage_state(path=str(path))
        browser.close()
    return str(path)
