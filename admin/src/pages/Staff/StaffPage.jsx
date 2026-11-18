import { useCallback, useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import DataTable from '../../components/DataTable/DataTable';
import { adminApi } from '../../services/api';
import { formatDate } from '../../utils/format';

const emptyForm = { name: '', email: '', password: '', phone: '', role: 'receptionist' };

export default function StaffPage() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.staff({ page, limit: 10, ...(appliedSearch ? { search: appliedSearch } : {}) });
      setRecords(response.data);
      setMeta(response.meta || { totalPages: 1 });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, page]);

  useEffect(() => {
    let active = true;
    adminApi.staff({ page, limit: 10, ...(appliedSearch ? { search: appliedSearch } : {}) })
      .then((response) => {
        if (!active) return;
        setRecords(response.data);
        setMeta(response.meta || { totalPages: 1 });
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [appliedSearch, page]);

  async function create(event) {
    event.preventDefault();
    setLoading(true);
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await adminApi.createStaff({ ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() });
      setNotice(response.message);
      setForm(emptyForm);
      setPage(1);
      setAppliedSearch('');
      setSearch('');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(staff) {
    setError('');
    setNotice('');
    try {
      const response = await adminApi.updateStaff(staff._id, { isActive: !staff.isActive });
      setNotice(response.message);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function changeRole(staff, role) {
    if (!role || role === staff.role) return;
    setError('');
    setNotice('');
    try {
      const response = await adminApi.updateStaff(staff._id, { role });
      setNotice(response.message);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const columns = [
    { key: 'name', label: 'Team member', render: (row) => <><strong>{row.name}</strong><small className="cell-subtext">{row.email}</small></> },
    { key: 'role', label: 'Role', render: (row) => row.role === 'housekeeping_staff'
      ? <span className="status-pill warning">Housekeeping · no admin access</span>
      : <select aria-label={`Role for ${row.name}`} className="field-control table-select" value={row.role} onChange={(event) => void changeRole(row, event.target.value)}><option value="hotel_manager">Hotel manager</option><option value="receptionist">Receptionist</option></select> },
    { key: 'phone', label: 'Phone' },
    { key: 'lastLoginAt', label: 'Last sign in', render: (row) => formatDate(row.lastLoginAt) },
    { key: 'isActive', label: 'Account', render: (row) => <span className={`status-pill${row.isActive ? '' : ' danger'}`}>{row.isActive ? 'Active' : 'Disabled'}</span> },
    { key: 'action', label: 'Action', render: (row) => <button type="button" className={row.isActive ? 'button-link danger-link' : 'button-link'} onClick={() => void toggleActive(row)}>{row.isActive ? 'Disable' : 'Enable'}</button> },
  ];

  return (
    <>
      <div className="page-heading"><div><h2>Staff access</h2><p>Create manager and receptionist accounts. Super administrator accounts are provisioned separately; housekeeping operations are not part of this panel.</p></div></div>
      {notice && <div className="inline-success" role="status">{notice}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <section className="panel">
        <h3 className="section-heading">Create staff account</h3>
        <form className="form-grid" onSubmit={create}>
          <label className="form-field">Full name<input className="field-control" required minLength="2" maxLength="120" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label className="form-field">Email<input className="field-control" type="email" required maxLength="254" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label className="form-field">Temporary password<input className="field-control" type="password" required minLength="12" maxLength="128" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <label className="form-field">Phone<input className="field-control" maxLength="30" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
          <label className="form-field">Role<select className="field-control" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="hotel_manager">Hotel manager</option><option value="receptionist">Receptionist</option></select></label>
          <div className="form-actions"><button className="btn btn-primary" type="submit" disabled={saving}><UserPlus size={14} />{saving ? 'Creating…' : 'Create staff account'}</button></div>
        </form>
      </section>
      <form className="toolbar page-section" onSubmit={(event) => { event.preventDefault(); setLoading(true); setAppliedSearch(search.trim()); setPage(1); }}>
        <input className="field-control search-control" placeholder="Search name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
        <button className="btn btn-secondary" type="submit">Search staff</button>
      </form>
      <DataTable columns={columns} rows={records} loading={loading} error={error} page={page} totalPages={meta.totalPages || 1} onPageChange={(nextPage) => { setLoading(true); setPage(nextPage); }} emptyMessage="No staff accounts found." />
    </>
  );
}
