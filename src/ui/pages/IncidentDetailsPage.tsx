import { Link, useParams } from "react-router-dom";

export function IncidentDetailsPage() {
  const { incidentId } = useParams();

  return (
    <div className="page">
      <h1>Incident Details</h1>
      <p>
        Incident ID: <strong>{incidentId}</strong>
      </p>
      <section className="card">
        <h2>Summary</h2>
        <p>Temporary details screen. Next iterations will add status transitions and comments.</p>
      </section>
      <Link className="btn ghost" to="/incidents">
        Back to incidents
      </Link>
    </div>
  );
}
