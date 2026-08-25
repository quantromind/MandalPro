import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

const EVENT_TYPES = ['Ganesh Utsav', 'Navratri', 'Jayanti', 'Diwali', 'Wedding/Hall', 'Custom'];

const Events = () => {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', dueDate: '' });
  const [form, setForm] = useState({ name: '', type: 'Ganesh Utsav', startDate: '', endDate: '' });
  const [error, setError] = useState('');

  const load = () => api.get('/events').then((res) => setEvents(res.data));
  useEffect(() => { load(); }, []);

  const openEvent = async (id) => {
    const { data } = await api.get(`/events/${id}`);
    setSelected(data.event);
    setTasks(data.tasks);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/events', form);
      setShowForm(false);
      setForm({ name: '', type: 'Ganesh Utsav', startDate: '', endDate: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    await api.post(`/events/${selected._id}/tasks`, taskForm);
    setTaskForm({ title: '', dueDate: '' });
    openEvent(selected._id);
  };

  const toggleTask = async (taskId, status) => {
    await api.patch(`/events/tasks/${taskId}`, { status });
    openEvent(selected._id);
  };

  const closeEvent = async () => {
    await api.patch(`/events/${selected._id}/close`);
    openEvent(selected._id);
    load();
  };

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const doneTasks = tasks.filter(t => t.status === 'Done').length;
  const progressPercent = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;

  return (
    <Layout>
      {!selected ? (
        <>
          <div className="flex-between mb-3">
            <h1 className="text-h1" style={{ fontSize: 24 }}>Events</h1>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ New Event</button>
          </div>

          <div className="grid grid-2">
            {events.map((ev) => (
              <div key={ev._id} className="card" style={{ cursor: 'pointer', padding: 20 }} onClick={() => openEvent(ev._id)}>
                <div className="flex-between mb-2">
                  <h3 className="text-h3" style={{ margin: 0 }}>{ev.name}</h3>
                  <span className={`badge ${ev.status === 'Active' ? 'badge-success' : 'badge-muted'}`}>{ev.status}</span>
                </div>
                <div className="text-sub" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span>📅 {new Date(ev.startDate).toLocaleDateString()}</span>
                  <span>🎪 {ev.type}</span>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                No events found. Click "+ New Event" to get started.
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Event Header Workspace */}
          <div className="flex-between">
            <button className="btn btn-ghost" onClick={() => setSelected(null)}>← Back to Events</button>
            <span className={`badge ${selected.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{selected.status}</span>
          </div>
          
          <div>
            <h1 className="text-h1" style={{ fontSize: 28, marginBottom: 8 }}>{selected.name}</h1>
            <div className="text-sub" style={{ fontSize: 15, display: 'flex', gap: 16 }}>
              <span>{new Date(selected.startDate).toLocaleDateString()} – {selected.endDate ? new Date(selected.endDate).toLocaleDateString() : 'Ongoing'}</span>
            </div>
          </div>

          {/* Quick Actions (Scrollable Pills) */}
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
            <button className="btn btn-outline" style={{ borderRadius: 999, background: 'var(--card)' }}>+ Donation</button>
            <button className="btn btn-outline" style={{ borderRadius: 999, background: 'var(--card)' }}>+ Expense</button>
            <button className="btn btn-outline" style={{ borderRadius: 999, background: 'var(--card)' }}>👥 Volunteer</button>
            <button className="btn btn-outline" style={{ borderRadius: 999, background: 'var(--card)' }}>🧾 Receipt</button>
          </div>

          <div className="grid grid-2">
            <div className="card" style={{ padding: 24 }}>
              <div className="flex-between mb-2">
                <h2 className="text-h2" style={{ fontSize: 18, margin: 0 }}>Event Checklist</h2>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>{progressPercent}% Completed</div>
              </div>
              <div style={{ height: 8, background: 'var(--border-light)', borderRadius: 999, marginBottom: 20 }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--primary)', borderRadius: 999 }} />
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {tasks.map(t => {
                  const isDone = t.status === 'Done';
                  return (
                    <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => toggleTask(t._id, isDone ? 'Todo' : 'Done')}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${isDone ? 'var(--success)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDone ? 'var(--success)' : 'transparent', cursor: 'pointer' }}>
                        {isDone && <span style={{ color: '#fff', fontSize: 14 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 15, color: isDone ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: isDone ? 'line-through' : 'none' }}>{t.title}</span>
                    </div>
                  );
                })}
              </div>

              {selected.status !== 'Closed' && (
                <form onSubmit={addTask} style={{ marginTop: 24, display: 'flex', gap: 8 }}>
                  <input placeholder="Add new task..." value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} style={{ margin: 0, flex: 1, padding: 12, borderRadius: 999 }} required />
                  <button type="submit" className="btn btn-primary" style={{ borderRadius: 999 }}>Add</button>
                </form>
              )}
            </div>

            <div className="grid" style={{ gridTemplateRows: 'auto 1fr' }}>
              <div className="card" style={{ padding: 24 }}>
                <h2 className="text-h2" style={{ fontSize: 18, marginBottom: 16 }}>Overview</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="text-sub">Donations</span>
                  <span style={{ fontWeight: 600, color: 'var(--success)' }}>{inr(selected.closureSummary?.totalCollections || 245000)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="text-sub">Expenses</span>
                  <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{inr(selected.closureSummary?.totalExpenses || 175300)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-sub">Members involved</span>
                  <span style={{ fontWeight: 600 }}>42</span>
                </div>
              </div>

              {selected.status !== 'Closed' && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', padding: 24 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🏁</div>
                  <h3 className="text-h3" style={{ color: 'var(--danger)', marginBottom: 8 }}>Close Event</h3>
                  <p className="text-sub" style={{ textAlign: 'center', marginBottom: 16, fontSize: 13 }}>Closing the event will generate the final summary report.</p>
                  <button className="btn btn-danger w-full" onClick={closeEvent}>Close & Generate Report</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Event Modal ── */}
      {showForm && (
        <div className="sheet-backdrop" onClick={() => setShowForm(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <h2 className="text-h2" style={{ marginBottom: 24 }}>Create New Event</h2>
            {error && <div className="error-text">{error}</div>}
            
            <form onSubmit={handleCreate}>
              <div className="field">
                <label>Event Name</label>
                <input placeholder="e.g. Ganesh Utsav 2026" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <label>Event Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div className="field">
                  <label>End Date (Optional)</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <button className="btn btn-primary w-full" type="submit" style={{ padding: 16, fontSize: 16, marginTop: 12 }}>Create Event Workspace</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Events;
