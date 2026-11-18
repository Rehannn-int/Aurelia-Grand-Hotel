import { useEffect, useState } from 'react';
import DataTable from '../../components/DataTable/DataTable';
import { adminApi } from '../../services/api';
import { formatDate } from '../../utils/format';

export default function GuestsPage() {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    adminApi.guests({ page, limit: 10, ...(appliedSearch ? { search: appliedSearch } : {}) })
      .then((response) => {
        if (!active) return;
        setRecords(response.data);
        setMeta(response.meta || { totalPages: 1 });
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [appliedSearch, page]);

  function apply(event) {
    event.preventDefault();
    setLoading(true);
    setPage(1);
    setAppliedSearch(search.trim());
  }

  const columns = [
    { key: 'name', label: 'Guest', render: (row) => <strong>{row.name}</strong> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'bookings', label: 'Reservations' },
    { key: 'lastStay', label: 'Latest departure', render: (row) => formatDate(row.lastStay) },
  ];

  return (
    <>
      <div className="page-heading"><div><h2>Guest directory</h2><p>Guest details are summarized from reservation records.</p></div></div>
      <form className="panel toolbar" onSubmit={apply}>
        <input className="field-control search-control" aria-label="Search guests" placeholder="Search name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
        <button className="btn btn-primary" type="submit">Search guests</button>
      </form>
      <DataTable columns={columns} rows={records} loading={loading} error={error} page={page} totalPages={meta.totalPages || 1} onPageChange={(nextPage) => { setLoading(true); setPage(nextPage); }} emptyMessage="No guest records match your search." getRowKey={(row) => row.id || row.email} />
    </>
  );
}
