export function DashboardPage() {
  const metrics = [
    { title: "Open", value: 14 },
    { title: "Overdue", value: 3 },
    { title: "Resolved (7d)", value: 22 },
    { title: "MTTR", value: "4h 20m" },
  ];

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p>Baseline KPI panel for MVP. Real API integration comes next.</p>
      <div className="metrics-grid">
        {metrics.map((metric) => (
          <article className="card metric-card" key={metric.title}>
            <h2>{metric.title}</h2>
            <p>{metric.value}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
