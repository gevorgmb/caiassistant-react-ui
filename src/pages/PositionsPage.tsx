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
import { useI18n } from "../i18n/I18nContext.tsx";
import "../styles/ui.css";

export function PositionsPage() {
  const { office } = useAuth();
  const { t, fmt } = useI18n();
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
    if (!window.confirm(fmt(t.positions.confirmDelete, { name: position.name }))) {
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
        <h1>{t.positions.title}</h1>
        <p className="empty-state">
          {t.positions.needOffice}{" "}
          <Link to="/office">{t.common.goToOffice}</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>{t.positions.title}</h1>
        <div className="page-header__actions">
          <Link className="btn" to="/positions/new">
            {t.common.create}
          </Link>
        </div>
      </div>
      <p className="page-lede">{fmt(t.positions.lede, { name: office.name })}</p>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <p className="page-lede">{t.positions.loading}</p>
      ) : positions.length === 0 ? (
        <p className="empty-state">{t.positions.empty}</p>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.positions.name}</th>
                <th>{t.positions.actions}</th>
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
                        aria-label={`${t.common.edit} ${position.name}`}
                        title={t.common.edit}
                      >
                        <EditIcon />
                      </Link>
                      <button
                        type="button"
                        className="btn btn--sm btn--danger btn--icon"
                        disabled={busyId === position.id}
                        onClick={() => void onDelete(position)}
                        aria-label={`${t.common.delete} ${position.name}`}
                        title={t.common.delete}
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
