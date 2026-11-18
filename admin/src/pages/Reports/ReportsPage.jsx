import { useEffect, useState } from 'react';
import DataTable from '../../components/DataTable/DataTable';
import { adminApi } from '../../services/api';
import { formatDate, formatMoney, titleCase } from '../../utils/format';

export default function ReportsPage() {
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [applied, setApplied] = useState(filters);
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reservationMeta, setReservationMeta] = useState({ totalPages: 1 });
  const [paymentMeta, setPaymentMeta] = useState({ totalPages: 1 });
  const [reservationPage, setReservationPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const params = { ...Object.fromEntries(Object.entries(applied).filter(([, value]) => value)), limit: 10 };
    Promise.all([
      adminApi.reservationReport({ ...params, page: reservationPage }),
      adminApi.revenueReport({ ...params, page: paymentPage }),
    ]).then(([bookingResponse, paymentResponse]) => {
      if (!active) return;
      setReservations(bookingResponse.data);
      setReservationMeta(bookingResponse.meta || { totalPages: 1 });
      setPayments(paymentResponse.data);
      setPaymentMeta(paymentResponse.meta || { totalPages: 1 });
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [applied, paymentPage, reservationPage]);

  function submit(event) {
    event.preventDefault();
    setLoading(true);
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      setError('End date must be on or after the start date.');
      return;
    }
    setReservationPage(1);
    setPaymentPage(1);
    setError('');
    setApplied(filters);
  }

  const bookingColumns = [
    { key: 'reference', label: 'Reference', render: (row) => <strong>{row.reference}</strong> },
    { key: 'guest', label: 'Guest', render: (row) => row.guest?.name || '—' },
    { key: 'category', label: 'Category', render: (row) => row.category?.name || '—' },
    { key: 'checkIn', label: 'Check-in', render: (row) => formatDate(row.checkIn) },
    { key: 'checkOut', label: 'Check-out', render: (row) => formatDate(row.checkOut) },
    { key: 'status', label: 'Status', render: (row) => titleCase(row.status) },
    { key: 'total', label: 'Total', render: (row) => formatMoney(row.pricing?.total, row.currency) },
  ];
  const paymentColumns = [
    { key: 'booking', label: 'Reservation', render: (row) => row.booking?.reference || '—' },
    { key: 'status', label: 'Payment', render: (row) => titleCase(row.status) },
    { key: 'amount', label: 'Paid', render: (row) => formatMoney(row.amount, row.currency) },
    { key: 'refundedAmount', label: 'Refunded', render: (row) => formatMoney(row.refundedAmount, row.currency) },
    { key: 'netAmount', label: 'Net', render: (row) => formatMoney(row.netAmount, row.currency) },
    { key: 'createdAt', label: 'Date', render: (row) => formatDate(row.createdAt) },
  ];

  return (
    <>
      <div className="page-heading"><div><h2>Reports</h2><p>Reservation and settled-revenue records from the hotel database.</p></div></div>
      <form className="panel toolbar" onSubmit={submit}>
        <div className="toolbar-group"><label className="date-filter">From<input className="field-control" type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} /></label><label className="date-filter">Through<input className="field-control" type="date" value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} /></label></div>
        <button className="btn btn-primary" type="submit">Apply date range</button>
      </form>
      {error && <div className="form-error page-section" role="alert">{error}</div>}
      <section className="page-section"><h3 className="section-heading">Reservations</h3><DataTable columns={bookingColumns} rows={reservations} loading={loading} error={error} page={reservationPage} totalPages={reservationMeta.totalPages || 1} onPageChange={(nextPage) => { setLoading(true); setReservationPage(nextPage); }} emptyMessage="No reservations for the selected dates." /></section>
      <section className="page-section"><h3 className="section-heading">Revenue</h3><DataTable columns={paymentColumns} rows={payments} loading={loading} error={error} page={paymentPage} totalPages={paymentMeta.totalPages || 1} onPageChange={(nextPage) => { setLoading(true); setPaymentPage(nextPage); }} emptyMessage="No settled payments for the selected dates." /></section>
    </>
  );
}
