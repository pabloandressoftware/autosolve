import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { ServiceIcon } from '../components/ServiceIcon';
import { ErrorState, Spinner } from '../components/feedback';
import { api } from '../lib/api';
import { URGENCY_LABEL, URGENCY_TONE, formatCop, formatDuration } from '../lib/format';
import type { ChatMessage, ChatReply, ChatSession, Service, SymptomChip, Urgency } from '../types';

interface Recommendation {
  service: Service;
  urgency: Urgency;
}

export function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<SymptomChip[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    api<ChatSession>('/chat/sessions', { method: 'POST', body: {} })
      .then((session) => {
        if (!active) return;
        setSessionId(session.id);
        setMessages(session.messages);
        setSuggestions(session.suggestions);
      })
      .catch((cause: Error) => active && setError(cause.message))
      .finally(() => active && setStarting(false));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, recommendation]);

  async function send(content: string) {
    if (!sessionId || !content.trim() || sending) {
      return;
    }

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'USER',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimistic]);
    setDraft('');
    setSending(true);
    setError(null);

    try {
      const result = await api<ChatReply>(`/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: { content: optimistic.content },
      });

      setMessages((current) => [...current, result.reply]);
      setSuggestions(result.suggestions);
      setRecommendation(
        result.recommendation
          ? { service: result.recommendation.service, urgency: result.recommendation.urgency }
          : null,
      );
    } catch (cause) {
      // Quitamos el mensaje optimista: si no llegó al servidor, no debe quedar
      // en pantalla como si el bot lo hubiera recibido.
      setMessages((current) => current.filter((message) => message.id !== optimistic.id));
      setDraft(optimistic.content);
      setError((cause as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (starting) return <Spinner label="Abriendo el chat…" />;
  if (error && !sessionId) return <ErrorState message={error} />;

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <h1 className="text-xl font-bold tracking-tight">Diagnóstico</h1>
      <p className="mt-0.5 text-sm text-ink-muted">
        Cuéntanos qué le pasa a tu carro en tus propias palabras.
      </p>

      <ul className="mt-5 flex-1 space-y-3">
        {messages.map((message) => (
          <li
            key={message.id}
            className={message.role === 'USER' ? 'flex justify-end' : 'flex justify-start'}
          >
            <p
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                message.role === 'USER'
                  ? 'rounded-br-sm bg-brand-500 text-white'
                  : 'rounded-bl-sm border border-hairline bg-white text-ink'
              }`}
            >
              {message.content}
            </p>
          </li>
        ))}

        {sending && (
          <li className="flex justify-start" aria-live="polite">
            <p className="rounded-2xl rounded-bl-sm border border-hairline bg-white px-4 py-2.5 text-sm text-ink-faint">
              Escribiendo…
            </p>
          </li>
        )}
      </ul>

      {recommendation && (
        <article className="card mt-4 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <ServiceIcon name={recommendation.service.icon} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{recommendation.service.name}</p>
              <p className="text-xs text-ink-muted">
                {formatCop(recommendation.service.priceCop)} ·{' '}
                {formatDuration(recommendation.service.durationMin)}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${URGENCY_TONE[recommendation.urgency]}`}
            >
              {URGENCY_LABEL[recommendation.urgency]}
            </span>
          </div>

          <Link
            to={`/agendar?servicio=${recommendation.service.slug}`}
            className="btn-primary mt-4 w-full"
          >
            Agendar {recommendation.service.name}
          </Link>
        </article>
      )}

      {suggestions.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((symptom) => (
            <li key={symptom.slug}>
              <button type="button" className="chip" onClick={() => send(symptom.label)}>
                {symptom.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && sessionId && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <form
        className="sticky bottom-24 mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft);
        }}
      >
        <label className="sr-only" htmlFor="chat-input">
          Escribe tu mensaje
        </label>
        <input
          id="chat-input"
          className="field"
          placeholder="Ej. suena un chirrido al frenar"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button
          type="submit"
          className="btn-primary shrink-0 px-4"
          disabled={sending || !draft.trim()}
          aria-label="Enviar mensaje"
        >
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </form>

      <div ref={endRef} />
    </div>
  );
}
