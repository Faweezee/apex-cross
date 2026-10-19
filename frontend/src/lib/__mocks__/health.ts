import type { HealthResponse, MockErrorResponse } from './types';

export function mockHealthyResponse(): HealthResponse {
  return { status: 'healthy', service: 'apexcross-backend' };
}

/** Backend reachable but degraded. For a fully disconnected state, abort the route instead. */
export function mockUnhealthyResponse(): MockErrorResponse {
  return {
    status: 503,
    body: { detail: 'Service unavailable' },
  };
}
