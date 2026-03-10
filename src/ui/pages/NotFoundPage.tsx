import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="page center-page">
      <article className="card">
        <h1>Page not found</h1>
        <p>The requested route does not exist.</p>
        <Link className="btn" to="/dashboard">
          Go to dashboard
        </Link>
      </article>
    </div>
  );
}
