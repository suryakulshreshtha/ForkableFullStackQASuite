"""
Locator strategy (no data-testid available yet — see root README):
priority order is get_by_role > get_by_label > get_by_placeholder > get_by_text.
If you have to fall back to a CSS selector, it lives HERE and only here —
never inline in a test file — so a markup change means one edit.

Must target the SAME elements as ts-suite/src/pages/LoginPage.ts — check
that file before inventing a different locator for the same element.
"""
from __future__ import annotations
from playwright.sync_api import Page, Locator, expect
import re


class LoginPage:
    def __init__(self, page: Page):
        self.page = page
        self.email_input: Locator = page.get_by_label(re.compile("email", re.I))
        self.password_input: Locator = page.get_by_label(re.compile("password", re.I))
        self.submit_button: Locator = page.get_by_role(
            "button", name=re.compile("log in|sign in", re.I)
        )
        self.error_message: Locator = page.get_by_text(
            re.compile("invalid (email|credentials|password)", re.I)
        )

    def goto(self):
        self.page.goto("/login")

    def login(self, email: str, password: str):
        self.email_input.fill(email)
        self.password_input.fill(password)
        self.submit_button.click()

    def expect_login_error(self):
        expect(self.error_message).to_be_visible()

    def expect_redirected_to_dashboard(self):
        self.page.wait_for_url(re.compile(r"/dashboard"))
