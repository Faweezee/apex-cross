import type { DagTask, RemittancePlan, UniversityInvoice } from '@/types';
import { mockCorridorRoutes } from './fx';
import type { AgentChatResponse, MockErrorResponse } from './types';

export const MOCK_USER_ID = 'demo-user-001';
export const MOCK_PLAN_ID = 'plan-7f3a9c21';

export function mockHkustInvoiceData(): UniversityInvoice {
  return {
    institution_name: 'Hong Kong University of Science and Technology',
    beneficiary_account: '012-345-6789012',
    swift_code: 'HSBCHKHHHKH',
    amount_due: 85000.0,
    currency: 'HKD',
    due_date: '2026-12-15',
    student_id: 'HKUST-2026-04821',
    confidence_score: 0.96,
  };
}

function dagTasks(overrides: Partial<Record<number, Partial<DagTask>>> = {}): DagTask[] {
  const base: DagTask[] = [
    {
      task_id: 'task-1',
      title: 'Parse Invoice',
      description: 'Extract beneficiary, amount and SWIFT code from the tuition invoice.',
      status: 'COMPLETED',
      required_tier: 'TIER_1_AUTONOMOUS',
      tool_name: 'invoice_parser',
      output: { institution_name: 'Hong Kong University of Science and Technology' },
    },
    {
      task_id: 'task-2',
      title: 'Check Annual Quota',
      description: 'Verify the remittance fits within the remaining annual FX quota.',
      status: 'COMPLETED',
      required_tier: 'TIER_1_AUTONOMOUS',
      tool_name: 'quota_tool',
      output: { decision: 'ALLOW', remaining_annual_quota_usd: 41500.0 },
    },
    {
      task_id: 'task-3',
      title: 'Compare Corridors',
      description: 'Rank three remittance rails by fee, speed and savings.',
      status: 'COMPLETED',
      required_tier: 'TIER_1_AUTONOMOUS',
      tool_name: 'fx_calculator',
      output: { recommended: 'APEC Direct Clearing' },
    },
    {
      task_id: 'task-4',
      title: 'Execute Wire Transfer',
      description: 'Authenticate with passkey and submit the SWIFT wire.',
      status: 'PENDING',
      required_tier: 'TIER_3_BIOMETRIC',
      tool_name: 'swift_wire',
    },
  ];
  return base.map((t, i) => ({ ...t, ...(overrides[i + 1] ?? {}) }));
}

function basePlan(overrides: Partial<RemittancePlan> = {}): RemittancePlan {
  const routes = mockCorridorRoutes();
  return {
    plan_id: MOCK_PLAN_ID,
    user_id: MOCK_USER_ID,
    invoice: mockHkustInvoiceData(),
    selected_route: routes[1],
    remaining_annual_quota_usd: 41500.0,
    required_security_tier: 'TIER_3_BIOMETRIC',
    dag_tasks: dagTasks(),
    is_executed: false,
    ...overrides,
  };
}

/** Full DAG plan: 3 corridors, TIER_3_BIOMETRIC required, quota ALLOW. */
export function mockPlanReadyResponse(): AgentChatResponse {
  return {
    status: 'PLAN_READY',
    assistant_message:
      'I found three corridors for your HKUST tuition payment. APEC Direct Clearing is cheapest and fastest. A passkey is required to authorize the wire.',
    requires_clarification: false,
    missing_fields: [],
    required_security_tier: 'TIER_3_BIOMETRIC',
    routes: mockCorridorRoutes(),
    plan: basePlan(),
  };
}

export function mockClarificationResponse(): AgentChatResponse {
  return {
    status: 'NEEDS_CLARIFICATION',
    assistant_message:
      'I need a few more details before I can plan this payment: the amount and the destination university.',
    requires_clarification: true,
    missing_fields: ['amount', 'destination_institution'],
    required_security_tier: null,
    routes: [],
    plan: null,
  };
}

/** DAG plan where Step 2 (quota check) is BLOCKED. */
export function mockQuotaExceededResponse(): AgentChatResponse {
  const tasks = dagTasks({
    2: {
      status: 'BLOCKED',
      description: 'Remittance exceeds the remaining annual FX quota.',
      output: { decision: 'BLOCK', remaining_annual_quota_usd: 1200.0 },
    },
    3: { status: 'PENDING', output: undefined },
    4: { status: 'PENDING' },
  });
  return {
    status: 'QUOTA_EXCEEDED',
    assistant_message:
      'This payment would exceed your remaining annual FX quota of $1,200.00. The plan has been blocked.',
    requires_clarification: false,
    missing_fields: [],
    required_security_tier: 'TIER_3_BIOMETRIC',
    routes: mockCorridorRoutes(),
    plan: basePlan({ remaining_annual_quota_usd: 1200.0, dag_tasks: tasks }),
  };
}

/** Plan with quota WARNING: less than $5,000 remaining after the transfer. */
export function mockQuotaWarningResponse(): AgentChatResponse {
  const tasks = dagTasks({
    2: {
      description: 'Quota check passed with a warning: under $5,000 remaining.',
      output: { decision: 'WARNING', remaining_annual_quota_usd: 4200.0 },
    },
  });
  return {
    status: 'PLAN_READY',
    assistant_message:
      'Plan ready, but note that only $4,200.00 of your annual quota will remain after this payment.',
    requires_clarification: false,
    missing_fields: [],
    required_security_tier: 'TIER_3_BIOMETRIC',
    routes: mockCorridorRoutes(),
    plan: basePlan({ remaining_annual_quota_usd: 4200.0, dag_tasks: tasks }),
  };
}

/** HTTP 403 from the prompt-injection firewall. */
export function mockFirewallBlockedResponse(): MockErrorResponse {
  return {
    status: 403,
    body: {
      detail:
        'SecurityException: Prompt blocked by firewall. Detected instruction override attempt.',
    },
  };
}
