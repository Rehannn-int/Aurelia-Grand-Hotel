import { ChevronLeft, ChevronRight } from 'lucide-react';
import './DataTable.css';

export default function DataTable({
  columns, rows, loading, error, page = 1, totalPages = 1, onPageChange, emptyMessage = 'No records found.',
  getRowKey = (row) => row._id,
}) {
  return (
    <div className="table-card">
      {error && <div className="inline-error" role="alert">{error}</div>}
      <div className="table-scroll">
        <table className="admin-table">
          <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td className="table-state" colSpan={columns.length}>Loading records…</td></tr>
              : rows.length ? rows.map((row) => (
                <tr key={getRowKey(row)}>
                  {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}
                </tr>
              ))
                : <tr><td className="table-state" colSpan={columns.length}>{emptyMessage}</td></tr>}
          </tbody>
        </table>
      </div>
      {onPageChange && totalPages > 1 && (
        <footer className="table-pagination">
          <span>Page {page} of {totalPages}</span>
          <div>
            <button type="button" aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}><ChevronLeft size={16} /></button>
            <button type="button" aria-label="Next page" disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)}><ChevronRight size={16} /></button>
          </div>
        </footer>
      )}
    </div>
  );
}
