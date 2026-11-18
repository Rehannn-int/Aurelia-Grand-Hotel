import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { adminApi } from '../../services/api';

const emptySettings = { hotelName: '', contactEmail: '', contactPhone: '', timezone: 'Asia/Kolkata', currency: 'INR' };

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [settings, setSettings] = useState(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const canEditHotel = user?.role === 'super_admin';

  useEffect(() => {
    let active = true;
    adminApi.hotelSettings()
      .then((response) => { if (active) setSettings({ ...emptySettings, ...response.data }); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await adminApi.updateProfile({ name: profile.name.trim(), phone: profile.phone.trim() });
      updateUser(response.data.user);
      setNotice('Your profile was updated.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await adminApi.saveHotelSettings({ ...settings, hotelName: settings.hotelName.trim(), contactEmail: settings.contactEmail.trim(), contactPhone: settings.contactPhone.trim(), timezone: settings.timezone.trim(), currency: settings.currency.toUpperCase() });
      setSettings({ ...emptySettings, ...response.data });
      setNotice('Hotel settings were saved.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-heading"><div><h2>Settings</h2><p>Update your administrator profile and authorized hotel configuration.</p></div></div>
      {notice && <div className="inline-success" role="status">{notice}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <section className="panel">
        <h3 className="section-heading">Administrator profile</h3>
        <form className="form-grid" onSubmit={saveProfile}>
          <label className="form-field">Name<input className="field-control" required minLength="2" maxLength="120" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label>
          <label className="form-field">Phone<input className="field-control" maxLength="30" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
          <label className="form-field">Email<input className="field-control" readOnly value={user?.email || ''} /></label>
          <label className="form-field">Role<input className="field-control" readOnly value={user?.role?.replaceAll('_', ' ') || ''} /></label>
          <div className="form-actions"><button className="btn btn-primary" type="submit" disabled={saving}><Save size={14} />Save profile</button></div>
        </form>
      </section>
      <section className="panel page-section">
        <h3 className="section-heading">Hotel information</h3>
        {loading ? <p className="notice">Loading current hotel settings…</p> : (
          <form className="form-grid" onSubmit={saveSettings}>
            <label className="form-field">Hotel name<input className="field-control" required minLength="2" maxLength="120" readOnly={!canEditHotel} value={settings.hotelName} onChange={(event) => setSettings({ ...settings, hotelName: event.target.value })} /></label>
            <label className="form-field">Contact email<input className="field-control" type="email" maxLength="254" readOnly={!canEditHotel} value={settings.contactEmail} onChange={(event) => setSettings({ ...settings, contactEmail: event.target.value })} /></label>
            <label className="form-field">Contact phone<input className="field-control" maxLength="30" readOnly={!canEditHotel} value={settings.contactPhone} onChange={(event) => setSettings({ ...settings, contactPhone: event.target.value })} /></label>
            <label className="form-field">Timezone<input className="field-control" required maxLength="100" readOnly={!canEditHotel} value={settings.timezone} onChange={(event) => setSettings({ ...settings, timezone: event.target.value })} /></label>
            <label className="form-field">Currency<input className="field-control" required pattern="[A-Z]{3}" maxLength="3" readOnly={!canEditHotel} value={settings.currency} onChange={(event) => setSettings({ ...settings, currency: event.target.value.toUpperCase() })} /></label>
            {canEditHotel && <div className="form-actions"><button className="btn btn-primary" type="submit" disabled={saving}><Save size={14} />Save hotel settings</button></div>}
            {!canEditHotel && <p className="form-field full notice">Only a super administrator may change shared hotel settings.</p>}
          </form>
        )}
      </section>
    </>
  );
}
