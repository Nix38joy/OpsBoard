import { Link } from "react-router-dom";

export function AccessDeniedPage() {
  return (
    <div className="page center-page">
      <article className="card">
        <h1>Access denied</h1>
        <p>You do not have permission to open this page.</p>
        <Link className="btn" to="/dashboard">
          Go to dashboard
        </Link>
      </article>
    </div>
  );
}
