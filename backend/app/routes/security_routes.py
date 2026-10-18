"""Pre-agent security gateway route for prompt sanitization and threat inspection."""
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.security.firewall import SecurityFirewall

router = APIRouter(prefix="/api/security", tags=["Security"])
firewall = SecurityFirewall()


class PromptInspectRequest(BaseModel):
    """Request payload for pre-agent prompt inspection."""

    message: str = Field(..., description="User prompt or conversational input to inspect")


class PromptInspectResponse(BaseModel):
    """Structured response when prompt passes security inspection."""

    status: str = "SAFE"
    is_safe: bool = True
    reason: str


@router.post("/inspect", response_model=PromptInspectResponse)
async def inspect_prompt(payload: PromptInspectRequest) -> PromptInspectResponse:
    """Validate user prompt against the adversarial firewall or raise SecurityException (HTTP 403)."""
    firewall.enforce_or_raise(payload.message)
    return PromptInspectResponse(
        status="SAFE",
        is_safe=True,
        reason="Input validated safe.",
    )
