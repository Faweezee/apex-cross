'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Paperclip, PaperPlaneRight, ShieldCheck, User } from '@/components/icons';
import type { ChatMessage, SuggestionChip } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { MessageSkeleton } from './ui/Skeleton';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  loading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onAttach: () => void;
  suggestions: SuggestionChip[];
  onSuggestion: (prompt: string) => void;
  /** Renders rich panels (DAG, corridors, clarification) beneath an agent bubble. */
  renderExtras?: (message: ChatMessage) => ReactNode;
  disabled?: boolean;
}

/** Right-aligned user turn. */
function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end" data-testid="message-user">
      <div className="flex max-w-[80%] items-start gap-2">
        <div
          className="rounded-lg rounded-tr-sm px-4 py-2.5 text-small text-text-primary"
          style={{
            background: 'rgba(2, 132, 199, 0.14)',
            border: '1px solid rgba(2, 132, 199, 0.28)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {message.text}
        </div>
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: 'rgba(2, 132, 199, 0.16)' }}
        >
          <User size={14} weight="fill" className="text-cobalt" />
        </span>
      </div>
    </div>
  );
}

/** Left-aligned agent turn with tier badge and optional rich panels. */
function AgentBubble({ message, extras }: { message: ChatMessage; extras?: ReactNode }) {
  const tier =
    message.turn?.plan?.required_security_tier ?? message.turn?.response.required_security_tier;
  const tone =
    tier === 'TIER_3_BIOMETRIC' ? 'danger' : tier === 'TIER_2_CONFIRMATION' ? 'cobalt' : 'neutral';
  const tierText =
    tier === 'TIER_3_BIOMETRIC' ? 'TIER 3' : tier === 'TIER_2_CONFIRMATION' ? 'TIER 2' : 'TIER 1';

  return (
    <div className="flex justify-start" data-testid="message-agent">
      <div className="flex w-full max-w-chat items-start gap-2">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: 'rgba(2, 245, 161, 0.12)' }}
        >
          <ShieldCheck size={14} weight="fill" className="text-mint" />
        </span>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="glass-card card-sheen rounded-tl-sm px-4 py-2.5">
            <p className="text-small text-text-primary">{message.text}</p>
            {tier ? (
              <div className="mt-2">
                <Badge tone={tone}>{tierText}</Badge>
              </div>
            ) : null}
          </div>
          {extras}
        </div>
      </div>
    </div>
  );
}


/**
 * Conversational canvas — DESIGN_SYSTEM.md §7 / §13.
 * Streaming-style transcript with suggestion chips, invoice attach, and inline panels.
 */
export function ChatInterface({
  messages,
  loading,
  input,
  onInputChange,
  onSubmit,
  onAttach,
  suggestions,
  onSuggestion,
  renderExtras,
  disabled = false,
}: ChatInterfaceProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, loading]);

  const empty = messages.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-chat flex-col gap-6">
      <div className="flex flex-col gap-5" data-testid="chat-transcript">
        {empty ? (
          <div
            className="flex flex-col items-center gap-4 pt-2 text-center"
            data-testid="welcome-state"
          >
            <h1 className="font-display text-display capitalize leading-[1.1] text-text-primary">
              Cross-Border Tuition, Cleared.
            </h1>
            <p className="max-w-[56ch] text-body text-text-secondary">
              Describe a payment or upload a tuition invoice. ApexCross validates your SAFE annual
              quota, optimizes the APEC FX corridor, and settles the wire under biometric guardrails.
            </p>
          </div>
        ) : null}

        {messages.map((message) =>
          message.role === 'user' ? (
            <UserBubble key={message.id} message={message} />
          ) : (
            <AgentBubble key={message.id} message={message} extras={renderExtras?.(message)} />
          ),
        )}

        {loading ? (
          <div className="flex justify-start">
            <div className="flex w-full max-w-chat items-start gap-2">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                style={{ background: 'rgba(2, 245, 161, 0.12)' }}
              >
                <ShieldCheck size={14} weight="fill" className="text-mint" />
              </span>
              <MessageSkeleton />
            </div>
          </div>
        ) : null}

        <div ref={endRef} />
      </div>

      {empty && suggestions.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-2" data-testid="suggestion-chips">
          {suggestions.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => onSuggestion(chip.prompt)}
              data-testid={`suggestion-${chip.label.replace(/\s+/g, '-').toLowerCase()}`}
              className="glass-inline lift px-3 py-2 text-small text-text-secondary hover:text-text-primary"
            >
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="composer glass-card card-sheen flex items-end gap-2 p-2"
      >
        <button
          type="button"
          onClick={onAttach}
          aria-label="Attach tuition invoice"
          data-testid="chat-attach"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors duration-200 hover:text-mint"
        >
          <Paperclip size={17} weight="regular" aria-hidden="true" />
        </button>

        <textarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          rows={1}
          placeholder="Describe a payment, ask for an FX rate, or upload an invoice..."
          aria-label="Message ApexCross"
          data-testid="chat-input"
          disabled={disabled}
          className={cn(
            'focus-plain max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-small text-text-primary',
            'placeholder:text-text-muted',
          )}
        />

        <Button
          type="submit"
          disabled={disabled || !input.trim()}
          icon={<PaperPlaneRight size={16} weight="fill" aria-hidden="true" />}
          data-testid="chat-send"
          className="shrink-0"
        >
          Send
        </Button>
      </form>
    </div>
  );
}

export default ChatInterface;
