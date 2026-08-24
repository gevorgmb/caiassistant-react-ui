import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { OfficePosition } from "../gen/common/v1/office_pb.js";
import type { User } from "../gen/common/v1/user_pb.js";
import { useAuth } from "../auth/AuthContext.tsx";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import { AddIcon } from "../components/ActionIcons.tsx";
import { AddOfficeUserModal } from "../components/AddOfficeUserModal.tsx";
import { useI18n } from "../i18n/I18nContext.tsx";
import "../styles/ui.css";

const PAGE_SIZE = 10;

export function UserNewPage() {
  const { office } = useAuth();
  const { t, fmt } = useI18n();
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
        <h1>{t.users.newTitle}</h1>
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
        <h1>{t.users.newTitle}</h1>
        <div className="page-header__actions">
          <Link className="btn btn--ghost" to="/users">
            {t.common.cancel}
          </Link>
        </div>
      </div>

      <p className="page-lede">
        {fmt(t.users.searchLede, { name: office.name })}
      </p>

      <label className="search-field">
        {t.users.search}
        <input
          type="search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder={t.users.searchPlaceholder}
          autoFocus
        />
      </label>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <p className="page-lede">{t.users.searching}</p>
      ) : users.length === 0 ? (
        <p className="empty-state">{t.users.noUsersFound}</p>
      ) : (
        <>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.users.name}</th>
                  <th>{t.users.email}</th>
                  <th>{t.users.actions}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name || t.common.empty}</td>
                    <td>{user.email || t.common.empty}</td>
                    <td>
                      <div className="data-table__actions">
                        <button
                          type="button"
                          className="btn btn--sm btn--ghost btn--icon"
                          onClick={() => setSelectedUser(user)}
                          aria-label={fmt(t.users.addUserAria, {
                            name: user.name || user.email,
                          })}
                          title={t.users.addUser}
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
