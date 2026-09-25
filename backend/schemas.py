"""Validated API inputs."""
from typing import Literal
from urllib.parse import urlsplit
from pydantic import BaseModel, EmailStr, Field, field_validator

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(default="", max_length=80)
    region: str = Field(default="tashkent", min_length=1, max_length=40)
    lang: Literal["ru", "uz", "en"] = "ru"


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ProfileIn(BaseModel):
    name: str = Field(default="", max_length=80)
    region: str = Field(default="tashkent", min_length=1, max_length=40)
    lang: Literal["ru", "uz", "en"] = "ru"


class PasswordIn(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class TrackIn(BaseModel):
    product_id: str = Field(min_length=1, max_length=80)
    target_price: int | None = Field(default=None, gt=0, le=10**12)
    contact: str = Field(default="", max_length=200)


class SearchIn(BaseModel):
    query: str = Field(max_length=200)
    results: int = Field(default=0, ge=0, le=1000000)
    lang: Literal["ru", "uz", "en"] = "ru"


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=600)


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    lang: Literal["ru", "uz", "en"] = "ru"
    product_id: str | None = None
    history: list[ChatTurn] = Field(default_factory=list, max_length=12)


class CompareVerdictIn(BaseModel):
    product_ids: list[str] = Field(min_length=2, max_length=4)
    lang: Literal["ru", "uz", "en"] = "ru"


class BundleIn(BaseModel):
    query: str = Field(min_length=2, max_length=200)
    budget: int | None = Field(default=None, gt=0, le=10**12)
    category_id: str | None = None
    lang: Literal["ru", "uz", "en"] = "ru"


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    region: str
    lang: str


class IntegrationInput(BaseModel):
    @field_validator("feed_url", "site_url", check_fields=False)
    @classmethod
    def valid_url(cls, value):
        value = value.strip()
        if value:
            parts = urlsplit(value)
            if parts.scheme not in ("http", "https") or not parts.hostname or parts.username or parts.password:
                raise ValueError("Use an http(s) URL without credentials")
        return value


class SaveIntegrationIn(IntegrationInput):
    platform_id: str
    api_key: str = Field(default="", max_length=2048)
    feed_url: str = Field(default="", max_length=2048)
    integration_type: Literal["api", "feed", "scraper"] = "api"
    sync_interval: int = Field(default=60, ge=5, le=1440)
    status: Literal["active", "paused", "error"] = "active"


class TestIntegrationIn(IntegrationInput):
    platform_id: str
    api_key: str = Field(default="", max_length=2048)
    feed_url: str = Field(default="", max_length=2048)
    integration_type: Literal["api", "feed", "scraper"] = "api"


class CreatePlatformIn(IntegrationInput):
    id: str = Field(min_length=2, max_length=30, pattern=r"^[a-z0-9][a-z0-9_-]*$")
    name: str = Field(min_length=2, max_length=50)
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    site_url: str = Field(default="", max_length=2048)
    integration_type: Literal["api", "feed", "scraper"] = "api"
    api_key: str = Field(default="", max_length=2048)
    feed_url: str = Field(default="", max_length=2048)
