from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..schemas import AssistantChatRequest, AssistantChatResponse, AssistantStatus
from ..services.assistant import (
    AssistantProviderError,
    build_travel_context,
    generate_assistant_response,
    get_assistant_provider,
)

router = APIRouter()
UNAVAILABLE_DETAIL = "The AI travel assistant is not available right now. Please try again later."


@router.get("/assistant/status", response_model=AssistantStatus)
def assistant_status(_user: User = Depends(get_current_user)):
    provider = get_assistant_provider()
    return AssistantStatus(available=provider is not None, provider=provider.name if provider else None)


@router.post("/assistant/chat", response_model=AssistantChatResponse)
async def assistant_chat(
    payload: AssistantChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    provider = get_assistant_provider()
    if provider is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI travel assistant is not configured yet.",
        )
    context = build_travel_context(db, user, payload)
    try:
        result = await generate_assistant_response(provider, payload, context)
    except AssistantProviderError as exc:
        if str(exc) == "timeout":
            code = status.HTTP_504_GATEWAY_TIMEOUT
        elif str(exc) == "malformed":
            code = status.HTTP_502_BAD_GATEWAY
        else:
            code = status.HTTP_503_SERVICE_UNAVAILABLE
        raise HTTPException(status_code=code, detail=UNAVAILABLE_DETAIL) from None
    except Exception:
        # Keep provider/network internals out of API responses and logs.
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=UNAVAILABLE_DETAIL) from None
    return result
