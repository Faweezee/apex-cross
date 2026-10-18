# 01: Monorepo Scaffolding & Dual-Runtime Healthcheck

**What to build:** A working, dual-runtime monorepo environment running FastAPI on port 8000 and Next.js 15 on port 3000, communicating over a verified CORS healthcheck endpoint.

**Blocked by:** None (can start immediately).

**Status:** completed (Backend Track)

- [x] FastAPI backend initialized with async healthcheck route (`GET /api/health`).
- [ ] Next.js 15 frontend App Router initialized with Tailwind CSS and Lucide icons.
- [x] Root `docker-compose.yml` orchestrates both services in local staging mode.
- [x] Verification command `curl http://localhost:8000/api/health` returns HTTP 200 with JSON status.
