import { useEffect, useState, type SubmitEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { TodoListStatus } from "../gen/common/v1/office_pb.js";
import { useAuth } from "../auth/AuthContext.tsx";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import { OwnerSelect } from "../components/OwnerSelect.tsx";
import { EDITABLE_TODO_STATUSES, todoListStatusLabel } from "../lib/todoListStatus.ts";
import {
  defaultCreateOfficeId,
  type OwnerFilter,
} from "../lib/ownership.ts";
import { useI18n } from "../i18n/I18nContext.tsx";
import "../styles/ui.css";

function ownerFilterFromSearch(value: string | null): OwnerFilter {
  if (value === "personal" || value === "office") return value;
  return "all";
}

export function TodoListFormPage() {
  const { id } = useParams<{ id: string }>();
  const isCreate = id === undefined;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { office, officeLoading } = useAuth();
  const { t } = useI18n();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TodoListStatus>(TodoListStatus.PENDING);
  const [ownerId, setOwnerId] = useState(() =>
    defaultCreateOfficeId(
      ownerFilterFromSearch(searchParams.get("owner")),
      office?.id,
    ),
  );
  const [loading, setLoading] = useState(!isCreate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isCreate || officeLoading) return;
    setOwnerId(
      defaultCreateOfficeId(
        ownerFilterFromSearch(searchParams.get("owner")),
        office?.id,
      ),
    );
  }, [isCreate, office?.id, officeLoading, searchParams]);

  useEffect(() => {
    if (isCreate || !id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void officeClient
      .getTodoList({ id })
      .then((item) => {
        if (cancelled) return;
        setName(item.name);
        setDescription(item.description ?? "");
        setStatus(item.status);
        setOwnerId(item.officeId ?? "");
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  async function onSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreate && officeLoading) return;
    setBusy(true);
    setError(null);
    try {
      const trimmedName = name.trim();
      const trimmedDescription = description.trim();
      if (isCreate) {
        await officeClient.createTodoList({
          officeId: ownerId,
          name: trimmedName,
          description: trimmedDescription || undefined,
        });
      } else if (id) {
        await officeClient.updateTodoList({
          id,
          name: trimmedName,
          description: trimmedDescription || undefined,
          status,
        });
      }
      navigate("/todolist");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="page">
        <p className="page-lede">{t.todos.loadingTodo}</p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>{isCreate ? t.todos.createTitle : t.todos.editTitle}</h1>
        <div className="page-header__actions">
          <button
            type="submit"
            form="todolist-form"
            className="btn"
            disabled={busy || (isCreate && officeLoading)}
          >
            {busy ? t.common.saving : t.common.save}
          </button>
          <Link className="btn btn--ghost" to="/todolist">
            {t.common.cancel}
          </Link>
        </div>
      </div>

      <form id="todolist-form" className="stack-form" onSubmit={onSave}>
        <label>
          {t.todos.name}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label>
          {t.todos.description}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </label>
        <OwnerSelect
          value={ownerId}
          onChange={setOwnerId}
          office={office}
          disabled={!isCreate || officeLoading}
        />
        {!isCreate ? (
          <label>
            {t.todos.status}
            <select
              value={status}
              onChange={(e) =>
                setStatus(Number(e.target.value) as TodoListStatus)
              }
            >
              {EDITABLE_TODO_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {todoListStatusLabel(option, t)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {error ? <p className="error">{error}</p> : null}
      </form>
    </section>
  );
}
