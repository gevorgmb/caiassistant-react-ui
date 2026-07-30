import { useEffect, useState, type SubmitEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.tsx";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import "../styles/ui.css";

export function PositionFormPage() {
  const { id } = useParams<{ id: string }>();
  const isCreate = id === undefined;
  const navigate = useNavigate();
  const { office } = useAuth();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(!isCreate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isCreate || !id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void officeClient
      .getOfficePosition({ id })
      .then((position) => {
        if (!cancelled) setName(position.name);
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
      const trimmed = name.trim();
      if (isCreate) {
        await officeClient.createOfficePosition({
          officeId: office.id,
          name: trimmed,
        });
      } else if (id) {
        await officeClient.updateOfficePosition({
          id,
          name: trimmed,
        });
      }
      navigate("/positions");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!office) {
    return (
      <section className="page">
        <h1>{isCreate ? "Create position" : "Edit position"}</h1>
        <p className="empty-state">
          You need an office before managing positions.{" "}
          <Link to="/office">Go to Office</Link>
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="page">
        <p className="page-lede">Loading position…</p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>{isCreate ? "Create position" : "Edit position"}</h1>
        <div className="page-header__actions">
          <button
            type="submit"
            form="position-form"
            className="btn"
            disabled={busy}
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <Link className="btn btn--ghost" to="/positions">
            Cancel
          </Link>
        </div>
      </div>

      <form id="position-form" className="stack-form" onSubmit={onSave}>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
      </form>
    </section>
  );
}
