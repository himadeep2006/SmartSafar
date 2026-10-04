import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaCompass, FaPaperPlane, FaRobot } from "react-icons/fa";
import Button from "../components/Button";
import Card from "../components/Card";
import PageContainer from "../components/PageContainer";
import { getAssistantStatus, sendAssistantMessage } from "../services/assistantService";

const QUICK_PROMPTS = [
  "Plan a 3-day trip to Goa",
  "Find places to visit in Kerala",
  "Improve my itinerary",
  "What should I pack for a monsoon trip?",
  "Give me travel safety tips",
];

function ActionLink({ action, context }) {
  const destination = [...(context?.destinations || []), ...(context?.saved_destinations || [])]
    .find((item) => item.id === action.destination_id);
  if (action.type === "destination" && destination) {
    return <Link className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-300/25 bg-sky-400/10 px-3 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-200/50 hover:bg-sky-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300" to={`/destinations/${destination.id}`}><FaCompass aria-hidden="true" />Explore {destination.name}<FaArrowRight aria-hidden="true" /></Link>;
  }
  if (action.type === "trip_plan" && destination) {
    const days = Math.min(14, Math.max(1, Number(action.days) || 3));
    return <Link className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-200/50 hover:bg-amber-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300" to={`/planner?destination=${encodeURIComponent(destination.id)}&days=${days}`}>Open {days}-day {destination.name} planner<FaArrowRight aria-hidden="true" /></Link>;
  }
  if (action.type === "trip" && context?.trip?.id === action.trip_id) {
    return <Link className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-100" to={`/trips/${action.trip_id}`}>Open your trip<FaArrowRight aria-hidden="true" /></Link>;
  }
  return null;
}

export default function Assistant() {
  const [status, setStatus] = useState("checking");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastRequest, setLastRequest] = useState(null);
  const textareaRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let active = true;
    getAssistantStatus()
      .then((result) => { if (active) setStatus(result.available ? "available" : "unconfigured"); })
      .catch(() => { if (active) setStatus("unknown"); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const request = async ({ message, history, appendUser }) => {
    if (loading || !message.trim()) return;
    setLoading(true);
    setError("");
    if (appendUser) setMessages((current) => [...current, { role: "user", content: message.trim() }]);
    setLastRequest({ message: message.trim(), history });
    try {
      const result = await sendAssistantMessage(message.trim(), history);
      setMessages((current) => [...current, { role: "assistant", content: result.message, suggestions: result.suggestions || [], context: result.context }]);
      setDraft("");
      setLastRequest(null);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "SmartSafar could not reach the travel assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const send = () => {
    const message = draft.trim();
    if (!message || loading) return;
    const history = messages.slice(-8).map(({ role, content }) => ({ role, content }));
    request({ message, history, appendUser: true });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <PageContainer
      title="AI Travel Companion"
      badge="PLAN SMARTER · EXPLORE MORE"
      subtitle="Get thoughtful India travel ideas grounded in SmartSafar’s destinations and your own saved trip context."
      maxWidth="max-w-5xl"
    >
      <Card variant="darkGlass" hoverable={false} className="overflow-hidden border-white/10 bg-slate-950/60 p-0 shadow-2xl shadow-blue-950/30">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-sky-500/10 via-transparent to-amber-400/5 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-sky-300/25 bg-sky-400/10 text-xl text-sky-200"><FaRobot aria-hidden="true" /></span>
            <div><p className="font-bold text-white">SmartSafar travel desk</p><p className="text-xs text-slate-400">Your chat stays in this page and clears when you leave.</p></div>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${status === "available" ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100" : "border-amber-300/25 bg-amber-400/10 text-amber-100"}`} role="status">
            {status === "checking" ? "Checking assistant…" : status === "available" ? "Assistant ready" : "AI provider unavailable"}
          </span>
        </div>

        {status === "unconfigured" && <div className="border-b border-amber-300/15 bg-amber-950/20 px-4 py-3 text-sm text-amber-100 sm:px-6" role="status">The assistant has no provider configured yet. Messages will not receive a generated answer until the backend provider is set up.</div>}
        {status === "unknown" && <div className="border-b border-rose-300/15 bg-rose-950/20 px-4 py-3 text-sm text-rose-100" role="status">Assistant status could not be checked. You can retry by sending a message.</div>}

        <div ref={scrollRef} className="max-h-[min(62vh,680px)] min-h-[360px] space-y-4 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite" aria-label="Conversation">
          {!messages.length && <div className="mx-auto flex min-h-[320px] max-w-2xl flex-col items-center justify-center py-8 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-3xl border border-amber-300/20 bg-amber-300/10 text-2xl text-amber-200"><FaCompass aria-hidden="true" /></span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-amber-200">Your India travel companion</p>
            <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">Where would you like to go?</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-300">Ask for destination ideas, help with one of your saved trips, or practical travel advice. Current weather, prices, opening hours and bookings are not available in chat.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">{QUICK_PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => { setDraft(prompt); textareaRef.current?.focus(); }} className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-left text-xs text-slate-200 transition hover:border-sky-300/40 hover:bg-sky-400/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">{prompt}</button>)}</div>
          </div>}

          {messages.map((item, index) => <div key={`${item.role}-${index}`} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
            <article className={`max-w-[92%] min-w-0 rounded-2xl border px-4 py-3 sm:max-w-[82%] ${item.role === "user" ? "border-sky-300/20 bg-sky-500/15 text-white" : "border-white/10 bg-white/[0.06] text-slate-100"}`} aria-label={item.role === "user" ? "Your message" : "Assistant response"}>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-200">{item.role === "user" ? "You" : "SmartSafar"}</p>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{item.content}</p>
              {item.role === "assistant" && item.suggestions?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{item.suggestions.map((action, actionIndex) => <ActionLink key={`${action.type}-${actionIndex}`} action={action} context={item.context} />)}</div>}
            </article>
          </div>)}
          {loading && <div className="flex justify-start"><p className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-300" role="status"><span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-sky-300" />Thinking through your travel question…</p></div>}
          {error && <div className="rounded-xl border border-rose-300/25 bg-rose-950/30 p-3 text-sm text-rose-100" role="alert"><p>{error}</p>{lastRequest && <Button variant="secondary" size="sm" className="mt-3" disabled={loading} onClick={() => request({ ...lastRequest, appendUser: false })}>Retry</Button>}</div>}
        </div>

        <form className="border-t border-white/10 bg-slate-950/35 p-3 sm:p-5" onSubmit={(event) => { event.preventDefault(); send(); }}>
          <label htmlFor="assistant-message" className="sr-only">Ask SmartSafar about your trip</label>
          <div className="flex items-end gap-2 rounded-2xl border border-white/15 bg-slate-950/70 p-2 transition focus-within:border-sky-300/45 focus-within:ring-2 focus-within:ring-sky-400/15 sm:gap-3 sm:p-3">
            <textarea ref={textareaRef} id="assistant-message" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} maxLength={2000} rows={2} placeholder="Ask about destinations, trips or travel advice…" className="max-h-40 min-h-12 min-w-0 flex-1 resize-y bg-transparent px-2 py-2 text-sm leading-relaxed text-white placeholder:text-slate-500 focus:outline-none" aria-describedby="assistant-input-hint assistant-character-count" />
            <Button type="submit" size="md" loading={loading} disabled={!draft.trim() || status === "checking"} aria-label="Send message" icon={<FaPaperPlane aria-hidden="true" />}>Send</Button>
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 px-1 text-[11px] text-slate-500"><span id="assistant-input-hint">Enter to send · Shift+Enter for a new line · Messages are not saved.</span><span id="assistant-character-count">{draft.length}/2000</span></div>
        </form>
      </Card>
      <p className="px-1 text-xs leading-relaxed text-slate-500">Privacy: SmartSafar does not save this conversation. When an AI provider is configured, your message and recent chat context, plus only relevant saved trip/destination details and preferred language, are sent to that provider to generate a reply. The provider’s own data handling applies.</p>
      <p className="px-1 text-xs leading-relaxed text-slate-500">Travel suggestions can be incomplete. Confirm current conditions with official sources. For emergencies, use the <Link className="text-sky-200 underline decoration-sky-200/40 underline-offset-2 hover:text-white" to="/safety">Safety Center</Link>; SmartSafar does not dispatch emergency services.</p>
    </PageContainer>
  );
}
