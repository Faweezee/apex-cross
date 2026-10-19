import type { RemittancePlan, RemittanceRoute, UniversityInvoice } from '@/types';
import type { AgentChatResponse, FxRatesResponse } from '@/lib/api';
import type { QuotaDecision } from '@/components/QuotaBar';

export type ChatRole = 'user' | 'agent';

/** Rich payload attached to an agent turn so panels render inline in the transcript. */
export interface AgentTurn {
  response: AgentChatResponse;
  plan: RemittancePlan | null;
  routes: RemittanceRoute[];
  quotaRemaining: number | null;
  quotaDecision: QuotaDecision | null;
  fxRates: FxRatesResponse | null;
  invoice: UniversityInvoice | null;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: string;
  /** Present when the pre-agent firewall blocked this turn (HTTP 403). */
  securityBlockReason?: string;
  /** Present when the agent compiled or attempted a plan. */
  turn?: AgentTurn;
}

export interface SuggestionChip {
  label: string;
  prompt: string;
}
