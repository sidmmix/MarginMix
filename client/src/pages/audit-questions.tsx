import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, CircleHelp,
  Download, RotateCcw, Save, Send, ShieldCheck, Trash2, X,
} from "lucide-react";
import {
  auditQuestions, auditSections, getAnswerStatus, getApplicableAnswers, getVisibleQuestions,
  validateAuditAnswer,
} from "@shared/audit-questionnaire";
import type { AuditAnswers, AuditQuestion } from "@shared/audit-questionnaire";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const STORAGE_KEY = "marginmix_audit_draft_v1";
const UNKNOWN = "__unknown__";
type DraftStatus = "saved" | "saving" | "unavailable";
type Submission = { id: string; submittedAt: string };

const statusCopy: Record<string, string> = {
  complete: "Complete",
  estimated: "Estimated",
  unknown: "Unknown",
  unanswered: "Unanswered",
};
const statusStyle: Record<string, string> = {
  complete: "bg-[#28796a] text-white",
  estimated: "bg-[#d7a641] text-[#392f1c]",
  unknown: "bg-[#8b9a98] text-white",
  unanswered: "bg-[#ece8de] text-[#787b72]",
};

function isPlainRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return (prototype === Object.prototype || prototype === null) &&
    Object.values(value).every((cell) => typeof cell === "string");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isAuditAnswers(value: unknown): value is AuditAnswers {
  if (!isPlainObject(value)) return false;
  return Object.values(value).every((answer) =>
    typeof answer === "string" ||
    (Array.isArray(answer) && (answer.every((item) => typeof item === "string") ||
      answer.every((row) => isPlainRecord(row))))
  );
}

function safeLabel(question: AuditQuestion, value: AuditAnswers[string] | undefined): string {
  if (value === undefined || value === "" || (Array.isArray(value) && !value.length)) return "Not answered yet";
  if (value === UNKNOWN) return "Not known yet";
  if (Array.isArray(value)) {
    if (question.type === "table") {
      const columns = question.columns ?? [];
      return (value as Record<string, string>[])
        .map((row) => columns.map((column) => {
          const cell = row[column.key];
          return cell ? `${column.label}: ${cell}` : null;
        }).filter(Boolean).join(" · "))
        .filter(Boolean)
        .join(" / ") || "Not answered yet";
    }
    return value.map((item) => question.options?.find((option) => option.value === item)?.label ?? item).join(", ");
  }
  return question.options?.find((option) => option.value === value)?.label ?? value;
}

function downloadAnswers(answers: AuditAnswers, submitted?: Submission) {
  const applicableAnswers = getApplicableAnswers(answers);
  const payload = {
    product: "MarginMix engagement assumptions audit",
    version: 1,
    ...(submitted ? { reference: submitted.id, submittedAt: submitted.submittedAt } : {}),
    answers: applicableAnswers,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `marginmix-audit${submitted ? `-${submitted.id}` : "-answers"}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function newSubmissionId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `mm-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrderedVisibleQuestions(answers: AuditAnswers) {
  const visible = getVisibleQuestions(answers);
  const contactOrder = ["name", "email", "agency"];
  const contactQuestions = contactOrder.flatMap((id) => visible.filter((question) => question.id === id));
  return [...contactQuestions, ...visible.filter((question) => !contactOrder.includes(question.id))];
}

export default function AuditQuestions() {
  const reducedMotion = useReducedMotion();
  const [answers, setAnswers] = useState<AuditAnswers>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [submitted, setSubmitted] = useState<Submission | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [saving, setSaving] = useState<DraftStatus>("saved");
  const [error, setError] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restored, setRestored] = useState(false);
  const [submissionId, setSubmissionId] = useState("");
  const inputRef = useRef<HTMLElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const reviewHeadingRef = useRef<HTMLHeadingElement | null>(null);

  const visibleQuestions = useMemo(() => getOrderedVisibleQuestions(answers), [answers]);
  const activeIndex = Math.max(0, visibleQuestions.findIndex((question) => question.id === activeId));
  const activeQuestion = visibleQuestions[activeIndex] ?? visibleQuestions[0];
  const activeSection = activeQuestion?.section;
  const answeredCount = visibleQuestions.filter((question) => {
    const status = getAnswerStatus(question, answers[question.id]);
    return status === "complete" || status === "estimated" || status === "unknown";
  }).length;
  const progress = visibleQuestions.length ? Math.round((answeredCount / visibleQuestions.length) * 100) : 0;
  const visibleSections = auditSections.filter((section) => visibleQuestions.some((question) => question.section === section.id));

  useEffect(() => {
    const oldTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const oldDescription = description?.content;
    document.title = "Engagement assumptions audit | MarginMix";
    if (description) description.content = "A guided review of the assumptions behind your client engagement margins.";
    return () => {
      document.title = oldTitle;
      if (description && oldDescription !== undefined) description.content = oldDescription;
    };
  }, []);

  useEffect(() => {
    let loaded: AuditAnswers = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        const draft = isPlainObject(parsed) ? parsed : {};
        loaded = isAuditAnswers(draft.answers) ? draft.answers : {};
        if (typeof draft.submissionId === "string") setSubmissionId(draft.submissionId);
        const visible = getOrderedVisibleQuestions(loaded);
        const restoredActive = typeof draft.activeId === "string" && visible.some((question) => question.id === draft.activeId) ? draft.activeId : visible[0]?.id ?? null;
        const restoredIndex = visible.findIndex((question) => question.id === restoredActive);
        const firstGap = visible.slice(0, restoredIndex).find((question) => validateAuditAnswer(question, loaded[question.id]));
        setActiveId(firstGap?.id ?? restoredActive);
        const canRestoreReview = draft.reviewing === true && visible.every((question) => !validateAuditAnswer(question, loaded[question.id]));
        setReviewing(canRestoreReview);
      } else {
        const questions = getOrderedVisibleQuestions(loaded);
        setActiveId(questions[0]?.id ?? auditQuestions[0]?.id ?? null);
      }
      setSaving("saved");
    } catch {
      setSaving("unavailable");
    }
    setAnswers(loaded);
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored || submitted) return;
    setSaving("saving");
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, submissionId, activeId, reviewing }));
        setSaving("saved");
      } catch {
        setSaving("unavailable");
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [answers, submissionId, activeId, reviewing, restored, submitted]);

  useEffect(() => {
    if (!submitted && (activeQuestion || reviewing)) {
      const timer = window.setTimeout(() => {
        if (reviewing) reviewHeadingRef.current?.focus();
        else if (inputRef.current?.isConnected) inputRef.current.focus();
        else questionHeadingRef.current?.focus();
      }, reducedMotion ? 220 : 260);
      return () => window.clearTimeout(timer);
    }
  }, [activeId, reviewing, submitted, reducedMotion, activeQuestion]);

  const setAnswer = useCallback((id: string, value: AuditAnswers[string]) => {
    if (isSubmitting) return;
    setAnswers((previous) => ({ ...previous, [id]: value }));
    setSubmissionId("");
    setError("");
  }, [isSubmitting]);

  const goToQuestion = useCallback((question: AuditQuestion) => {
    if (isSubmitting) return;
    setReviewing(false);
    setActiveId(question.id);
    setError("");
  }, [isSubmitting]);

  const validateOne = (question: AuditQuestion) => {
    const message = validateAuditAnswer(question, answers[question.id]);
    if (message) {
      setError(message);
      requestAnimationFrame(() => errorRef.current?.focus());
      return false;
    }
    return true;
  };

  const next = () => {
    if (isSubmitting) return;
    if (!activeQuestion || !validateOne(activeQuestion)) return;
    const updatedVisible = getOrderedVisibleQuestions(answers);
    const index = updatedVisible.findIndex((question) => question.id === activeQuestion.id);
    if (index >= updatedVisible.length - 1) {
      void submit();
      return;
    }
    setActiveId(updatedVisible[index + 1]?.id ?? null);
    setError("");
  };

  const previous = () => {
    if (isSubmitting) return;
    const index = visibleQuestions.findIndex((question) => question.id === activeId);
    if (index > 0) setActiveId(visibleQuestions[index - 1].id);
    else setReviewing(false);
    setError("");
  };

  const jumpSection = (sectionId: string) => {
    if (isSubmitting) return;
    const first = visibleQuestions.find((question) => question.section === sectionId);
    if (first) jumpToQuestion(first);
  };

  const beginReview = () => {
    if (isSubmitting) return;
    const firstInvalid = visibleQuestions.find((question) => validateAuditAnswer(question, answers[question.id]));
    if (firstInvalid) {
      setActiveId(firstInvalid.id);
      setReviewing(false);
      setError(`Please answer this question before reviewing the rest: ${firstInvalid.title}`);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setReviewing(true);
    setError("");
  };

  const jumpToQuestion = (question: AuditQuestion) => {
    if (isSubmitting) return;
    const targetIndex = visibleQuestions.findIndex((item) => item.id === question.id);
    const unansweredBeforeTarget = visibleQuestions.slice(0, targetIndex + 1)
      .find((item) => validateAuditAnswer(item, answers[item.id]));
    if (unansweredBeforeTarget) {
      setReviewing(false);
      setActiveId(unansweredBeforeTarget.id);
      setError(`Please answer this question before moving on: ${unansweredBeforeTarget.title}`);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    goToQuestion(question);
  };

  const submit = async () => {
    if (isSubmitting) return;
    const invalid = visibleQuestions.find((question) => validateAuditAnswer(question, answers[question.id]));
    if (invalid) {
      goToQuestion(invalid);
      setError(validateAuditAnswer(invalid, answers[invalid.id]) ?? "Please review this answer.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    const stableId = submissionId || newSubmissionId();
    setSubmissionId(stableId);
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/audit-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: 1, answers: getApplicableAnswers(answers), submissionId: stableId }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || `Submission failed (${response.status}). Please try again.`);
      if (!body.id || !body.submittedAt) throw new Error("The server response was incomplete. Your answers have not been confirmed; please retry.");
      setSubmitted({ id: String(body.id), submittedAt: String(body.submittedAt) });
      setShowThankYou(true);
      try { localStorage.removeItem(STORAGE_KEY); } catch { setSaving("unavailable"); }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not submit your answers. Check your connection and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearDraft = () => {
    if (isSubmitting) return;
    setAnswers({});
    setSubmissionId("");
    setActiveId(getOrderedVisibleQuestions({})[0]?.id ?? auditQuestions[0]?.id ?? null);
    setReviewing(false);
    setError("");
    setShowResetConfirm(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSaving("saved");
    } catch {
      setSaving("unavailable");
    }
  };

  const keyAdvance = (event: ReactKeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      next();
    }
  };

  const renderField = (question: AuditQuestion) => {
    const value = answers[question.id];
    const common = "w-full rounded-xl border border-[#d8d7cb] bg-[#fffefa] px-4 py-3.5 text-[16px] text-[#263b39] outline-none transition focus:border-[#28796a] focus:ring-2 focus:ring-[#28796a]/15 placeholder:text-[#9b9b8f]";
    if (question.type === "single" || question.type === "multi") {
      const selected: string[] = question.type === "multi" && Array.isArray(value) ? value as string[] : [];
      return (
        <fieldset className="space-y-2.5" aria-label={question.title} onKeyDown={keyAdvance} disabled={isSubmitting}>
          <legend className="sr-only">{question.title}</legend>
          {(question.options ?? []).map((option, optionIndex) => {
            const isSelected = question.type === "single" ? value === option.value : selected.includes(option.value);
            return (
              <label key={option.value} className={`flex min-h-[58px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${isSelected ? "border-[#28796a] bg-[#edf5f0] text-[#1e5b50]" : "border-[#dddcd1] bg-[#fffefa] hover:border-[#8caaa1] hover:bg-[#fbfcf8]"}`}>
                <input
                  type={question.type === "single" ? "radio" : "checkbox"}
                  name={question.id}
                  value={option.value}
                  checked={isSelected}
                  onChange={() => {
                    if (question.type === "single") setAnswer(question.id, option.value);
                    else {
                      const nextSelected = isSelected ? selected.filter((item) => item !== option.value) : [...selected, option.value];
                      setAnswer(question.id, nextSelected);
                    }
                  }}
                  ref={(element) => { if (optionIndex === 0) inputRef.current = element; }}
                  className="h-4 w-4 accent-[#28796a]"
                />
                <span className="flex-1 text-[15px] leading-6">{option.label}</span>
              </label>
            );
          })}
        </fieldset>
      );
    }
    if (question.type === "table") {
      const rows = Array.isArray(value) ? value as Record<string, string>[] : [];
      const columns = question.columns ?? [];
      const updateCell = (rowIndex: number, key: string, cell: string) => setAnswer(question.id, rows.map((row, index) => index === rowIndex ? { ...row, [key]: cell } : row));
      return (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-[#deddd2]">
            <table className="min-w-[560px] w-full border-collapse text-left">
              <thead className="bg-[#f1f1e9] text-xs uppercase tracking-[0.12em] text-[#70776f]">
                <tr>{columns.map((column) => <th key={column.key} className="px-3 py-3 font-semibold">{column.label}</th>)}<th className="w-12 px-2" /></tr>
              </thead>
              <tbody className="divide-y divide-[#e7e5dc] bg-[#fffefa]">
                {rows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`}>
                    {columns.map((column, columnIndex) => (
                      <td key={column.key} className="p-2">
                        <input ref={(element) => { if (rowIndex === 0 && columnIndex === 0) inputRef.current = element; }} disabled={isSubmitting} aria-label={`${column.label}, row ${rowIndex + 1}`} type={column.type === "number" || column.type === "date" ? column.type : "text"} value={row[column.key] ?? ""} onChange={(event) => updateCell(rowIndex, column.key, event.target.value)} className="w-full min-w-[120px] rounded-lg border border-[#e4e2d9] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#28796a] focus:ring-2 focus:ring-[#28796a]/15" />
                      </td>
                    ))}
                    <td className="px-2 text-center">
                      <button type="button" disabled={isSubmitting} onClick={() => setAnswer(question.id, rows.filter((_, index) => index !== rowIndex))} aria-label={`Remove row ${rowIndex + 1}`} className="rounded-lg p-2 text-[#8a7771] hover:bg-[#f7ebe6] hover:text-[#8b493b] disabled:opacity-50"><X size={16} /></button>
                    </td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={columns.length + 1} className="px-4 py-7 text-center text-sm text-[#85877d]">Add a row to capture the assumptions you know.</td></tr>}
              </tbody>
            </table>
          </div>
          <button ref={(element) => { if (!rows.length) inputRef.current = element; }} type="button" disabled={isSubmitting} onClick={() => setAnswer(question.id, [...rows, Object.fromEntries(columns.map((column) => [column.key, ""]))])} className="inline-flex items-center gap-2 rounded-lg border border-[#c9d8ce] px-3 py-2 text-sm font-semibold text-[#286d5f] hover:bg-[#edf5f0] disabled:opacity-50">Add row</button>
        </div>
      );
    }
    const textValue = typeof value === "string" && value !== UNKNOWN ? value : "";
    return (
      <div className="space-y-3">
        {question.type === "textarea" ? (
          <textarea
            ref={inputRef as unknown as RefObject<HTMLTextAreaElement>}
            disabled={isSubmitting}
            value={textValue}
            onChange={(event) => setAnswer(question.id, event.target.value)}
            onKeyDown={keyAdvance}
            placeholder={question.placeholder ?? "Type your answer"}
            rows={5}
            aria-label={question.title}
            className={`${common} min-h-36 resize-y`}
          />
        ) : (
          <input
            ref={inputRef as unknown as RefObject<HTMLInputElement>}
            disabled={isSubmitting}
            type={question.type === "email" ? "email" : question.type === "number" ? "number" : "text"}
            value={textValue}
            onChange={(event) => setAnswer(question.id, event.target.value)}
            onKeyDown={keyAdvance}
            placeholder={question.placeholder ?? "Type your answer"}
            autoComplete={question.id === "email" ? "email" : question.id === "name" ? "name" : question.id === "agency" ? "organization" : undefined}
            aria-label={question.title}
            className={common}
          />
        )}
      </div>
    );
  };

  const mapQuestions = visibleQuestions.filter((question) => !question.contact && !["name", "email", "agency"].includes(question.id));

  return (
    <main className="min-h-[100dvh] bg-[#f4f2e9] text-[#263b39]">
      <header className="sticky top-0 z-30 border-b border-[#deddd2] bg-[#f8f7f0]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
          <a href="/" className="group flex items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#28796a]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#28796a] text-sm font-bold tracking-tight text-white">M</span>
            <span><span className="block font-semibold tracking-[-0.03em] text-[#23443e]">MarginMix</span><span className="block text-[10px] uppercase tracking-[0.16em] text-[#7d867e]">Engagement audit</span></span>
          </a>
          <div className="flex items-center gap-3">
            <div aria-live="polite" className="hidden items-center gap-1.5 text-xs text-[#7a8279] sm:flex">
              {saving === "saving" ? <Save size={14} /> : saving === "unavailable" ? <CircleHelp size={14} /> : <Check size={14} />}
              {saving === "saving" ? "Saving draft…" : saving === "unavailable" ? "Local save unavailable" : "Draft saved on this device"}
            </div>
            <button type="button" aria-label="Clear draft" disabled={isSubmitting} onClick={() => setShowResetConfirm(true)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[#747b73] hover:bg-[#eceae0] hover:text-[#344741] disabled:opacity-50"><Trash2 size={14} /><span className="hidden sm:inline">Clear draft</span></button>
          </div>
        </div>
        <div className="h-[3px] bg-[#e6e3d8]"><div className="h-full bg-[#4b9880] transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
      </header>

      <nav aria-label="Jump to assessment category" className="border-b border-[#e3e0d5] bg-[#f4f2e9] lg:hidden">
        <div className="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-4 py-3 sm:px-8">
          {visibleSections.map((section) => (
            <button key={section.id} type="button" disabled={isSubmitting} onClick={() => jumpSection(section.id)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${activeSection === section.id && !reviewing ? "border-[#28796a] bg-[#e7f1eb] text-[#236556]" : "border-[#deddd2] bg-[#faf9f3] text-[#747c73] hover:border-[#9fb8ab]"} disabled:opacity-50`}>
              {section.title}
            </button>
          ))}
        </div>
      </nav>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-4 pb-16 pt-7 sm:px-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-12 lg:pt-10">
        <section className="min-w-0">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#81867c]"><span className="h-2 w-2 rounded-full bg-[#58a087]" /> Assumptions, made visible</div>
            <div className="text-xs tabular-nums text-[#7c837b]">{answeredCount} of {visibleQuestions.length} answered</div>
          </div>

          {!submitted ? (
            <AnimatePresence mode="wait" initial={false}>
        {reviewing ? (
                <motion.div key="review" initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                  <div className="mb-7">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.17em] text-[#568475]">Final pass · {visibleQuestions.length} visible questions</p>
                    <h1 ref={reviewHeadingRef} tabIndex={-1} className="max-w-3xl font-serif text-4xl leading-[1.08] tracking-[-0.04em] text-[#24423c] focus:outline-none sm:text-5xl">Review the assumptions.</h1>
                    <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#737b72]">Nothing is sent until you choose submit. Select any answer to revisit it.</p>
                  </div>
                  <div className="space-y-7">
                    {auditSections.map((section) => {
                      const questions = visibleQuestions.filter((question) => question.section === section.id);
                      if (!questions.length) return null;
                      return <section key={section.id} aria-labelledby={`review-${section.id}`}>
                        <h2 id={`review-${section.id}`} className="mb-2 border-b border-[#deddd2] pb-2 text-xs font-bold uppercase tracking-[0.15em] text-[#788077]">{section.title}</h2>
                        <div className="divide-y divide-[#e5e2d9]">
                          {questions.map((question) => {
                            const status = getAnswerStatus(question, answers[question.id]);
                            return <button key={question.id} type="button" disabled={isSubmitting} onClick={() => jumpToQuestion(question)} className="flex w-full items-start justify-between gap-4 py-4 text-left hover:bg-[#ebece3]/70 disabled:pointer-events-none disabled:opacity-60">
                              <span><span className="block text-sm font-medium text-[#344b45]">{question.title}</span><span className="mt-1 block text-sm leading-6 text-[#788077]">{safeLabel(question, answers[question.id])}</span></span>
                              <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyle[status]}`}>{statusCopy[status]}</span>
                            </button>;
                          })}
                        </div>
                      </section>;
                    })}
                  </div>
                  {error && <div ref={errorRef} tabIndex={-1} role="alert" className="mt-5 rounded-xl border border-[#d49b87] bg-[#fbefea] p-4 text-sm text-[#8b493b]">{error}</div>}
                  <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#deddd2] pt-5 sm:flex-row sm:justify-between">
                    <button type="button" disabled={isSubmitting} onClick={() => { setReviewing(false); setError(""); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d7d6ca] px-4 py-3 text-sm font-semibold text-[#53645c] hover:bg-[#eeede5] disabled:opacity-50"><ArrowLeft size={16} /> Back to questions</button>
                    <button type="button" disabled={isSubmitting} onClick={submit} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#28796a] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#216657] disabled:cursor-wait disabled:opacity-60">{isSubmitting ? "Sending securely…" : "Submit audit"}<Send size={16} /></button>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-[#777d73]">When you submit, these answers—including financial information—are stored by MarginMix. A PDF copy is emailed to your supplied address and sid@dilexicon.com. Until then, your draft remains in this browser.</p>
                </motion.div>
              ) : activeQuestion ? (
                <motion.div key={activeQuestion.id} initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                  <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.17em] text-[#568475]">{activeSection} <span className="px-1 text-[#b9b7aa]">/</span> {activeIndex + 1} of {visibleQuestions.length}</p>
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#98998d]">Engagement assumptions</p>
                    </div>
                    <button type="button" disabled={isSubmitting} onClick={next} className="text-right text-xs font-semibold text-[#28796a] underline decoration-[#a7c7b8] underline-offset-4 hover:text-[#1c5d50] disabled:opacity-50">
                      {activeIndex === visibleQuestions.length - 1 ? "Press Enter or Click here to submit" : "Press Enter or Click here to continue"}
                    </button>
                  </div>
                  <div className="max-w-3xl">
                    <h1 ref={questionHeadingRef} tabIndex={-1} id="question-title" className="font-serif text-[34px] leading-[1.13] tracking-[-0.035em] text-[#24423c] focus:outline-none sm:text-[46px]">{activeQuestion.title}</h1>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#65796d]">Required · Every applicable question needs a response</p>
                    {activeQuestion.description && <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#737b72]">{activeQuestion.description}</p>}
                    <div className="mt-8">{renderField(activeQuestion)}</div>
                    {activeQuestion.allowUnknown && !activeQuestion.contact && !["name", "email", "agency"].includes(activeQuestion.id) && (
                      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-[#c9cbc0] px-4 py-3.5 text-sm text-[#6f776f] hover:border-[#8caaa1] hover:bg-[#fbfcf8]">
                      <input type="checkbox" disabled={isSubmitting} checked={answers[activeQuestion.id] === UNKNOWN} onChange={(event) => setAnswer(activeQuestion.id, event.target.checked ? UNKNOWN : "")} className="mt-0.5 h-4 w-4 accent-[#28796a]" />
                        <span><span className="block font-semibold text-[#53645c]">I don’t know yet</span><span className="mt-0.5 block text-xs leading-5 text-[#899087]">This records an explicit unknown response; unanswered questions cannot be skipped.</span></span>
                      </label>
                    )}
                    {error && <div ref={errorRef} tabIndex={-1} role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 shadow-sm">{error}</div>}
                    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#deddd2] pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <button type="button" disabled={isSubmitting || activeIndex === 0} onClick={previous} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#64716a] hover:bg-[#ebeae1] disabled:opacity-40"><ArrowLeft size={16} /> Back</button>
                      <button type="button" disabled={isSubmitting} onClick={next} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#28796a] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#216657] disabled:cursor-wait disabled:opacity-60">
                        {activeIndex === visibleQuestions.length - 1 ? (isSubmitting ? "Submitting & emailing PDF…" : "Press Enter or Click here to submit") : "Press Enter or Click here to continue"}
                        {activeIndex === visibleQuestions.length - 1 ? <Send size={16} /> : <ArrowRight size={16} />}
                      </button>
                    </div>
                    {activeIndex === visibleQuestions.length - 1 && <p className="mt-3 text-xs leading-6 text-[#777d73]">Submitting stores your responses with MarginMix and emails a PDF copy to your supplied address and sid@dilexicon.com. You can review all answers before submitting.</p>}
                  </div>
                </motion.div>
              ) : <div className="rounded-2xl border border-[#deddd2] bg-[#fffefa] p-8 text-sm text-[#6f776f]">No questions are currently available. Please reload the assessment.</div>}
            </AnimatePresence>
          ) : (
            <motion.div initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl rounded-3xl border border-[#d8ded4] bg-[#fffefa] p-6 shadow-[0_18px_55px_-42px_rgba(35,66,60,.3)] sm:p-10">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f2eb] text-[#28796a]"><CheckCircle2 size={25} /></span>
              <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-[#568475]">Submission confirmed</p>
              <h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-[#24423c] sm:text-5xl">Your assumptions are in.</h1>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#737b72]">Thank you for your response. We'll be in touch. A PDF of your responses has been sent to your email address, with a copy to Sid. This is a submission receipt, not a financial forecast.</p>
              <div className="mt-7 rounded-xl bg-[#f2f2e9] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#84887d]">Reference</p>
                <p className="mt-1 break-all font-mono text-sm text-[#3e5b52]">{submitted.id}</p>
                <p className="mt-2 text-xs text-[#83877d]">Received {new Date(submitted.submittedAt).toLocaleString()}</p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => downloadAnswers(answers, submitted)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#28796a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#216657]"><Download size={16} /> Download answers JSON</button>
                <a href="https://calendly.com/sid-marginmix/30min" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl border border-[#d7d6ca] px-4 py-3 text-sm font-semibold text-[#53645c] hover:bg-[#f1f0e8]">Book an optional meeting</a>
              </div>
            </motion.div>
          )}
        </section>

        <aside className="lg:sticky lg:top-[94px] lg:self-start">
          <div className="rounded-2xl border border-[#deddd2] bg-[#faf9f3] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#899087]">Assessment map</p><h2 className="mt-1 font-serif text-xl tracking-[-0.02em] text-[#345149]">Your working picture</h2></div>
              <span className="rounded-lg bg-[#eeede4] px-2 py-1 font-mono text-[11px] text-[#7d8278]">{progress}%</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#85887d]">A completeness map, not a margin or risk score.</p>
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2" aria-label="Question status legend">
              {(["complete", "estimated", "unknown", "unanswered"] as const).map((status) => <span key={status} className="inline-flex items-center gap-1.5 text-[10px] text-[#70776f]"><i className={`h-2.5 w-2.5 rounded-sm ${statusStyle[status].split(" ")[0]}`} />{statusCopy[status]}</span>)}
            </div>
            {visibleSections.some((section) => section.id === "contact") && <button type="button" disabled={isSubmitting} onClick={() => jumpSection("contact")} className={`mt-4 flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs font-semibold ${activeSection === "contact" && !reviewing ? "border-[#7fae9c] bg-[#eaf3ec] text-[#286d5f]" : "border-[#e1dfd5] text-[#69756d] hover:bg-[#f2f3eb]"} disabled:opacity-50`}><span>Your details · Contact</span><span className="font-mono">{visibleQuestions.filter((question) => question.section === "contact" && ["complete", "estimated", "unknown"].includes(getAnswerStatus(question, answers[question.id]))).length}/3</span></button>}
            <div className="mt-4 space-y-4">
              {auditSections.map((section) => {
                const sectionQuestions = mapQuestions.filter((question) => question.section === section.id);
                if (!sectionQuestions.length) return null;
                const sectionComplete = sectionQuestions.filter((question) => ["complete", "estimated", "unknown"].includes(getAnswerStatus(question, answers[question.id]))).length;
                return <div key={section.id}>
                  <button type="button" disabled={isSubmitting} onClick={() => jumpSection(section.id)} className="mb-2 flex w-full items-center justify-between gap-2 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-[#758078] hover:text-[#28796a] disabled:opacity-50">
                    <span>{section.title}</span><span className="font-mono font-normal tracking-normal">{sectionComplete}/{sectionQuestions.length}</span>
                  </button>
                  <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-6">
                    {sectionQuestions.map((question) => {
                      const status = getAnswerStatus(question, answers[question.id]);
                      return <button key={question.id} type="button" disabled={isSubmitting} onClick={() => jumpToQuestion(question)} aria-label={`${question.title}: ${statusCopy[status]}`} title={`${question.title} — ${statusCopy[status]}`} className={`grid aspect-square min-h-8 place-items-center rounded-md text-[10px] font-bold transition hover:ring-2 hover:ring-[#28796a]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#28796a] disabled:opacity-50 ${statusStyle[status]} ${activeId === question.id && !reviewing ? "ring-2 ring-[#24423c] ring-offset-1" : ""}`}><span>{sectionQuestions.indexOf(question) + 1}</span></button>;
                    })}
                  </div>
                </div>;
              })}
            </div>
            <button type="button" disabled={isSubmitting} onClick={beginReview} className="mt-5 flex w-full items-center justify-between rounded-xl border border-[#d9ddd1] bg-[#fffefa] px-3.5 py-3 text-left text-sm font-semibold text-[#49665b] hover:border-[#9fb8ab] hover:bg-[#f3f7f1] disabled:opacity-50">
              <span>Review all answers</span><ArrowRight size={16} />
            </button>
          </div>
          <div className="mt-3 flex gap-2 rounded-xl border border-[#e0dfd5] bg-[#eeede5] p-3.5 text-xs leading-5 text-[#747b73]">
            <ShieldCheck className="mt-0.5 shrink-0 text-[#558675]" size={16} />
            <span>Draft answers stay in this browser on this device until submitted. You can clear them at any time.</span>
          </div>
        </aside>
      </div>

      <div className="fixed bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[#dfddd2] bg-[#faf9f3]/95 px-3 py-2 text-[10px] text-[#85887e] shadow-sm backdrop-blur sm:hidden">
        {saving === "unavailable" ? "Draft not saved on this device" : saving === "saving" ? "Saving draft…" : "Draft saved on this device"}
      </div>

      <Dialog open={showThankYou} onOpenChange={setShowThankYou}>
        <DialogContent className="max-w-md rounded-2xl border-[#d8ded4] bg-[#fffefa] p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-[#28796a]" aria-hidden="true" />
          <DialogTitle className="font-serif text-3xl leading-tight text-[#24423c]">Thank you for your response. We'll be in touch</DialogTitle>
          <DialogDescription className="pt-3 text-sm leading-6 text-[#737b72]">A PDF copy of your questionnaire responses has been emailed to you and Sid.</DialogDescription>
          <button type="button" onClick={() => setShowThankYou(false)} className="mt-4 rounded-xl bg-[#28796a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#216657]">Done</button>
        </DialogContent>
      </Dialog>

      {showResetConfirm && <div className="fixed inset-0 z-50 grid place-items-center bg-[#243a35]/35 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowResetConfirm(false); }}>
        <div role="alertdialog" aria-modal="true" aria-labelledby="reset-title" className="w-full max-w-md rounded-2xl border border-[#deddd2] bg-[#faf9f3] p-6 shadow-xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a725c]">Clear local draft</p>
          <h2 id="reset-title" className="mt-2 font-serif text-2xl text-[#29483f]">Start this audit over?</h2>
          <p className="mt-3 text-sm leading-6 text-[#747b73]">This permanently removes the answers saved in this browser. It does not affect anything already submitted.</p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setShowResetConfirm(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#64716a] hover:bg-[#eceae0]">Keep draft</button>
            <button type="button" onClick={clearDraft} className="inline-flex items-center gap-2 rounded-xl bg-[#8b493b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#733b31]"><RotateCcw size={15} /> Clear answers</button>
          </div>
        </div>
      </div>}
    </main>
  );
}
