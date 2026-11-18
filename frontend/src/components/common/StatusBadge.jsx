function StatusBadge({ status, variant = 'neutral' }) {
  return <span className={`status-badge status-${variant}`}>{status}</span>;
}

export default StatusBadge;
