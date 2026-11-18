import { useCallback, useEffect, useState } from 'react';
import DataTable from '../../components/DataTable/DataTable';
import { adminApi } from '../../services/api';
import { formatDate, formatMoney, titleCase } from '../../utils/format';

export default function PaymentsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.payments({ page, limit: 10, ...(status ? { status } : {}) });
      setRecords(response.data);
      setMeta(response.meta || { totalPages: 1 });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    let active = true;
    adminApi.payments({ page, limit: 10, ...(status ? { status } : {}) })
      .then((response) => {
        if (!active) return;
        setRecords(response.data);
        setMeta(response.meta || { totalPages: 1 });
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, status]);

  async function refund(payment) {
    if (!window.confirm(`Submit a full refund for payment ${payment._id}? The final state is confirmed by the payment provider webhook.`)) return;
    setPending(payment._id);
    setError('');
    setNotice('');
    try {
      const response = await adminApi.refund(payment._id);
      setNotice(response.message);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending('');
    }
  }

  const columns = [
    { key: 'booking', label: 'Reservation', render: (row) => row.booking?.reference || '—' },
    { key: 'customer', label: 'Guest', render: (row) => <><strong>{row.customer?.name || 'Guest'}</strong><small className="cell-subtext">{row.customer?.email}</small></> },
    { key: 'provider', label: 'Provider' },
    { key: 'status', label: 'Status', render: (row) => <span className="status-pill">{titleCase(row.status)}</span> },
    { key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount, row.currency) },
    { key: 'refunded', label: 'Refunded', render: (row) => formatMoney(row.refundedAmount, row.currency) },
    { key: 'createdAt', label: 'Created', render: (row) => formatDate(row.createdAt) },
    { key: 'action', label: 'Action', render: (row) => ['succeeded', 'partially_refunded'].includes(row.status) ? <button className="button-link danger-link" type="button" disabled={pending === row._id} onClick={() => void refund(row)}>{pending === row._id ? 'Submitting…' : 'Refund remaining'}</button> : <span className="cell-subtext">—</span> },
  ];

  return (
    <>
      <div className="page-heading"><div><h2>Payment history</h2><p>Payment records are synchronized with the payment provider. Refund completion follows its verified webhook.</p></div></div>
      {notice && <div className="inline-success" role="status">{notice}</div>}
      <div className="toolbar">
        <select className="field-control" aria-label="Filter payments by status" value={status} onChange={(event) => { setLoading(true); setPage(1); setStatus(event.target.value); }}>
          <option value="">All payment statuses</option>{['pending', 'succeeded', 'failed', 'partially_refunded', 'refunded'].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}
        </select>
      </div>
      <DataTable columns={columns} rows={records} loading={loading} error={error} page={page} totalPages={meta.totalPages || 1} onPageChange={(nextPage) => { setLoading(true); setPage(nextPage); }} emptyMessage="No payment records match this filter." />
    </>
  );
}
