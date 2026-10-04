from fastapi import APIRouter, Depends, HTTPException, status

from ..dependencies import get_current_user
from ..models import User
from ..schemas import TranslationRequest, TranslationResponse
from ..services.translation import (
    TranslationProviderError,
    get_translation_provider,
)

router = APIRouter()
UNAVAILABLE_DETAIL = "Translation service is temporarily unavailable."
MAX_TEXT_DETAIL = "Please shorten your text and try again."


@router.post("/translation/translate", response_model=TranslationResponse)
def translate_text(
    payload: TranslationRequest,
    _user: User = Depends(get_current_user),
):
    provider = get_translation_provider()
    if provider is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=UNAVAILABLE_DETAIL)
    try:
        translation = provider.translate(payload.text, payload.source_language, payload.target_language)
    except TranslationProviderError as exc:
        if str(exc) == "timeout":
            raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=UNAVAILABLE_DETAIL) from None
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=UNAVAILABLE_DETAIL) from None
    except Exception:
        # Provider errors are deliberately generic; never leak provider internals.
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=UNAVAILABLE_DETAIL) from None
    return TranslationResponse(
        translation=translation,
        source_language=payload.source_language,
        target_language=payload.target_language,
        provider=provider.name,
    )
