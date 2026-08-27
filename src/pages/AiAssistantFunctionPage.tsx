import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import { Language } from "../gen/assistant/v1/assistant_pb.js";
import { TodoListStatus } from "../gen/common/v1/office_pb.js";
import { useAuth } from "../auth/AuthContext.tsx";
import { assistantClient } from "../api/assistantClient.ts";
import { errorMessage } from "../api/errors.ts";
import { EDITABLE_TODO_STATUSES, todoListStatusLabel } from "../lib/todoListStatus.ts";
import { getAssistantFunction } from "../lib/assistantFunctions.ts";
import {
  actionFromFunctionId,
  defaultRequestState,
  functionIdFromAction,
  generatedDocumentPath,
  parseLocalDate,
  parseRequestParams,
  parseResult,
  serializeRequestParams,
  serializeResult,
  snapshotKey,
  type AssistantRequestState,
  type AssistantResult,
} from "../lib/generatedDocuments.ts";
import {
  CHECK_FOCUSES,
  DOCUMENT_TYPES,
  EVENT_FOCUSES,
  LOCALES,
  LOCALE_CODES,
  type Locale,
  type Messages,
} from "../i18n/index.ts";
import { MarkdownContent } from "../components/MarkdownContent.tsx";
import { ExportMenu } from "../components/ExportMenu.tsx";
import { useI18n } from "../i18n/I18nContext.tsx";
import "../styles/ui.css";

const ASSISTANT_LANGUAGE_BY_LOCALE: Record<Locale, Language> = {
  en: Language.ENGLISH,
  hy: Language.ARMENIAN,
};

export function AiAssistantFunctionPage() {
  const { functionId, documentId } = useParams<{
    functionId: string;
    documentId?: string;
  }>();
  const fn = getAssistantFunction(functionId);
  const navigate = useNavigate();
  const { office, officeLoading } = useAuth();
  const { t, locale } = useI18n();
  const copy = fn ? t.assistant.functions[fn.id] : null;
  const skipNextLoad = useRef(false);
  const loadExtras = useRef({
    officeId: office?.id,
    locale,
    invalidDocument: t.assistant.invalidDocument,
  });
  loadExtras.current = {
    officeId: office?.id,
    locale,
    invalidDocument: t.assistant.invalidDocument,
  };

  const [topic, setTopic] = useState("");
  const [instructions, setInstructions] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [document, setDocument] = useState("");
  const [focus, setFocus] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [meetingDate, setMeetingDate] = useState("");
  const [todoStatus, setTodoStatus] = useState("");
  const [searchText, setSearchText] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [eventFocus, setEventFocus] = useState("both");
  const [language, setLanguage] = useState<Language>(
    () => ASSISTANT_LANGUAGE_BY_LOCALE[locale],
  );

  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(() => Boolean(documentId));
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  function applyRequestState(state: AssistantRequestState) {
    setTopic(state.topic);
    setInstructions(state.instructions);
    setDocumentType(state.documentType);
    setDocument(state.document);
    setFocus(state.focus);
    setDurationMinutes(state.durationMinutes);
    setMeetingDate(state.meetingDate);
    setTodoStatus(state.todoStatus);
    setSearchText(state.searchText);
    setFrom(state.from);
    setTo(state.to);
    setEventFocus(state.eventFocus);
    setLanguage(state.language);
  }

  function currentRequestState(): AssistantRequestState {
    return {
      topic,
      instructions,
      documentType,
      document,
      focus,
      durationMinutes,
      meetingDate,
      todoStatus,
      searchText,
      from,
      to,
      eventFocus,
      language,
    };
  }

  useEffect(() => {
    if (skipNextLoad.current) {
      skipNextLoad.current = false;
      return;
    }

    const currentFn = getAssistantFunction(functionId);
    const extras = loadExtras.current;
    const fallbackLanguage = ASSISTANT_LANGUAGE_BY_LOCALE[extras.locale];
    applyRequestState(defaultRequestState(fallbackLanguage));
    setResult(null);
    setError(null);
    setSavedSnapshot(null);

    if (!documentId || !currentFn) {
      setLoadingDoc(false);
      return;
    }

    let cancelled = false;
    setLoadingDoc(true);
    void assistantClient
      .getGeneratedDocument({ id: documentId })
      .then((doc) => {
        if (cancelled) return;
        const actualFn = functionIdFromAction(doc.action);
        if (actualFn && actualFn !== currentFn.id) {
          navigate(generatedDocumentPath(actualFn, doc.id), { replace: true });
          return;
        }
        const requestState = parseRequestParams(
          doc.requestParams,
          fallbackLanguage,
        );
        const parsedResult = parseResult(doc.response);
        if (!requestState || !parsedResult) {
          setError(extras.invalidDocument);
          setLoadingDoc(false);
          return;
        }
        applyRequestState(requestState);
        setResult(parsedResult);
        setSavedSnapshot(
          snapshotKey(
            serializeRequestParams(
              currentFn.id,
              requestState,
              doc.officeId ?? extras.officeId,
            ),
            serializeResult(parsedResult),
          ),
        );
        setLoadingDoc(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(errorMessage(err));
        setLoadingDoc(false);
      });

    return () => {
      cancelled = true;
    };
  }, [documentId, functionId, navigate]);

  const requestParams = fn
    ? serializeRequestParams(fn.id, currentRequestState(), office?.id)
    : "";
  const responseJson = result ? serializeResult(result) : "";
  const isSaved =
    savedSnapshot !== null &&
    responseJson !== "" &&
    savedSnapshot === snapshotKey(requestParams, responseJson);

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

  if (loadingDoc) {
    return (
      <section className="page">
        <p className="page-lede">{t.assistant.loadingDocument}</p>
      </section>
    );
  }

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fn) return;
    setBusy(true);
    setError(null);
    try {
      const next = await runFunction();
      setResult(next);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onSave() {
    if (!fn || !result) return;
    setSaving(true);
    setError(null);
    try {
      const action = actionFromFunctionId(fn.id);
      const nextRequest = serializeRequestParams(
        fn.id,
        currentRequestState(),
        office?.id,
      );
      const nextResponse = serializeResult(result);
      if (documentId) {
        await assistantClient.updateGeneratedDocument({
          id: documentId,
          action,
          requestParams: nextRequest,
          response: nextResponse,
          officeId: office?.id,
        });
      } else {
        const doc = await assistantClient.createGeneratedDocument({
          action,
          requestParams: nextRequest,
          response: nextResponse,
          officeId: office?.id,
        });
        skipNextLoad.current = true;
        navigate(generatedDocumentPath(fn.id, doc.id), { replace: true });
      }
      setSavedSnapshot(snapshotKey(nextRequest, nextResponse));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
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
          issues: res.issues.map((issue) => ({
            severity: issue.severity,
            message: issue.message,
            suggestion: issue.suggestion,
          })),
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
          items: res.items.map((item) => ({
            title: item.title,
            description: item.description,
            durationMinutes: item.durationMinutes,
          })),
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
            disabled={busy || saving}
          >
            {busy ? t.assistant.running : t.assistant.run}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={busy || saving || !result || isSaved}
            onClick={() => void onSave()}
          >
            {saving ? t.common.saving : isSaved ? t.assistant.saved : t.common.save}
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

      {result ? (
        <AssistantResultView
          result={result}
          t={t}
          fallbackTitle={copy.title}
        />
      ) : null}
    </section>
  );
}

function AssistantResultView({
  result,
  t,
  fallbackTitle,
}: {
  result: AssistantResult;
  t: Messages;
  fallbackTitle: string;
}) {
  const download = (
    <ExportMenu result={result} fallbackTitle={fallbackTitle} />
  );

  if (result.kind === "document") {
    return (
      <div className="assistant-result">
        <div className="assistant-result__header">
          <h2>{t.assistant.result}</h2>
          {download}
        </div>
        <MarkdownContent content={result.content} empty={t.common.empty} />
      </div>
    );
  }

  if (result.kind === "check") {
    return (
      <div className="assistant-result">
        <div className="assistant-result__header">
          <h2>{t.assistant.review}</h2>
          {download}
        </div>
        <MarkdownContent
          content={result.summary}
          empty={t.common.empty}
          variant="plain"
        />
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
                    <td>
                      <MarkdownContent
                        content={issue.message}
                        empty={t.common.empty}
                        variant="plain"
                      />
                    </td>
                    <td>
                      <MarkdownContent
                        content={issue.suggestion ?? ""}
                        empty={t.common.empty}
                        variant="plain"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {result.revisedDocument ? (
          <>
            <h2>{t.assistant.revisedDocument}</h2>
            <MarkdownContent
              content={result.revisedDocument}
              empty={t.common.empty}
            />
          </>
        ) : null}
      </div>
    );
  }

  if (result.kind === "agenda") {
    return (
      <div className="assistant-result">
        <div className="assistant-result__header">
          <h2>{result.title || t.assistant.agenda}</h2>
          {download}
        </div>
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
                    <td>
                      <MarkdownContent
                        content={item.description ?? ""}
                        empty={t.common.empty}
                        variant="plain"
                      />
                    </td>
                    <td>{item.durationMinutes ?? t.common.empty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <MarkdownContent content={result.markdown} empty={t.common.empty} />
      </div>
    );
  }

  return (
    <div className="assistant-result">
      <div className="assistant-result__header">
        <h2>{result.title || t.assistant.report}</h2>
        {download}
      </div>
      <MarkdownContent
        content={result.summary}
        empty={t.common.empty}
        variant="plain"
      />
      <MarkdownContent content={result.markdown} empty={t.common.empty} />
    </div>
  );
}
