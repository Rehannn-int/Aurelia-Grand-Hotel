import { useEffect, useState } from 'react';
import { BedDouble, CalendarCheck2, CircleDollarSign, UsersRound } from 'lucide-react';
import DataTable from '../../components/DataTable/DataTable';
import StatCard from '../../components/StatCard/StatCard';
import { adminApi } from '../../services/api';
import { formatDate, formatMoney, titleCase } from '../../utils/format';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    adminApi.dashboard()
      .then((result) => { if (active) setSummary(result.data); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);

  const revenue = summary?.revenueThisMonth || [];
  const columns = [
    { key: 'reference', label: 'Reservation' },
    { key: 'guest', label: 'Guest', render: (row) => row.guest?.name || 'Guest' },
    { key: 'stay', label: 'Stay', render: (row) => `${formatDate(row.checkIn)} – ${formatDate(row.checkOut)}` },
    { key: 'status', label: 'Status', render: (row) => <span className="status-pill">{titleCase(row.status)}</span> },
    { key: 'total', label: 'Total', render: (row) => formatMoney(row.pricing?.total, row.currency) },
  ];

  return (
    <>
      <div className="page-heading"><div><h2>Good day</h2><p>Here is the latest view of your hotel operation.</p></div></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {!summary && !error ? <div className="notice">Loading live dashboard data…</div> : summary && (
        <>
          <section className="stat-grid">
            <StatCard label="Active rooms" value={summary.totalRooms} caption={`${summary.operationalRooms} operational`} icon={BedDouble} />
            <StatCard label="Confirmed stays" value={summary.confirmedBookings} caption={`${summary.pendingBookings} pending holds`} icon={CalendarCheck2} />
            <StatCard label="Current occupancy" value={`${summary.occupancyRate}%`} caption={`${summary.occupiedRooms} occupied rooms`} icon={UsersRound} />
            <StatCard label="Net revenue this month" value={revenue.length ? formatMoney(revenue[0].amount, revenue[0].currency) : '—'} caption={revenue.length ? `${revenue[0].paymentCount} settled payments` : 'No settled payments'} icon={CircleDollarSign} />
          </section>
          <section className="page-section">
            <h3 className="section-heading">Recent reservations</h3>
            <DataTable columns={columns} rows={summary.recentBookings || []} loading={false} emptyMessage="No reservations have been recorded." />
          </section>
          <section className="stat-grid page-section">
            <StatCard label="Available today" value={summary.availableRooms} />
            <StatCard label="Arrivals today" value={summary.todaysArrivals} />
            <StatCard label="Departures today" value={summary.todaysDepartures} />
            <StatCard label="Operational rooms" value={summary.operationalRooms} />
          </section>
        </>
      )}
    </>
  );
}
