import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { canCreateIncident } from "../../domain/permissions";
import { useAuthStore } from "../../state/authStore";

export function AppLayout() {
  const role = useAuthStore((state) => state.role);
  const userName = useAuthStore((state) => state.userName);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/dashboard">
          OpsBoard
        </Link>
        <div className="topbar-right">
          <span className="badge">role: {role}</span>
          <span>{userName}</span>
          <button className="btn ghost" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="content-shell">
        <aside className="sidebar">
          <NavLink className="nav-item" to="/dashboard">
            Dashboard
          </NavLink>
          <NavLink className="nav-item" to="/incidents">
            Incidents
          </NavLink>
          {canCreateIncident(role) && (
            <NavLink className="nav-item" to="/incidents/new">
              Create Incident
            </NavLink>
          )}
        </aside>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
