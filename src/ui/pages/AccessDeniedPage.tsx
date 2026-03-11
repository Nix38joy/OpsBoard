import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/useI18n";

export function AccessDeniedPage() {
  const { t } = useI18n();
  return (
    <div className="page center-page">
      <article className="card">
        <h1>{t("accessDeniedTitle")}</h1>
        <p>{t("accessDeniedSubtitle")}</p>
        <Link className="btn" to="/dashboard">
          {t("commonGoToDashboard")}
        </Link>
      </article>
    </div>
  );
}
