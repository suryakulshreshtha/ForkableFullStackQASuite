"""
Thin wrapper around `requests`, mirroring ts-suite/src/api/apiClient.ts.

Centralizes base URL + auth header handling, and validates responses
against pydantic models so contract drift (API changes shape) fails loudly
instead of silently breaking downstream UI/chart tests that consume the
same field.
"""
from __future__ import annotations

import requests
from pydantic import BaseModel, EmailStr
from typing import Optional, Type, TypeVar

T = TypeVar("T", bound=BaseModel)


class LoginUser(BaseModel):
    id: int | str
    email: EmailStr


class LoginResponse(BaseModel):
    token: str
    user: LoginUser


class ApiClient:
    def __init__(self, base_url: str, auth_token: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        if auth_token:
            self.session.headers["Authorization"] = f"Bearer {auth_token}"

    def login(self, email: str, password: str) -> tuple[int, Optional[LoginResponse]]:
        res = self.session.post(f"{self.base_url}/auth/login", json={"email": email, "password": password})
        body = None
        if res.headers.get("content-type", "").startswith("application/json"):
            try:
                body = LoginResponse.model_validate(res.json())
            except Exception:
                body = None
        return res.status_code, body

    def get(self, path: str, schema: Type[T]) -> tuple[int, Optional[T]]:
        res = self.session.get(f"{self.base_url}{path}")
        body = None
        if res.ok:
            body = schema.model_validate(res.json())
        return res.status_code, body

    def post(self, path: str, data: dict, schema: Type[T]) -> tuple[int, Optional[T]]:
        res = self.session.post(f"{self.base_url}{path}", json=data)
        body = None
        if res.ok:
            body = schema.model_validate(res.json())
        return res.status_code, body

    def raw_post(self, path: str, data: dict) -> requests.Response:
        """Escape hatch for negative tests where the response won't validate."""
        return self.session.post(f"{self.base_url}{path}", json=data)

    def close(self):
        self.session.close()
