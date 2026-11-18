import { useCallback, useEffect, useState } from 'react';
import DataTable from '../../components/DataTable/DataTable';
import { adminApi } from '../../services/api';
import { formatDate, formatMoney, titleCase } from '../../utils/format';

const transitions = {
  pending: ['cancelled', 'no_show'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['checked_out'],
  checked_out: [],
  cancelled: [],
  no_show: [],
};

export default function ReservationsPage() {
  const [filters, setFilters] = useState({ search: '', status: '', startDate: '', endDate: '' });
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10, sort: '-createdAt' };
      Object.entries(applied).forEach(([key, value]) => { if (value) params[key] = value; });
      const response = await adminApi.bookings(params);
      setRecords(response.data);
      setMeta(response.meta || { totalPages: 1 });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    let active = true;
    const params = { page, limit: 10, sort: '-createdAt' };
    Object.entries(applied).forEach(([key, value]) => { if (value) params[key] = value; });
    adminApi.bookings(params)
      .then((response) => {
        if (!active) return;
        setRecords(response.data);
        setMeta(response.meta || { totalPages: 1 });
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applied, page]);

  async function changeStatus(booking, status) {
    if (!status) return;
    setNotice('');
    try {
      const response = await adminApi.updateBookingStatus(booking._id, status);
      setNotice(response.message || 'Reservation status updated.');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const columns = [
    { key: 'reference', label: 'Reference', render: (row) => <strong>{row.reference}</strong> },
    { key: 'guest', label: 'Guest', render: (row) => <><strong>{row.guest?.name}</strong><small className="cell-subtext">{row.guest?.email}</small></> },
    { key: 'category', label: 'Room / category', render: (row) => row.category?.name || row.rooms?.map((room) => room.roomNumber).join(', ') || '—' },
    { key: 'stay', label: 'Stay', render: (row) => <>{formatDate(row.checkIn)}<small className="cell-subtext">to {formatDate(row.checkOut)}</small></> },
    { key: 'status', label: 'Status', render: (row) => <span className="status-pill">{titleCase(row.status)}</span> },
    { key: 'total', label: 'Total', render: (row) => formatMoney(row.pricing?.total, row.currency) },
    { key: 'actions', label: 'Update', render: (row) => (
      transitions[row.status]?.length
        ? <select aria-label={`Update ${row.reference}`} className="field-control table-select" defaultValue="" onChange={(event) => void changeStatus(row, event.target.value)}>
          <option value="">Change status</option>{transitions[row.status].map((status) => <option value={status} key={status}>{titleCase(status)}</option>)}
        </select>
        : <span className="cell-subtext">—</span>
    ) },
  ];

  function applyFilters(event) {
    event.preventDefault();
    setLoading(true);
    setPage(1);
    setApplied(filters);
  }

  return (
    <>
      <div className="page-heading"><div><h2>Reservations</h2><p>Review stays and process permitted status changes.</p></div></div>
      <form className="panel toolbar" onSubmit={applyFilters}>
        <div className="toolbar-group">
          <input className="field-control search-control" placeholder="Search reference or guest" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          <select className="field-control" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">All statuses</option>{['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'].map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
          </select>
          <input className="field-control" aria-label="Arrival from" type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} />
          <input className="field-control" aria-label="Arrival to" type="date" value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} />
        </div>
        <button className="btn btn-primary" type="submit">Apply filters</button>
      </form>
      {notice && <div role="status" className="inline-success">{notice}</div>}
      <DataTable columns={columns} rows={records} loading={loading} error={error} page={page} totalPages={meta.totalPages || 1} onPageChange={(nextPage) => { setLoading(true); setPage(nextPage); }} emptyMessage="No reservations match these filters." />
    </>
  );
}
