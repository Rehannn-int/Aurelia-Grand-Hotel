import './StatCard.css';

export default function StatCard({ label, value, caption, icon: Icon }) {
  return (
    <article className="stat-card">
      <div className="stat-card-top"><span>{label}</span>{Icon && <span className="stat-icon"><Icon size={17} /></span>}</div>
      <strong>{value}</strong>
      {caption && <small>{caption}</small>}
    </article>
  );
}
