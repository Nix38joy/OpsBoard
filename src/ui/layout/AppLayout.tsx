import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n/useI18n";
import { canCreateIncident } from "../../domain/permissions";
import { useAuthStore } from "../../state/authStore";
import { useUiSettingsStore } from "../../state/uiSettingsStore";

export function AppLayout() {
  const role = useAuthStore((state) => state.role);
  const userName = useAuthStore((state) => state.userName);
  const logout = useAuthStore((state) => state.logout);
  const autoRefreshEnabled = useUiSettingsStore((state) => state.autoRefreshEnabled);
  const setAutoRefreshEnabled = useUiSettingsStore((state) => state.setAutoRefreshEnabled);
  const { language, setLanguage, t } = useI18n();
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
          <label className="checkbox-row">
            <span>{t("navLanguage")}</span>
            <select
              className="input language-select"
              value={language}
              onChange={(event) => setLanguage(event.target.value as "en" | "ru")}
            >
              <option value="en">EN</option>
              <option value="ru">RU</option>
            </select>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(event) => setAutoRefreshEnabled(event.target.checked)}
            />
            <span>{t("navAutoRefresh")}</span>
          </label>
          <span className="badge">
            {t("navRole")}: {role}
          </span>
          <span>{userName}</span>
          <button className="btn ghost" type="button" onClick={handleLogout}>
            {t("navLogout")}
          </button>
        </div>
      </header>

      <div className="content-shell">
        <aside className="sidebar">
          <NavLink className="nav-item" to="/dashboard">
            {t("navDashboard")}
          </NavLink>
          <NavLink className="nav-item" to="/incidents">
            {t("navIncidents")}
          </NavLink>
          {canCreateIncident(role) && (
            <NavLink className="nav-item" to="/incidents/new">
              {t("navCreateIncident")}
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
