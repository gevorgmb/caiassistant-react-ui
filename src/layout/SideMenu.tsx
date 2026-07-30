import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.tsx";
import "./SideMenu.css";

export function SideMenu() {
  const { office } = useAuth();

  return (
    <nav className="side-menu" aria-label="Main">
      <ul>
        <li>
          <NavLink
            to="/office"
            className={({ isActive }) =>
              isActive ? "side-menu__link active" : "side-menu__link"
            }
          >
            Office
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
                Users
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/positions"
                className={({ isActive }) =>
                  isActive ? "side-menu__link active" : "side-menu__link"
                }
              >
                Positions
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
            Settings
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
