import { useCallback, useEffect, useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import DataTable from '../../components/DataTable/DataTable';
import { adminApi } from '../../services/api';
import { formatMoney, titleCase } from '../../utils/format';

const emptyRoom = { roomNumber: '', category: '', floor: '', description: '', operationalStatus: 'available', housekeepingStatus: 'clean' };
const emptyCategory = { name: '', slug: '', description: '', basePrice: '', maxOccupancy: '2', bedConfiguration: '', size: '' };

export default function RoomsPage() {
  const [tab, setTab] = useState('rooms');
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [roomForm, setRoomForm] = useState(emptyRoom);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [editingRoom, setEditingRoom] = useState('');
  const [editingCategory, setEditingCategory] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadCategories = useCallback(async () => {
    const response = await adminApi.categories();
    setCategories(response.data);
  }, []);

  const loadRooms = useCallback(async () => {
    const params = { page, limit: 10 };
    if (appliedSearch) params.search = appliedSearch;
    const response = await adminApi.rooms(params);
    setRooms(response.data);
    setMeta(response.meta || { totalPages: 1 });
  }, [page, appliedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadRooms(), loadCategories()]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [loadCategories, loadRooms]);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi.rooms({ page, limit: 10, ...(appliedSearch ? { search: appliedSearch } : {}) }),
      adminApi.categories(),
    ]).then(([roomResponse, categoryResponse]) => {
      if (!active) return;
      setRooms(roomResponse.data);
      setMeta(roomResponse.meta || { totalPages: 1 });
      setCategories(categoryResponse.data);
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [appliedSearch, page]);

  async function saveRoom(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const payload = {
      roomNumber: roomForm.roomNumber.trim(),
      category: roomForm.category,
      description: roomForm.description.trim(),
      operationalStatus: roomForm.operationalStatus,
      housekeepingStatus: roomForm.housekeepingStatus,
    };
    if (roomForm.floor !== '') payload.floor = Number(roomForm.floor);
    try {
      const response = await adminApi.saveRoom(payload, editingRoom);
      setNotice(response.message);
      setEditingRoom('');
      setRoomForm(emptyRoom);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deactivateRoom(room) {
    if (!window.confirm(`Deactivate room ${room.roomNumber}? Rooms with active reservations cannot be deactivated.`)) return;
    setError('');
    try {
      const response = await adminApi.deactivateRoom(room._id);
      setNotice(response.message);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function saveCategory(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await adminApi.saveCategory({
        ...categoryForm,
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim(),
        description: categoryForm.description.trim(),
        basePrice: Number(categoryForm.basePrice),
        maxOccupancy: Number(categoryForm.maxOccupancy),
        bedConfiguration: categoryForm.bedConfiguration.trim(),
        size: categoryForm.size.trim(),
      }, editingCategory);
      setNotice(response.message);
      setEditingCategory('');
      setCategoryForm(emptyCategory);
      await loadCategories();
      await loadRooms();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deactivateCategory(category) {
    if (!window.confirm(`Deactivate category ${category.name}?`)) return;
    setError('');
    try {
      const response = await adminApi.deactivateCategory(category._id);
      setNotice(response.message);
      await loadCategories();
      await loadRooms();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const roomColumns = [
    { key: 'roomNumber', label: 'Room', render: (row) => <strong>{row.roomNumber}</strong> },
    { key: 'category', label: 'Category', render: (row) => row.category?.name || '—' },
    { key: 'floor', label: 'Floor' },
    { key: 'operationalStatus', label: 'Status', render: (row) => <span className="status-pill">{titleCase(row.operationalStatus)}</span> },
    { key: 'housekeepingStatus', label: 'Housekeeping', render: (row) => titleCase(row.housekeepingStatus) },
    { key: 'actions', label: 'Actions', render: (row) => <div className="row-actions"><button className="button-link" type="button" onClick={() => { setEditingRoom(row._id); setRoomForm({ roomNumber: row.roomNumber, category: row.category?._id || '', floor: row.floor === undefined ? '' : String(row.floor), description: row.description || '', operationalStatus: row.operationalStatus, housekeepingStatus: row.housekeepingStatus }); }}>Edit</button><button className="button-link danger-link" type="button" onClick={() => void deactivateRoom(row)}>Deactivate</button></div> },
  ];
  const categoryColumns = [
    { key: 'name', label: 'Category', render: (row) => <strong>{row.name}</strong> },
    { key: 'slug', label: 'Slug' },
    { key: 'basePrice', label: 'Base rate', render: (row) => formatMoney(row.basePrice) },
    { key: 'maxOccupancy', label: 'Occupancy' },
    { key: 'operationalRoomCount', label: 'Rooms' },
    { key: 'actions', label: 'Actions', render: (row) => <div className="row-actions"><button className="button-link" type="button" onClick={() => { setEditingCategory(row._id); setCategoryForm({ name: row.name, slug: row.slug, description: row.description || '', basePrice: String(row.basePrice), maxOccupancy: String(row.maxOccupancy), bedConfiguration: row.bedConfiguration || '', size: row.size || '' }); }}>Edit</button><button className="button-link danger-link" type="button" onClick={() => void deactivateCategory(row)}>Deactivate</button></div> },
  ];

  return (
    <>
      <div className="page-heading"><div><h2>Rooms & inventory</h2><p>Manage physical rooms and their sellable categories.</p></div></div>
      {notice && <div className="inline-success" role="status">{notice}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="tab-row">
        <button type="button" className={`tab-button${tab === 'rooms' ? ' active' : ''}`} onClick={() => setTab('rooms')}>Rooms</button>
        <button type="button" className={`tab-button${tab === 'categories' ? ' active' : ''}`} onClick={() => setTab('categories')}>Room categories</button>
      </div>
      {tab === 'rooms' ? (
        <>
          <section className="panel page-section">
            <h3 className="section-heading">{editingRoom ? 'Edit room' : 'Add a room'}</h3>
            <form className="form-grid" onSubmit={saveRoom}>
              <label className="form-field">Room number<input className="field-control" required maxLength={20} value={roomForm.roomNumber} onChange={(event) => setRoomForm({ ...roomForm, roomNumber: event.target.value })} /></label>
              <label className="form-field">Category<select className="field-control" required value={roomForm.category} onChange={(event) => setRoomForm({ ...roomForm, category: event.target.value })}><option value="">Select category</option>{categories.map((category) => <option value={category._id} key={category._id}>{category.name}</option>)}</select></label>
              <label className="form-field">Floor<input className="field-control" type="number" min="-5" max="200" step="1" value={roomForm.floor} onChange={(event) => setRoomForm({ ...roomForm, floor: event.target.value })} /></label>
              <label className="form-field">Operational status<select className="field-control" value={roomForm.operationalStatus} onChange={(event) => setRoomForm({ ...roomForm, operationalStatus: event.target.value })}>{['available', 'occupied', 'maintenance', 'out_of_service'].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>
              <label className="form-field">Housekeeping<select className="field-control" value={roomForm.housekeepingStatus} onChange={(event) => setRoomForm({ ...roomForm, housekeepingStatus: event.target.value })}>{['clean', 'dirty', 'cleaning', 'inspected'].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>
              <label className="form-field full">Description<textarea className="field-control" rows="2" maxLength={2000} value={roomForm.description} onChange={(event) => setRoomForm({ ...roomForm, description: event.target.value })} /></label>
              <div className="form-actions"><button className="btn btn-primary" type="submit" disabled={saving || !categories.length}><Save size={14} />{saving ? 'Saving…' : editingRoom ? 'Save room' : 'Create room'}</button>{editingRoom && <button className="btn btn-secondary" type="button" onClick={() => { setEditingRoom(''); setRoomForm(emptyRoom); }}><X size={14} />Cancel</button>}{!categories.length && <span className="cell-subtext">Create an active category first.</span>}</div>
            </form>
          </section>
          <form className="toolbar page-section" onSubmit={(event) => { event.preventDefault(); setLoading(true); setPage(1); setAppliedSearch(search.trim()); }}>
            <div className="toolbar-group"><input className="field-control search-control" placeholder="Search room number or description" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <button className="btn btn-secondary" type="submit">Search</button>
          </form>
          <DataTable columns={roomColumns} rows={rooms} loading={loading} error={error} page={page} totalPages={meta.totalPages || 1} onPageChange={(nextPage) => { setLoading(true); setPage(nextPage); }} emptyMessage="No rooms found." />
        </>
      ) : (
        <>
          <section className="panel page-section">
            <h3 className="section-heading">{editingCategory ? 'Edit category' : 'Add a category'}</h3>
            <form className="form-grid" onSubmit={saveCategory}>
              <label className="form-field">Name<input className="field-control" required minLength="2" maxLength="100" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} /></label>
              <label className="form-field">URL slug<input className="field-control" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={categoryForm.slug} onChange={(event) => setCategoryForm({ ...categoryForm, slug: event.target.value })} /></label>
              <label className="form-field">Base price<input className="field-control" required type="number" min="0" max="10000000" step="0.01" value={categoryForm.basePrice} onChange={(event) => setCategoryForm({ ...categoryForm, basePrice: event.target.value })} /></label>
              <label className="form-field">Maximum occupancy<input className="field-control" required type="number" min="1" max="20" step="1" value={categoryForm.maxOccupancy} onChange={(event) => setCategoryForm({ ...categoryForm, maxOccupancy: event.target.value })} /></label>
              <label className="form-field">Bed configuration<input className="field-control" maxLength="100" value={categoryForm.bedConfiguration} onChange={(event) => setCategoryForm({ ...categoryForm, bedConfiguration: event.target.value })} /></label>
              <label className="form-field">Room size<input className="field-control" maxLength="50" value={categoryForm.size} onChange={(event) => setCategoryForm({ ...categoryForm, size: event.target.value })} /></label>
              <label className="form-field full">Description<textarea className="field-control" rows="2" maxLength="2000" value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} /></label>
              <div className="form-actions"><button className="btn btn-primary" type="submit" disabled={saving}><Plus size={14} />{saving ? 'Saving…' : editingCategory ? 'Save category' : 'Create category'}</button>{editingCategory && <button className="btn btn-secondary" type="button" onClick={() => { setEditingCategory(''); setCategoryForm(emptyCategory); }}><X size={14} />Cancel</button>}</div>
            </form>
          </section>
          <div className="page-section"><DataTable columns={categoryColumns} rows={categories} loading={loading} error={error} emptyMessage="No active room categories." /></div>
        </>
      )}
    </>
  );
}
