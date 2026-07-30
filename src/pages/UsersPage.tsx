import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { OfficePosition, OfficeUser } from "../gen/common/v1/office_pb.js";
import { useAuth } from "../auth/AuthContext.tsx";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import { roleLabel } from "../lib/roles.ts";
import {
  DeleteIcon,
  EditIcon,
  SpinnerIcon,
} from "../components/ActionIcons.tsx";
import "../styles/ui.css";

export function UsersPage() {
  const { office } = useAuth();
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
    if (!window.confirm("Remove this office user?")) {
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
    if (!positionId) return "—";
    return positions.find((p) => p.id === positionId)?.name ?? positionId;
  }

  if (!office) {
    return (
      <section className="page">
        <h1>Users</h1>
        <p className="empty-state">
          You need an office before managing users.{" "}
          <Link to="/office">Go to Office</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>Users</h1>
        <div className="page-header__actions">
          <Link className="btn" to="/users/new">
            New User
          </Link>
        </div>
      </div>
      <p className="page-lede">Office members for {office.name}.</p>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <p className="page-lede">Loading users…</p>
      ) : users.length === 0 ? (
        <p className="empty-state">No office users yet.</p>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Position</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{roleLabel(user.role)}</td>
                  <td>{positionName(user.positionId)}</td>
                  <td>{user.isActive ? "Yes" : "No"}</td>
                  <td>
                    <div className="data-table__actions">
                      <Link
                        className="btn btn--sm btn--ghost btn--icon"
                        to={`/users/${user.id}`}
                        aria-label="Edit user"
                        title="Edit"
                      >
                        <EditIcon />
                      </Link>
                      <button
                        type="button"
                        className="btn btn--sm btn--danger btn--icon"
                        disabled={busyId === user.id}
                        onClick={() => void onDelete(user)}
                        aria-label="Delete user"
                        title="Delete"
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
