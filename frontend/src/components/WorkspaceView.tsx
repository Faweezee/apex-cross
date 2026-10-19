'use client';

import { useCallback, useState } from 'react';
import {
  ApiError,
  getFxRates,
  postAgentChat,
  postMicroConvert,
  type InvoiceUploadResponse,
  type MicroConvertResponse,
  type SwiftWireReceipt,
} from '@/lib/api';
import type { Currency, RemittancePlan, RemittanceRoute, UniversityInvoice } from '@/types';
import type { ChatMessage, SuggestionChip } from '@/types/chat';
import { ChatInterface } from './ChatInterface';
import { ClarificationCard } from './ClarificationCard';
import { CorridorCards } from './CorridorCards';
import { DagViewer } from './DagViewer';
import { InvoiceDropzone } from './InvoiceDropzone';
import { InvoiceModal } from './InvoiceModal';
import { PasskeyModal, type WireAuthorizationTarget } from './PasskeyModal';
import { QuotaBar, type QuotaDecision } from './QuotaBar';
import { SecurityAlert } from './SecurityAlert';
import { SwiftReceipt } from './SwiftReceipt';
import { Tier2ConvertModal } from './Tier2ConvertModal';

const SUGGESTIONS: SuggestionChip[] = [
  { label: 'Wire 85,000 HKD to HKUST', prompt: 'Wire 85,000 HKD tuition to HKUST for student 20991234' },
  { label: 'Pay University of Melbourne', prompt: 'Pay 18,500 AUD tuition to University of Melbourne' },
  { label: 'NUS tuition in SGD', prompt: 'Send 16,200 SGD tuition to National University of Singapore' },
  { label: 'CNY to HKD rate', prompt: 'What is the CNY to HKD exchange rate today?' },
];

/** Detect a Tier 1 read-only FX rate inquiry (no transfer verb present). */
function isRateQuery(text: string): boolean {
  const lower = text.toLowerCase();
  const hasTransferVerb = /\b(wire|transfer|send|pay|remit|convert)\b/.test(lower);
  const hasRateWord = /\b(rate|rates|fx|exchange|spread)\b/.test(lower);
  const hasCurrency = /\b(usd|cny|hkd|aud|sgd)\b/.test(lower);
  return !hasTransferVerb && hasRateWord && hasCurrency;
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

interface Tier2State {
  open: boolean;
  sourceCurrency: Currency;
  targetCurrency: Currency;
  sourceAmount: number;
  quotedRate: number;
  midMarketRate: number;
  result: MicroConvertResponse | null;
  error: string | null;
  executing: boolean;
}

interface Tier3State {
  open: boolean;
  target: WireAuthorizationTarget | null;
}

/**
 * Workspace orchestrator — the single conversational canvas.
 * Owns the transcript, the 4-step DAG, corridor comparison, quota telemetry, and the
 * one-modal-at-a-time execution flows (invoice -> plan -> Tier 2 / Tier 3 -> receipt).
 */
export function WorkspaceView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);
  const [showDropzone, setShowDropzone] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState<InvoiceUploadResponse | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
  const [selectedRail, setSelectedRail] = useState<string | null>(null);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [quotaDecision, setQuotaDecision] = useState<QuotaDecision | null>(null);
  const [tier2, setTier2] = useState<Tier2State | null>(null);
  const [tier3, setTier3] = useState<Tier3State>({ open: false, target: null });
  const [receipt, setReceipt] = useState<SwiftWireReceipt | null>(null);

  const pushAgentMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const applyQuotaFromPlan = useCallback((plan: RemittancePlan | null, status: string) => {
    if (!plan) return;
    setQuotaRemaining(plan.remaining_annual_quota_usd);
    setQuotaDecision(
      status === 'QUOTA_EXCEEDED'
        ? 'REJECT'
        : plan.remaining_annual_quota_usd < 5000
          ? 'WARNING'
          : 'ALLOW',
    );
  }, []);

  const submitText = useCallback(
    async (raw: string, invoice: UniversityInvoice | null = null) => {
      const text = raw.trim();
      if (!text && !invoice) return;

      setSecurityAlert(null);
      setShowDropzone(false);

      if (text) {
        setMessages((prev) => [
          ...prev,
          { id: makeId('u'), role: 'user', text, timestamp: nowIso() },
        ]);
      }

      setLoading(true);
      try {
        /* Tier 1 read-only FX inquiry — bypass the planner, render rates directly. */
        if (!invoice && isRateQuery(text)) {
          const fx = await getFxRates({
            source_currency: 'CNY',
            target_currency: 'HKD',
            target_amount: 85000,
          });
          pushAgentMessage({
            id: makeId('a'),
            role: 'agent',
            text: `Mid-market rate: 1 ${fx.source_currency} = ${fx.mid_market_rate.toFixed(4)} ${fx.target_currency}. Three clearing corridors are available.`,
            timestamp: nowIso(),
            turn: {
              response: {
                status: 'TIER_1_RESULT',
                assistant_message: '',
                requires_clarification: false,
                missing_fields: [],
                required_security_tier: fx.security_tier,
                routes: fx.routes,
                plan: null,
              },
              plan: null,
              routes: fx.routes,
              quotaRemaining: null,
              quotaDecision: null,
              fxRates: fx,
              invoice: null,
            },
          });
          return;
        }

        const response = await postAgentChat({
          message: text || 'Compile a remittance plan from this invoice.',
          source_currency: 'CNY',
          invoice,
        });

        applyQuotaFromPlan(response.plan, response.status);
        if (response.plan?.selected_route) {
          setSelectedRail(response.plan.selected_route.rail_name);
        }

        pushAgentMessage({
          id: makeId('a'),
          role: 'agent',
          text: response.assistant_message || 'Plan updated.',
          timestamp: nowIso(),
          turn: {
            response,
            plan: response.plan,
            routes: response.routes,
            quotaRemaining: response.plan?.remaining_annual_quota_usd ?? null,
            quotaDecision: null,
            fxRates: null,
            invoice: response.plan?.invoice ?? invoice,
          },
        });
      } catch (error) {
        if (error instanceof ApiError && error.isSecurityBlock) {
          setSecurityAlert(error.reason);
          pushAgentMessage({
            id: makeId('a'),
            role: 'agent',
            text: 'Request blocked by the pre-agent security firewall.',
            timestamp: nowIso(),
            securityBlockReason: error.reason,
          });
        } else {
          const reason =
            error instanceof ApiError ? error.reason : 'The agent could not complete this request.';
          pushAgentMessage({
            id: makeId('a'),
            role: 'agent',
            text: reason,
            timestamp: nowIso(),
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [applyQuotaFromPlan, pushAgentMessage],
  );


  /* ---- Invoice OCR flow ---- */
  function handleInvoiceExtracted(result: InvoiceUploadResponse) {
    setInvoiceResult(result);
    setShowDropzone(false);
    setInvoiceOpen(true);
  }

  function handleInvoiceError(message: string) {
    setShowDropzone(false);
    pushAgentMessage({
      id: makeId('a'),
      role: 'agent',
      text: message,
      timestamp: nowIso(),
    });
  }

  async function confirmInvoice(invoice: UniversityInvoice) {
    setInvoiceSubmitting(true);
    try {
      setInvoiceOpen(false);
      await submitText('Compile a remittance plan from this invoice.', invoice);
    } finally {
      setInvoiceSubmitting(false);
      setInvoiceResult(null);
    }
  }

  /* ---- Execution routing (Tier 2 vs Tier 3) ---- */
  const latestPlan = [...messages].reverse().find((m) => m.turn?.plan)?.turn?.plan ?? null;
  const latestRoutes =
    [...messages].reverse().find((m) => m.turn?.routes?.length)?.turn?.routes ?? [];

  function executeLatestPlan() {
    if (!latestPlan) return;
    const tier = latestPlan.required_security_tier;
    const route: RemittanceRoute =
      latestRoutes.find((r) => r.rail_name === selectedRail) ?? latestPlan.selected_route;
    const invoice = latestPlan.invoice;

    if (tier === 'TIER_2_CONFIRMATION') {
      setTier2({
        open: true,
        sourceCurrency: route.source_currency,
        targetCurrency: route.target_currency,
        sourceAmount: route.source_amount,
        quotedRate: route.exchange_rate,
        midMarketRate: route.exchange_rate,
        result: null,
        error: null,
        executing: false,
      });
      return;
    }

    setTier3({
      open: true,
      target: {
        planId: latestPlan.plan_id,
        beneficiaryName: invoice?.institution_name ?? 'Beneficiary',
        beneficiaryAccount: invoice?.beneficiary_account ?? '004-123-456789-001',
        swiftCode: invoice?.swift_code ?? 'HSBCHKHHHKH',
        amount: invoice?.amount_due ?? route.target_amount,
        currency: invoice?.currency ?? route.target_currency,
        studentId: invoice?.student_id ?? '20991234',
      },
    });
  }

  async function confirmTier2() {
    if (!tier2) return;
    setTier2((prev) => (prev ? { ...prev, executing: true, error: null } : prev));
    try {
      const result = await postMicroConvert({
        source_currency: tier2.sourceCurrency,
        target_currency: tier2.targetCurrency,
        source_amount: tier2.sourceAmount,
        quoted_rate: tier2.quotedRate,
        max_slippage_bps: 50,
        user_confirmed: true,
      });
      setTier2((prev) => (prev ? { ...prev, executing: false, result } : prev));
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.reason
          : 'Micro-conversion failed. No balances were changed.';
      setTier2((prev) => (prev ? { ...prev, executing: false, error: message } : prev));
    }
  }

  function handleWireSettled(wireReceipt: SwiftWireReceipt) {
    setTier3({ open: false, target: null });
    setReceipt(wireReceipt);
    pushAgentMessage({
      id: makeId('a'),
      role: 'agent',
      text: `Wire settled. Reference ${wireReceipt.reference_id}. The event is sealed in the audit ledger.`,
      timestamp: nowIso(),
    });
  }


  /* ---- Inline rich panels for agent turns ---- */
  function renderExtras(message: ChatMessage) {
    if (!message.turn) return null;
    const { turn } = message;

    if (turn.fxRates) {
      return (
        <div className="space-y-3" data-testid="fx-rates-panel">
          <div className="glass-card card-sheen p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-caption uppercase tracking-[0.05em] text-text-secondary">
                Mid-market
              </span>
              <span className="font-mono text-mono text-text-primary">
                1 {turn.fxRates.source_currency} = {turn.fxRates.mid_market_rate.toFixed(4)}{' '}
                {turn.fxRates.target_currency}
              </span>
            </div>
            <div className="rule-hairline my-3" />
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {Object.entries(turn.fxRates.all_usd_rates).map(([code, rate]) => (
                <li key={code} className="glass-inline p-2 text-center">
                  <p className="text-caption uppercase tracking-[0.05em] text-text-secondary">
                    USD/{code}
                  </p>
                  <p className="font-mono text-mono-sm text-text-primary">{rate.toFixed(4)}</p>
                </li>
              ))}
            </ul>
          </div>
          <CorridorCards routes={turn.routes} interactive={false} />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {message.securityBlockReason ? (
          <SecurityAlert
            reason={message.securityBlockReason}
            onDismiss={() => setSecurityAlert(null)}
          />
        ) : null}

        {turn.response.requires_clarification ? (
          <ClarificationCard
            message={turn.response.assistant_message}
            missingFields={turn.response.missing_fields}
            onAttachInvoice={() => setShowDropzone(true)}
          />
        ) : null}

        {turn.plan ? (
          <DagViewer
            tasks={turn.plan.dag_tasks}
            requiredTier={turn.plan.required_security_tier}
            onExecute={executeLatestPlan}
            executeLabel={
              turn.plan.required_security_tier === 'TIER_3_BIOMETRIC'
                ? 'Authorize with passkey'
                : 'Confirm conversion'
            }
            executeDisabledReason={
              turn.plan.dag_tasks.some((t) => t.status === 'BLOCKED')
                ? 'Resolve the blocked step before executing.'
                : undefined
            }
          />
        ) : null}

        {turn.plan && turn.routes.length > 0 ? (
          <CorridorCards
            routes={turn.routes}
            selectedRail={selectedRail}
            onSelect={(route) => setSelectedRail(route.rail_name)}
          />
        ) : null}
      </div>
    );
  }


  return (
    <div className="mx-auto w-full max-w-content px-6 pb-40">
      {/* Quota telemetry */}
      <div className="mx-auto mb-8 max-w-chat" data-testid="quota-telemetry">
        <QuotaBar remainingUsd={quotaRemaining ?? 50000} decision={quotaDecision ?? 'ALLOW'} />
      </div>

      {/* Top-level security alert */}
      {securityAlert ? (
        <div className="mx-auto mb-6 flex max-w-chat justify-center">
          <SecurityAlert reason={securityAlert} onDismiss={() => setSecurityAlert(null)} />
        </div>
      ) : null}

      {/* Invoice dropzone */}
      {showDropzone ? (
        <div className="mb-6 flex justify-center">
          <InvoiceDropzone
            onExtracted={handleInvoiceExtracted}
            onError={handleInvoiceError}
            onCancel={() => setShowDropzone(false)}
          />
        </div>
      ) : null}

      {/* Transcript + composer */}
      <ChatInterface
        messages={messages}
        loading={loading}
        input={input}
        onInputChange={setInput}
        onSubmit={() => {
          const text = input;
          setInput('');
          void submitText(text);
        }}
        onAttach={() => setShowDropzone((prev) => !prev)}
        suggestions={SUGGESTIONS}
        onSuggestion={(prompt) => void submitText(prompt)}
        renderExtras={renderExtras}
      />

      {/* ---- Modals (exactly one at a time) ---- */}
      <InvoiceModal
        open={invoiceOpen}
        result={invoiceResult}
        onClose={() => {
          setInvoiceOpen(false);
          setInvoiceResult(null);
        }}
        onConfirm={confirmInvoice}
        submitting={invoiceSubmitting}
      />

      <Tier2ConvertModal
        open={Boolean(tier2?.open)}
        sourceCurrency={tier2?.sourceCurrency ?? 'USD'}
        targetCurrency={tier2?.targetCurrency ?? 'CNY'}
        sourceAmount={tier2?.sourceAmount ?? 0}
        quotedRate={tier2?.quotedRate ?? 1}
        midMarketRate={tier2?.midMarketRate}
        onClose={() => setTier2(null)}
        onConfirm={confirmTier2}
        executing={tier2?.executing}
        result={tier2?.result ?? null}
        errorMessage={tier2?.error ?? null}
      />

      <PasskeyModal
        open={tier3.open}
        target={tier3.target}
        onClose={() => setTier3({ open: false, target: null })}
        onSuccess={handleWireSettled}
      />

      <SwiftReceipt
        open={Boolean(receipt)}
        receipt={receipt}
        onClose={() => setReceipt(null)}
      />
    </div>
  );
}

export default WorkspaceView;
