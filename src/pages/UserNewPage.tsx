import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { OfficePosition } from "../gen/common/v1/office_pb.js";
import type { User } from "../gen/common/v1/user_pb.js";
import { useAuth } from "../auth/AuthContext.tsx";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import { AddIcon } from "../components/ActionIcons.tsx";
import { AddOfficeUserModal } from "../components/AddOfficeUserModal.tsx";
import "../styles/ui.css";

const PAGE_SIZE = 10;

export function UserNewPage() {
  const { office } = useAuth();
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [positions, setPositions] = useState<OfficePosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchText.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    if (!office) return;
    void officeClient
      .listOfficePositions({ officeId: office.id })
      .then((res) => setPositions(res.positions))
      .catch((err) => setError(errorMessage(err)));
  }, [office]);

  const search = useCallback(async () => {
    if (!office) return;
    setLoading(true);
    setError(null);
    try {
      const res = await officeClient.searchUsers({
        searchText: debouncedSearch,
        page,
        pageSize: PAGE_SIZE,
      });
      setUsers(res.users);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(errorMessage(err));
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [office, debouncedSearch, page]);

  useEffect(() => {
    void search();
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (!office) {
    return (
      <section className="page">
        <h1>New user</h1>
        <p className="empty-state">
          You need an office before adding users.{" "}
          <Link to="/office">Go to Office</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>New user</h1>
        <div className="page-header__actions">
          <Link className="btn btn--ghost" to="/users">
            Cancel
          </Link>
        </div>
      </div>

      <p className="page-lede">
        Search users without an office membership, then add one to{" "}
        {office.name}.
      </p>

      <label className="search-field">
        Search
        <input
          type="search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Name or email"
          autoFocus
        />
      </label>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <p className="page-lede">Searching…</p>
      ) : users.length === 0 ? (
        <p className="empty-state">No users found.</p>
      ) : (
        <>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name || "—"}</td>
                    <td>{user.email || "—"}</td>
                    <td>
                      <div className="data-table__actions">
                        <button
                          type="button"
                          className="btn btn--sm btn--ghost btn--icon"
                          onClick={() => setSelectedUser(user)}
                          aria-label={`Add ${user.name || user.email}`}
                          title="Add"
                        >
                          <AddIcon />
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

      {selectedUser ? (
        <AddOfficeUserModal
          officeId={office.id}
          user={selectedUser}
          positions={positions}
          onClose={() => setSelectedUser(null)}
          onSaved={() => navigate("/users")}
        />
      ) : null}
    </section>
  );
}
