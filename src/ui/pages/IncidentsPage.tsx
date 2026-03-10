import { Link } from "react-router-dom";

const MOCK_INCIDENTS = [
  {
    id: "INC-1024",
    title: "Payments queue delay",
    severity: "high",
    status: "in_progress",
  },
  {
    id: "INC-1025",
    title: "Warehouse sync timeout",
    severity: "medium",
    status: "open",
  },
];

export function IncidentsPage() {
  return (
    <div className="page">
      <h1>Incidents</h1>
      <p>
        This is a temporary data view. In the next step we will plug in TanStack Query and a real
        list flow.
      </p>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Severity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_INCIDENTS.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link to={`/incidents/${item.id}`}>{item.id}</Link>
                </td>
                <td>{item.title}</td>
                <td>{item.severity}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
