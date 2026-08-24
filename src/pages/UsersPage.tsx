import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { OfficePosition, OfficeUser } from "../gen/common/v1/office_pb.js";
import { useAuth } from "../auth/AuthContext.tsx";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import { roleLabel } from "../lib/roles.ts";
import { useI18n } from "../i18n/I18nContext.tsx";
import {
  DeleteIcon,
  EditIcon,
  SpinnerIcon,
} from "../components/ActionIcons.tsx";
import "../styles/ui.css";

export function UsersPage() {
  const { office } = useAuth();
  const { t, fmt } = useI18n();
  const [users, setUsers] = useState<OfficeUser[]>([]);
  const [positions, setPositions] = useState<OfficePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!office) return;
    setLoading(true);
    setError(null);
    try {
      const [usersRes, positionsRes] = await Promise.all([
        officeClient.listOfficeUsers({ officeId: office.id }),
        officeClient.listOfficePositions({ officeId: office.id }),
      ]);
      setUsers(usersRes.officeUsers);
      setPositions(positionsRes.positions);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [office]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(user: OfficeUser) {
    if (!window.confirm(t.users.confirmRemove)) {
      return;
    }
    setBusyId(user.id);
    setError(null);
    try {
      await officeClient.deleteOfficeUser({ id: user.id });
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function positionName(positionId?: string): string {
    if (!positionId) return t.common.empty;
    return positions.find((p) => p.id === positionId)?.name ?? positionId;
  }

  if (!office) {
    return (
      <section className="page">
        <h1>{t.users.title}</h1>
        <p className="empty-state">
          {t.users.needOffice}{" "}
          <Link to="/office">{t.common.goToOffice}</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>{t.users.title}</h1>
        <div className="page-header__actions">
          <Link className="btn" to="/users/new">
            {t.users.newUser}
          </Link>
        </div>
      </div>
      <p className="page-lede">
        {fmt(t.users.officeMembers, { name: office.name })}
      </p>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <p className="page-lede">{t.users.loading}</p>
      ) : users.length === 0 ? (
        <p className="empty-state">{t.users.empty}</p>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.users.role}</th>
                <th>{t.users.position}</th>
                <th>{t.users.active}</th>
                <th>{t.users.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{roleLabel(user.role, t)}</td>
                  <td>{positionName(user.positionId)}</td>
                  <td>{user.isActive ? t.common.yes : t.common.no}</td>
                  <td>
                    <div className="data-table__actions">
                      <Link
                        className="btn btn--sm btn--ghost btn--icon"
                        to={`/users/${user.id}`}
                        aria-label={t.users.editUser}
                        title={t.common.edit}
                      >
                        <EditIcon />
                      </Link>
                      <button
                        type="button"
                        className="btn btn--sm btn--danger btn--icon"
                        disabled={busyId === user.id}
                        onClick={() => void onDelete(user)}
                        aria-label={t.users.deleteUser}
                        title={t.common.delete}
                      >
                        {busyId === user.id ? <SpinnerIcon /> : <DeleteIcon />}
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
