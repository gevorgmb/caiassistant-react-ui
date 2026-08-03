import { useEffect, useState, type SubmitEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TodoListStatus } from "../gen/common/v1/office_pb.js";
import { useAuth } from "../auth/AuthContext.tsx";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import { EDITABLE_TODO_STATUSES } from "../lib/todoListStatus.ts";
import "../styles/ui.css";

export function TodoListFormPage() {
  const { id } = useParams<{ id: string }>();
  const isCreate = id === undefined;
  const navigate = useNavigate();
  const { office } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TodoListStatus>(TodoListStatus.PENDING);
  const [loading, setLoading] = useState(!isCreate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!office) return;
    setBusy(true);
    setError(null);
    try {
      const trimmedName = name.trim();
      const trimmedDescription = description.trim();
      if (isCreate) {
        await officeClient.createTodoList({
          officeId: office.id,
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

  if (!office) {
    return (
      <section className="page">
        <h1>{isCreate ? "Create todo" : "Edit todo"}</h1>
        <p className="empty-state">
          You need an office before managing todos.{" "}
          <Link to="/office">Go to Office</Link>
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="page">
        <p className="page-lede">Loading todo…</p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>{isCreate ? "Create todo" : "Edit todo"}</h1>
        <div className="page-header__actions">
          <button
            type="submit"
            form="todolist-form"
            className="btn"
            disabled={busy}
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <Link className="btn btn--ghost" to="/todolist">
            Cancel
          </Link>
        </div>
      </div>

      <form id="todolist-form" className="stack-form" onSubmit={onSave}>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </label>
        {!isCreate ? (
          <label>
            Status
            <select
              value={status}
              onChange={(e) =>
                setStatus(Number(e.target.value) as TodoListStatus)
              }
            >
              {EDITABLE_TODO_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
