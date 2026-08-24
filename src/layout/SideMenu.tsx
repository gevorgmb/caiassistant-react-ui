import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.tsx";
import { useI18n } from "../i18n/I18nContext.tsx";
import "./SideMenu.css";

export function SideMenu() {
  const { office } = useAuth();
  const { t } = useI18n();

  return (
    <nav className="side-menu" aria-label={t.nav.main}>
      <ul>
        <li>
          <NavLink
            to="/ai-assistant"
            className={({ isActive }) =>
              isActive ? "side-menu__link active" : "side-menu__link"
            }
          >
            {t.nav.aiAssistant}
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/schedule"
            className={({ isActive }) =>
              isActive ? "side-menu__link active" : "side-menu__link"
            }
          >
            {t.nav.schedule}
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/todolist"
            className={({ isActive }) =>
              isActive ? "side-menu__link active" : "side-menu__link"
            }
          >
            {t.nav.todoList}
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/office"
            className={({ isActive }) =>
              isActive ? "side-menu__link active" : "side-menu__link"
            }
          >
            {t.nav.office}
          </NavLink>
        </li>
        {office ? (
          <>
            <li>
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  isActive ? "side-menu__link active" : "side-menu__link"
                }
              >
                {t.nav.users}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/positions"
                className={({ isActive }) =>
                  isActive ? "side-menu__link active" : "side-menu__link"
                }
              >
                {t.nav.positions}
              </NavLink>
            </li>
          </>
        ) : null}
        <li>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? "side-menu__link active" : "side-menu__link"
            }
          >
            {t.nav.settings}
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
