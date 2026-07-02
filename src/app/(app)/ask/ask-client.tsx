"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Loader2, Send, FileText, AlertTriangle, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { StatusBadge } from "@/components/ui";

type Source = { documentId: string; title: string; snippet: string };
type Exchange = {
  question: string;
  answerId?: string;
  answer?: string;
  confidence?: string;
  insufficient?: boolean;
  sources?: Source[];
  error?: string;
  feedback?: "UP" | "DOWN";
  learned?: boolean;
};

const SUGGESTIONS = [
  "Which past projects prove we can deliver a school management system?",
  "What certificates do we hold and when do they expire?",
  "Who should we propose as project manager for a health-sector bid?",
  "What evidence supports our experience with government data platforms?",
];

export function AskClient({ recentQuestions }: { recentQuestions: string[] }) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [thread, setThread] = useState<Exchange[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function ask(q: string) {
    if (!q.trim() || busy) return;
    setBusy(true);
    setQuestion("");
    setThread((t) => [...t, { question: q }]);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setThread((t) => {
        const copy = [...t];
        copy[copy.length - 1] = res.ok ? { question: q, ...data } : { question: q, error: data.error ?? "Something went wrong" };
        return copy;
      });
    } catch {
      setThread((t) => {
        const copy = [...t];
        copy[copy.length - 1] = { question: q, error: "Network error — please try again." };
        return copy;
      });
    }
    setBusy(false);
  }

  async function copyAnswer(idx: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch { /* clipboard unavailable */ }
  }

  async function sendFeedback(idx: number, rating: "UP" | "DOWN") {
    const x = thread[idx];
    if (!x.answerId || x.feedback) return;
    setThread((t) => t.map((e, i) => (i === idx ? { ...e, feedback: rating } : e)));
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "ANSWER", targetId: x.answerId, rating }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.learned) setThread((t) => t.map((e, i) => (i === idx ? { ...e, learned: true } : e)));
    } catch { /* non-blocking */ }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {thread.length === 0 && (
        <div className="mb-6 grid gap-2 sm:grid-cols-2">
          {(recentQuestions.length ? recentQuestions.slice(0, 4) : SUGGESTIONS).map((s, i) => (
            <button
              key={i}
              onClick={() => ask(s)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-[13px] text-slate-600 shadow-card transition hover:border-brand-300 hover:text-slate-900"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-5">
        {thread.map((x, i) => (
          <div key={i}>
            <div className="mb-2 flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5 text-sm text-white">{x.question}</div>
            </div>
            <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-5 py-4 shadow-card">
              {!x.answer && !x.error && (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={14} className="animate-spin" /> Searching your knowledge base…
                </p>
              )}
              {x.error && <p className="text-sm text-red-600">{x.error}</p>}
              {x.answer && (
                <>
                  {x.insufficient && (
                    <p className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                      <AlertTriangle size={13} /> Not enough evidence in your documents — AtlasVault will not invent an answer.
                    </p>
                  )}
                  <div className="md-body text-sm">
                    <ReactMarkdown>{x.answer}</ReactMarkdown>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      {x.confidence && <StatusBadge status={x.confidence} prefix="Confidence:" />}
                      <span className="text-[11px] text-slate-400">{x.sources?.length ?? 0} cited source{(x.sources?.length ?? 0) === 1 ? "" : "s"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyAnswer(i, x.answer!)}
                        title="Copy answer"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                      >
                        {copiedIdx === i ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                      {!x.insufficient && (
                        <>
                          <button
                            onClick={() => sendFeedback(i, "UP")}
                            title="Good answer — save to workspace memory"
                            disabled={!!x.feedback}
                            className={`rounded-md p-1.5 ${x.feedback === "UP" ? "text-emerald-600" : "text-slate-400 hover:bg-slate-50 hover:text-emerald-600"}`}
                          >
                            <ThumbsUp size={14} />
                          </button>
                          <button
                            onClick={() => sendFeedback(i, "DOWN")}
                            title="Flag for improvement"
                            disabled={!!x.feedback}
                            className={`rounded-md p-1.5 ${x.feedback === "DOWN" ? "text-red-500" : "text-slate-400 hover:bg-slate-50 hover:text-red-500"}`}
                          >
                            <ThumbsDown size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {x.learned && (
                    <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      Saved to workspace memory — future answers can reuse this verified knowledge.
                    </p>
                  )}
                  {x.sources && x.sources.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {x.sources.map((s, j) => (
                        <Link key={j} href={`/documents/${s.documentId}`} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 hover:bg-slate-100">
                          <FileText size={13} className="mt-0.5 shrink-0 text-slate-400" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-slate-700">{s.title}</p>
                            <p className="line-clamp-1 text-[11px] text-slate-400">“{s.snippet}”</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); ask(question); }}
        className="sticky bottom-6 mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your projects, staff, certificates, past proposals…"
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={busy || !question.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </form>
    </div>
  );
}
