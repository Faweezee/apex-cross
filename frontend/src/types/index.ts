export type SecurityTier = 'TIER_1_AUTONOMOUS' | 'TIER_2_CONFIRMATION' | 'TIER_3_BIOMETRIC';

export type Currency = 'USD' | 'CNY' | 'HKD' | 'AUD' | 'SGD';

export interface RemittanceRoute {
  rail_name: string;
  exchange_rate: number;
  source_currency: Currency;
  source_amount: number;
  target_currency: Currency;
  target_amount: number;
  total_fee_usd: number;
  estimated_arrival_hours: number;
  is_recommended: boolean;
  savings_vs_standard_usd: number;
}

export interface UniversityInvoice {
  institution_name: string;
  beneficiary_account: string;
  swift_code: string;
  amount_due: number;
  currency: Currency;
  due_date: string;
  student_id?: string;
  confidence_score: number;
}

export interface DagTask {
  task_id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'BLOCKED' | 'FAILED';
  required_tier: SecurityTier;
  tool_name: string;
  output?: Record<string, any>;
}

export interface RemittancePlan {
  plan_id: string;
  user_id: string;
  invoice?: UniversityInvoice;
  selected_route: RemittanceRoute;
  remaining_annual_quota_usd: number;
  required_security_tier: SecurityTier;
  dag_tasks: DagTask[];
  is_executed: boolean;
}

export interface AuditRecord {
  record_id: string;
  timestamp: string;
  user_id: string;
  action_type: string;
  security_tier: SecurityTier;
  plan_id: string;
  payload_hash: string;
  previous_hash: string;
  signature_verified: boolean;
  status: string;
}
