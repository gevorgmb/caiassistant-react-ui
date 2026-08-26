import { useState, type SubmitEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import {
  Language,
  type AgendaItem,
  type DocumentIssue,
} from "../gen/assistant/v1/assistant_pb.js";
import { TodoListStatus } from "../gen/common/v1/office_pb.js";
import { useAuth } from "../auth/AuthContext.tsx";
import { assistantClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import { EDITABLE_TODO_STATUSES, todoListStatusLabel } from "../lib/todoListStatus.ts";
import { getAssistantFunction } from "../lib/assistantFunctions.ts";
import {
  CHECK_FOCUSES,
  DOCUMENT_TYPES,
  EVENT_FOCUSES,
  LOCALES,
  LOCALE_CODES,
  type Locale,
  type Messages,
} from "../i18n/index.ts";
import { useI18n } from "../i18n/I18nContext.tsx";
import "../styles/ui.css";

type AssistantResult =
  | { kind: "document"; content: string }
  | {
      kind: "check";
      summary: string;
      issues: DocumentIssue[];
      revisedDocument?: string;
    }
  | { kind: "agenda"; title: string; items: AgendaItem[]; markdown: string }
  | { kind: "report"; title: string; summary: string; markdown: string };

const ASSISTANT_LANGUAGE_BY_LOCALE: Record<Locale, Language> = {
  en: Language.ENGLISH,
  hy: Language.ARMENIAN,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toLocalInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 0, 0);
}

function parseLocalDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function AiAssistantFunctionPage() {
  const { functionId } = useParams<{ functionId: string }>();
  const fn = getAssistantFunction(functionId);
  const { office, officeLoading } = useAuth();
  const { t, locale } = useI18n();
  const copy = fn ? t.assistant.functions[fn.id] : null;

  const [topic, setTopic] = useState("");
  const [instructions, setInstructions] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [document, setDocument] = useState("");
  const [focus, setFocus] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [meetingDate, setMeetingDate] = useState("");
  const [todoStatus, setTodoStatus] = useState("");
  const [searchText, setSearchText] = useState("");
  const [from, setFrom] = useState(() => toLocalInputValue(startOfMonth(new Date())));
  const [to, setTo] = useState(() => toLocalInputValue(endOfMonth(new Date())));
  const [eventFocus, setEventFocus] = useState("both");
  const [language, setLanguage] = useState<Language>(
    () => ASSISTANT_LANGUAGE_BY_LOCALE[locale],
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssistantResult | null>(null);

  if (!fn || !copy) {
    return (
      <section className="page">
        <h1>{t.assistant.title}</h1>
        <p className="empty-state">
          {t.assistant.unknown}{" "}
          <Link to="/ai-assistant">{t.assistant.backTo}</Link>
        </p>
      </section>
    );
  }

  if (fn.requiresOffice && officeLoading) {
    return (
      <section className="page">
        <p className="page-lede">{t.assistant.loadingOffice}</p>
      </section>
    );
  }

  if (fn.requiresOffice && !office) {
    return (
      <section className="page">
        <h1>{copy.title}</h1>
        <p className="empty-state">
          {t.assistant.needOffice}{" "}
          <Link to="/office">{t.common.goToOffice}</Link>
        </p>
      </section>
    );
  }

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fn) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const next = await runFunction();
      setResult(next);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function runFunction(): Promise<AssistantResult> {
    if (!fn) {
      throw new Error(t.assistant.unknownFunctionError);
    }
    switch (fn.id) {
      case "build-document": {
        const res = await assistantClient.buildDocument({
          topic: topic.trim(),
          instructions: instructions.trim() || undefined,
          documentType: documentType || undefined,
          officeId: office?.id,
          language,
        });
        return { kind: "document", content: res.content };
      }
      case "edit-document": {
        const res = await assistantClient.editDocument({
          document: document.trim(),
          instructions: instructions.trim(),
          language,
        });
        return { kind: "document", content: res.content };
      }
      case "check-document": {
        const res = await assistantClient.checkDocument({
          document: document.trim(),
          focus: focus || undefined,
          language,
        });
        return {
          kind: "check",
          summary: res.summary,
          issues: res.issues,
          revisedDocument: res.revisedDocument,
        };
      }
      case "build-agenda": {
        const meeting = parseLocalDate(meetingDate);
        const minutes = Number.parseInt(durationMinutes, 10);
        const res = await assistantClient.buildAgenda({
          topic: topic.trim(),
          instructions: instructions.trim() || undefined,
          officeId: office?.id,
          meetingDate: meeting ? timestampFromDate(meeting) : undefined,
          durationMinutes: Number.isFinite(minutes) ? minutes : 0,
          language,
        });
        return {
          kind: "agenda",
          title: res.title,
          items: res.items,
          markdown: res.markdown,
        };
      }
      case "summarize-todos": {
        if (!office) {
          throw new Error(t.assistant.officeRequired);
        }
        const statusValue = todoStatus
          ? (Number(todoStatus) as TodoListStatus)
          : undefined;
        const res = await assistantClient.summarizeTodos({
          officeId: office.id,
          status: statusValue,
          searchText: searchText.trim() || undefined,
          language,
        });
        return {
          kind: "report",
          title: res.title,
          summary: res.summary,
          markdown: res.markdown,
        };
      }
      case "build-events-report": {
        if (!office) {
          throw new Error(t.assistant.officeRequired);
        }
        const fromDate = parseLocalDate(from);
        const toDate = parseLocalDate(to);
        if (!fromDate || !toDate) {
          throw new Error(t.assistant.datesRequired);
        }
        const res = await assistantClient.buildEventsReport({
          officeId: office.id,
          from: timestampFromDate(fromDate),
          to: timestampFromDate(toDate),
          focus: eventFocus || undefined,
          language,
        });
        return {
          kind: "report",
          title: res.title,
          summary: res.summary,
          markdown: res.markdown,
        };
      }
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>{copy.title}</h1>
        <div className="page-header__actions">
          <button
            type="submit"
            form="assistant-form"
            className="btn"
            disabled={busy}
          >
            {busy ? t.assistant.running : t.assistant.run}
          </button>
          <Link className="btn btn--ghost" to="/ai-assistant">
            {t.common.back}
          </Link>
        </div>
      </div>
      <p className="page-lede">
        <span className="function-card__rpc">{fn.rpc}</span>
        {" — "}
        {copy.description}
      </p>

      <form
        id="assistant-form"
        className="stack-form stack-form--wide"
        onSubmit={(event) => void onSubmit(event)}
      >
        <label>
          {t.assistant.responseLanguage}
          <select
            value={language}
            onChange={(e) => setLanguage(Number(e.target.value) as Language)}
          >
            {LOCALE_CODES.map((code) => (
              <option key={code} value={ASSISTANT_LANGUAGE_BY_LOCALE[code]}>
                {LOCALES[code].nativeName}
              </option>
            ))}
          </select>
        </label>
        {fn.id === "build-document" ? (
          <>
            <label>
              {t.assistant.topic}
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label>
              {t.assistant.documentType}
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="">{t.assistant.officeDocument}</option>
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t.assistant.documentTypes[type]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.assistant.instructions}
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
              />
            </label>
          </>
        ) : null}

        {fn.id === "edit-document" ? (
          <>
            <label>
              {t.assistant.document}
              <textarea
                className="stack-form__tall"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label>
              {t.assistant.instructions}
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                required
                rows={4}
              />
            </label>
          </>
        ) : null}

        {fn.id === "check-document" ? (
          <>
            <label>
              {t.assistant.document}
              <textarea
                className="stack-form__tall"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label>
              {t.assistant.focus}
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
              >
                <option value="">{t.assistant.all}</option>
                {CHECK_FOCUSES.map((item) => (
                  <option key={item} value={item}>
                    {t.assistant.checkFocuses[item]}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {fn.id === "build-agenda" ? (
          <>
            <label>
              {t.assistant.topic}
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label>
              {t.assistant.meetingDate}
              <input
                type="datetime-local"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
              />
            </label>
            <label>
              {t.assistant.duration}
              <input
                type="number"
                min={0}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </label>
            <label>
              {t.assistant.instructions}
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
              />
            </label>
          </>
        ) : null}

        {fn.id === "summarize-todos" ? (
          <>
            <label>
              {t.assistant.status}
              <select
                value={todoStatus}
                onChange={(e) => setTodoStatus(e.target.value)}
              >
                <option value="">{t.assistant.all}</option>
                {EDITABLE_TODO_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {todoListStatusLabel(status, t)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.assistant.searchText}
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </label>
          </>
        ) : null}

        {fn.id === "build-events-report" ? (
          <>
            <label>
              {t.assistant.from}
              <input
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                required
              />
            </label>
            <label>
              {t.assistant.to}
              <input
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
              />
            </label>
            <label>
              {t.assistant.focus}
              <select
                value={eventFocus}
                onChange={(e) => setEventFocus(e.target.value)}
              >
                {EVENT_FOCUSES.map((item) => (
                  <option key={item} value={item}>
                    {t.assistant.eventFocuses[item]}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {error ? <p className="error">{error}</p> : null}
      </form>

      {result ? <AssistantResultView result={result} t={t} /> : null}
    </section>
  );
}

function AssistantResultView({
  result,
  t,
}: {
  result: AssistantResult;
  t: Messages;
}) {
  if (result.kind === "document") {
    return (
      <div className="assistant-result">
        <h2>{t.assistant.result}</h2>
        <pre>{result.content || t.common.empty}</pre>
      </div>
    );
  }

  if (result.kind === "check") {
    return (
      <div className="assistant-result">
        <h2>{t.assistant.review}</h2>
        <p className="page-lede">{result.summary || t.common.empty}</p>
        {result.issues.length === 0 ? (
          <p className="empty-state">{t.assistant.noIssues}</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.assistant.severity}</th>
                  <th>{t.assistant.message}</th>
                  <th>{t.assistant.suggestion}</th>
                </tr>
              </thead>
              <tbody>
                {result.issues.map((issue, index) => (
                  <tr key={`${issue.severity}-${index}`}>
                    <td>{issue.severity || t.common.empty}</td>
                    <td>{issue.message || t.common.empty}</td>
                    <td>{issue.suggestion || t.common.empty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {result.revisedDocument ? (
          <>
            <h2>{t.assistant.revisedDocument}</h2>
            <pre>{result.revisedDocument}</pre>
          </>
        ) : null}
      </div>
    );
  }

  if (result.kind === "agenda") {
    return (
      <div className="assistant-result">
        <h2>{result.title || t.assistant.agenda}</h2>
        {result.items.length > 0 ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.assistant.item}</th>
                  <th>{t.assistant.description}</th>
                  <th>{t.assistant.minutes}</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item, index) => (
                  <tr key={`${item.title}-${index}`}>
                    <td>{item.title || t.common.empty}</td>
                    <td>{item.description || t.common.empty}</td>
                    <td>{item.durationMinutes ?? t.common.empty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <pre>{result.markdown || t.common.empty}</pre>
      </div>
    );
  }

  return (
    <div className="assistant-result">
      <h2>{result.title || t.assistant.report}</h2>
      <p className="page-lede">{result.summary || t.common.empty}</p>
      <pre>{result.markdown || t.common.empty}</pre>
    </div>
  );
}
