"""Tests for the FastAPI healthcheck and CORS configuration."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint_returns_healthy_status():
    """Verify GET /api/health returns HTTP 200 and expected JSON contract."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "ApexCross"}


def test_cors_allows_localhost_3000():
    """Verify CORS middleware permits requests from http://localhost:3000."""
    response = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
