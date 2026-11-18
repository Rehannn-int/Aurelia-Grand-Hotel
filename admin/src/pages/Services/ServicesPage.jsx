import { useCallback, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import DataTable from '../../components/DataTable/DataTable';
import { adminApi } from '../../services/api';
import { formatMoney, titleCase } from '../../utils/format';

const emptyForm = { name: '', description: '', category: 'concierge', price: '0', currency: 'INR', active: true };

export default function ServicesPage() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.services();
      setRecords(response.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    adminApi.services()
      .then((response) => { if (active) setRecords(response.data); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await adminApi.saveService({ ...form, name: form.name.trim(), description: form.description.trim(), price: Number(form.price) }, editing);
      setNotice(response.message);
      setEditing('');
      setForm(emptyForm);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(service) {
    if (!window.confirm(`Deactivate ${service.name}?`)) return;
    setError('');
    try {
      const response = await adminApi.deactivateService(service._id);
      setNotice(response.message);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const columns = [
    { key: 'name', label: 'Service', render: (row) => <><strong>{row.name}</strong><small className="cell-subtext">{row.description}</small></> },
    { key: 'category', label: 'Category', render: (row) => titleCase(row.category) },
    { key: 'price', label: 'Price', render: (row) => formatMoney(row.price, row.currency) },
    { key: 'active', label: 'Status', render: (row) => <span className={`status-pill${row.active ? '' : ' danger'}`}>{row.active ? 'Active' : 'Inactive'}</span> },
    { key: 'actions', label: 'Actions', render: (row) => <div className="row-actions"><button type="button" className="button-link" onClick={() => { setEditing(row._id); setForm({ name: row.name, description: row.description || '', category: row.category, price: String(row.price), currency: row.currency, active: row.active }); }}>Edit</button>{row.active && <button type="button" className="button-link danger-link" onClick={() => void deactivate(row)}>Deactivate</button>}</div> },
  ];

  return (
    <>
      <div className="page-heading"><div><h2>Hotel services</h2><p>Maintain the services shown and offered by the property.</p></div></div>
      {notice && <div className="inline-success" role="status">{notice}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <section className="panel">
        <h3 className="section-heading">{editing ? 'Edit hotel service' : 'Add hotel service'}</h3>
        <form className="form-grid" onSubmit={save}>
          <label className="form-field">Service name<input className="field-control" required minLength="2" maxLength="120" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label className="form-field">Category<select className="field-control" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{['dining', 'wellness', 'transport', 'concierge', 'other'].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>
          <label className="form-field">Price<input className="field-control" type="number" required min="0" max="10000000" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
          <label className="form-field">Currency<input className="field-control" required pattern="[A-Z]{3}" maxLength="3" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} /></label>
          <label className="form-field full">Description<textarea className="field-control" rows="2" maxLength="1000" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          {editing && <label className="form-field"><span>Availability</span><select className="field-control" value={String(form.active)} onChange={(event) => setForm({ ...form, active: event.target.value === 'true' })}><option value="true">Active</option><option value="false">Inactive</option></select></label>}
          <div className="form-actions"><button className="btn btn-primary" type="submit" disabled={saving}><Plus size={14} />{saving ? 'Saving…' : editing ? 'Save changes' : 'Create service'}</button>{editing && <button className="btn btn-secondary" type="button" onClick={() => { setEditing(''); setForm(emptyForm); }}><X size={14} />Cancel</button>}</div>
        </form>
      </section>
      <div className="page-section"><DataTable columns={columns} rows={records} loading={loading} error={error} emptyMessage="No hotel services have been created." /></div>
    </>
  );
}
