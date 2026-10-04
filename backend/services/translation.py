import ipaddress
import json
from typing import Protocol
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from ..config import Settings, get_settings

MAX_TRANSLATION_CHARACTERS = 500
PROVIDER_NAME = "Self-hosted IndicTrans2"
INDICTRANS2_CODES = {
    "en": "eng_Latn",
    "hi": "hin_Deva",
    "ta": "tam_Taml",
    "te": "tel_Telu",
    "kn": "kan_Knda",
    "ml": "mal_Mlym",
    "bn": "ben_Beng",
    "mr": "mar_Deva",
}


class TranslationProviderError(Exception):
    """Safe provider error; callers must not expose underlying network details."""


class TranslationProvider(Protocol):
    name: str

    def translate(self, text: str, source_language: str, target_language: str) -> str: ...


class IndicTrans2HTTPProvider:
    """Adapter for a locally hosted IndicTrans2 inference endpoint.

    The configured endpoint accepts JSON with text/source_language/target_language
    (IndicTrans2 model codes) and returns JSON with a `translation` string.
    """

    name = PROVIDER_NAME

    def __init__(self, endpoint: str, timeout: float = 10):
        parsed = urlparse(endpoint)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            raise ValueError("Translation provider URL must be an HTTP(S) URL.")
        host = parsed.hostname.casefold()
        try:
            is_loopback = ipaddress.ip_address(host).is_loopback
        except ValueError:
            is_loopback = host == "localhost"
        if not is_loopback:
            raise ValueError("Translation provider must use a loopback host.")
        self.endpoint = endpoint
        self.timeout = timeout

    def translate(self, text: str, source_language: str, target_language: str) -> str:
        payload = json.dumps({
            "text": text,
            "source_language": INDICTRANS2_CODES[source_language],
            "target_language": INDICTRANS2_CODES[target_language],
        }).encode("utf-8")
        request = Request(
            self.endpoint,
            data=payload,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )
        try:
            with urlopen(request, timeout=self.timeout) as response:
                data = json.loads(response.read().decode("utf-8"))
        except TimeoutError as exc:
            raise TranslationProviderError("timeout") from exc
        except HTTPError as exc:
            if exc.code in {408, 504}:
                raise TranslationProviderError("timeout") from exc
            raise TranslationProviderError("unavailable") from exc
        except URLError as exc:
            if isinstance(exc.reason, TimeoutError):
                raise TranslationProviderError("timeout") from exc
            raise TranslationProviderError("unavailable") from exc
        except (OSError, ValueError) as exc:
            raise TranslationProviderError("unavailable") from exc
        translation = data.get("translation") if isinstance(data, dict) else None
        if not isinstance(translation, str) or not translation.strip():
            raise TranslationProviderError("invalid response")
        return translation.strip()


def get_translation_provider(settings: Settings | None = None) -> TranslationProvider | None:
    settings = settings or get_settings()
    endpoint = settings.translation_provider_url
    if not endpoint:
        return None
    try:
        return IndicTrans2HTTPProvider(endpoint, settings.translation_provider_timeout_seconds)
    except ValueError:
        return None
