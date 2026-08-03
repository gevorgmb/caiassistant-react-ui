import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { TodoList } from "../gen/common/v1/office_pb.js";
import { useAuth } from "../auth/AuthContext.tsx";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import { todoListStatusLabel } from "../lib/todoListStatus.ts";
import {
  DeleteIcon,
  EditIcon,
  SpinnerIcon,
} from "../components/ActionIcons.tsx";
import "../styles/ui.css";

const PAGE_SIZE = 10;

export function TodoListPage() {
  const { office } = useAuth();
  const [items, setItems] = useState<TodoList[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!office) return;
    setLoading(true);
    setError(null);
    try {
      const res = await officeClient.listTodoLists({
        officeId: office.id,
      });
      setItems(res.todoLists);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [office]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  async function onDelete(item: TodoList) {
    if (!window.confirm(`Delete todo "${item.name}"?`)) {
      return;
    }
    setBusyId(item.id);
    setError(null);
    try {
      await officeClient.deleteTodoList({ id: item.id });
      setItems((prev) => prev.filter((t) => t.id !== item.id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  if (!office) {
    return (
      <section className="page">
        <h1>ToDo List</h1>
        <p className="empty-state">
          You need an office before managing todos.{" "}
          <Link to="/office">Go to Office</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>ToDo List</h1>
        <div className="page-header__actions">
          <Link className="btn" to="/todolist/new">
            Create
          </Link>
        </div>
      </div>
      <p className="page-lede">Todos for {office.name}.</p>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <p className="page-lede">Loading todos…</p>
      ) : items.length === 0 ? (
        <p className="empty-state">No todos yet.</p>
      ) : (
        <>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.description || "—"}</td>
                    <td>{todoListStatusLabel(item.status)}</td>
                    <td>
                      <div className="data-table__actions">
                        <Link
                          className="btn btn--sm btn--ghost btn--icon"
                          to={`/todolist/${item.id}`}
                          aria-label={`Edit ${item.name}`}
                          title="Edit"
                        >
                          <EditIcon />
                        </Link>
                        <button
                          type="button"
                          className="btn btn--sm btn--danger btn--icon"
                          disabled={busyId === item.id}
                          onClick={() => void onDelete(item)}
                          aria-label={`Delete ${item.name}`}
                          title="Delete"
                        >
                          {busyId === item.id ? (
                            <SpinnerIcon />
                          ) : (
                            <DeleteIcon />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
              Previous
            </button>
            <span className="pagination__info">
              Page {page} of {totalPages} ({totalCount} total)
            </span>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
