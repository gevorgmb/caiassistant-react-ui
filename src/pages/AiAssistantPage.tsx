import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { timestampDate } from "@bufbuild/protobuf/wkt";
import type { GeneratedDocument } from "../gen/assistant/v1/assistant_pb.js";
import { assistantClient } from "../api/assistantClient.ts";
import { errorMessage } from "../api/errors.ts";
import {
  ASSISTANT_FUNCTIONS,
  getAssistantFunction,
} from "../lib/assistantFunctions.ts";
import {
  actionFromFunctionId,
  functionIdFromAction,
  generatedDocumentPath,
  parseResult,
  resultPreview,
} from "../lib/generatedDocuments.ts";
import {
  DeleteIcon,
  EditIcon,
  SpinnerIcon,
} from "../components/ActionIcons.tsx";
import { ExportMenu } from "../components/ExportMenu.tsx";
import { useI18n } from "../i18n/I18nContext.tsx";
import "../styles/ui.css";

const PAGE_SIZE = 10;

function formatTimestamp(
  value: GeneratedDocument["createdAt"],
  localeTag: string,
  empty: string,
): string {
  if (!value) return empty;
  return timestampDate(value).toLocaleString(localeTag, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function AiAssistantPage() {
  const { t, fmt, localeTag } = useI18n();
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filterFn = getAssistantFunction(actionFilter);
      const res = await assistantClient.listGeneratedDocuments({
        action: filterFn ? actionFromFunctionId(filterFn.id) : undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setDocuments(res.documents);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function onDelete(doc: GeneratedDocument) {
    if (!window.confirm(t.assistant.confirmDelete)) {
      return;
    }
    setBusyId(doc.id);
    setError(null);
    try {
      await assistantClient.deleteGeneratedDocument({ id: doc.id });
      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
      setTotalCount((count) => Math.max(0, count - 1));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function actionLabel(action: GeneratedDocument["action"]): string {
    const id = functionIdFromAction(action);
    return id ? t.assistant.functions[id].title : t.common.empty;
  }

  return (
    <section className="page page--wide">
      <div className="page-header">
        <h1>{t.assistant.title}</h1>
      </div>
      <p className="page-lede">{t.assistant.lede}</p>

      <div className="function-grid">
        {ASSISTANT_FUNCTIONS.map((fn) => {
          const copy = t.assistant.functions[fn.id];
          return (
            <Link
              key={fn.id}
              className="function-card"
              to={`/ai-assistant/${fn.id}`}
            >
              <span className="function-card__rpc">{fn.rpc}</span>
              <h2>{copy.title}</h2>
              <p>{copy.description}</p>
            </Link>
          );
        })}
      </div>

      <div className="page-header">
        <h2>{t.assistant.savedDocuments}</h2>
      </div>

      <div className="filter-row">
        <label>
          {t.assistant.action}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t.assistant.all}</option>
            {ASSISTANT_FUNCTIONS.map((fn) => (
              <option key={fn.id} value={fn.id}>
                {t.assistant.functions[fn.id].title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <p className="page-lede">{t.common.loading}</p>
      ) : documents.length === 0 ? (
        <p className="empty-state">{t.assistant.emptyDocuments}</p>
      ) : (
        <>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.assistant.action}</th>
                  <th>{t.assistant.preview}</th>
                  <th>{t.assistant.createdAt}</th>
                  <th>{t.assistant.actions}</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const fnId = functionIdFromAction(doc.action);
                  const preview = resultPreview(doc.response) || t.common.empty;
                  const parsed = parseResult(doc.response);
                  return (
                    <tr key={doc.id}>
                      <td>{actionLabel(doc.action)}</td>
                      <td className="data-table__preview" title={preview}>
                        {preview}
                      </td>
                      <td>
                        {formatTimestamp(
                          doc.createdAt,
                          localeTag,
                          t.common.empty,
                        )}
                      </td>
                      <td>
                        <div className="data-table__actions">
                          {parsed ? (
                            <ExportMenu
                              result={parsed}
                              fallbackTitle={actionLabel(doc.action)}
                              compact
                            />
                          ) : null}
                          {fnId ? (
                            <Link
                              className="btn btn--sm btn--ghost btn--icon"
                              to={generatedDocumentPath(fnId, doc.id)}
                              aria-label={`${t.common.edit} ${actionLabel(doc.action)}`}
                              title={t.common.edit}
                            >
                              <EditIcon />
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            className="btn btn--sm btn--danger btn--icon"
                            disabled={busyId === doc.id}
                            onClick={() => void onDelete(doc)}
                            aria-label={t.common.delete}
                            title={t.common.delete}
                          >
                            {busyId === doc.id ? (
                              <SpinnerIcon />
                            ) : (
                              <DeleteIcon />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t.common.previous}
            </button>
            <span className="pagination__info">
              {fmt(t.common.pageInfo, { page, totalPages, totalCount })}
            </span>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              {t.common.next}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
