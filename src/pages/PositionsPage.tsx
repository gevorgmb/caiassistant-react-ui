import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { OfficePosition } from "../gen/common/v1/office_pb.js";
import { useAuth } from "../auth/AuthContext.tsx";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import {
  DeleteIcon,
  EditIcon,
  SpinnerIcon,
} from "../components/ActionIcons.tsx";
import "../styles/ui.css";

export function PositionsPage() {
  const { office } = useAuth();
  const [positions, setPositions] = useState<OfficePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!office) return;
    setLoading(true);
    setError(null);
    try {
      const res = await officeClient.listOfficePositions({
        officeId: office.id,
      });
      setPositions(res.positions);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [office]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(position: OfficePosition) {
    if (!window.confirm(`Delete position "${position.name}"?`)) {
      return;
    }
    setBusyId(position.id);
    setError(null);
    try {
      await officeClient.deleteOfficePosition({ id: position.id });
      setPositions((prev) => prev.filter((p) => p.id !== position.id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  if (!office) {
    return (
      <section className="page">
        <h1>Positions</h1>
        <p className="empty-state">
          You need an office before managing positions.{" "}
          <Link to="/office">Go to Office</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>Positions</h1>
        <div className="page-header__actions">
          <Link className="btn" to="/positions/new">
            Create
          </Link>
        </div>
      </div>
      <p className="page-lede">Positions for {office.name}.</p>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <p className="page-lede">Loading positions…</p>
      ) : positions.length === 0 ? (
        <p className="empty-state">No positions yet.</p>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.id}>
                  <td>{position.name}</td>
                  <td>
                    <div className="data-table__actions">
                      <Link
                        className="btn btn--sm btn--ghost btn--icon"
                        to={`/positions/${position.id}`}
                        aria-label={`Edit ${position.name}`}
                        title="Edit"
                      >
                        <EditIcon />
                      </Link>
                      <button
                        type="button"
                        className="btn btn--sm btn--danger btn--icon"
                        disabled={busyId === position.id}
                        onClick={() => void onDelete(position)}
                        aria-label={`Delete ${position.name}`}
                        title="Delete"
                      >
                        {busyId === position.id ? (
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
      )}
    </section>
  );
}
