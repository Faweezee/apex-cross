"""FastAPI application entrypoint for ApexCross."""
from typing import Any, Dict
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from pydantic import TypeAdapter

from app.config import settings
from app.routes.fx_routes import router as fx_router
from app.routes.invoice_routes import router as invoice_router
from app.routes.security_routes import router as security_router
from app.schemas import (
    AuditRecord,
    CurrencyEnum,
    DagTask,
    RemittancePlan,
    RemittanceRoute,
    SecurityTier,
    UniversityInvoice,
)
from app.security.firewall import SecurityException

app = FastAPI(
    title=settings.app_name,
    description="Autonomous Cross-Border Financial Participant Agent API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SecurityException)
async def security_exception_handler(request: Request, exc: SecurityException) -> JSONResponse:
    """Fail-closed exception handler returning HTTP 403 on detected security violations."""
    return JSONResponse(
        status_code=403,
        content={
            "status": "BLOCKED",
            "error": "SecurityException",
            "reason": exc.reason,
        },
    )


app.include_router(fx_router)
app.include_router(invoice_router)
app.include_router(security_router)


@app.get("/api/health", tags=["Health"])
async def health_check() -> Dict[str, str]:
    """Return service health status."""
    return {"status": "healthy", "service": settings.app_name}


def get_openapi_schema() -> Dict[str, Any]:
    """Generate OpenAPI 3.1 schema including all domain contract models."""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    components = openapi_schema.setdefault("components", {})
    schemas = components.setdefault("schemas", {})

    contract_models = [
        SecurityTier,
        CurrencyEnum,
        RemittanceRoute,
        UniversityInvoice,
        DagTask,
        RemittancePlan,
        AuditRecord,
    ]
    for model in contract_models:
        adapter = TypeAdapter(model)
        json_schema = adapter.json_schema(ref_template="#/components/schemas/{model}")
        defs = json_schema.pop("$defs", {})
        for def_name, def_schema in defs.items():
            schemas[def_name] = def_schema
        schemas[model.__name__] = json_schema

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = get_openapi_schema
