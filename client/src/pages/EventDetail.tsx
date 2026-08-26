import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/client';
import type { BudgetItem, Event, EventStatus, Guest, Task, Vendor } from '../api/types';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  formatCurrency,
  formatDate,
} from '../components/ui';

const STATUSES: EventStatus[] = ['LEAD', 'PLANNING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const TABS = ['Overview', 'Tasks', 'Budget', 'Guests', 'Vendors'] as const;
type Tab = (typeof TABS)[number];

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [tab, setTab] = useState<Tab>('Overview');
  const [error, setError] = useState<string | null>(null);

  const load = () => api.get(`/events/${id}`).then((res) => setEvent(res.data.event));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onStatusChange = async (status: string) => {
    await api.put(`/events/${id}`, { status });
    load();
  };

  const onDelete = async () => {
    if (!confirm('Delete this event and all of its data?')) return;
    await api.delete(`/events/${id}`);
    navigate('/events');
  };

  if (!event) return <p className="text-sm text-neutral-500">Loading…</p>;

  const spent = (event.budgetItems ?? []).reduce((sum, item) => sum + item.actualCost, 0);
  const estimated = (event.budgetItems ?? []).reduce((sum, item) => sum + item.estimatedCost, 0);
  const confirmedGuests = (event.guests ?? []).filter((g) => g.rsvpStatus === 'CONFIRMED').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/events" className="text-xs font-medium text-neutral-500 hover:text-brand-600">
            ← Back to events
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{event.title}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {event.type || 'Event'} · {formatDate(event.startDate)}
            {event.client && (
              <>
                {' '}
                ·{' '}
                <Link to={`/clients/${event.client.id}`} className="text-brand-600 hover:underline">
                  {event.client.name}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={event.status} onChange={(e) => onStatusChange(e.target.value)} className="w-40">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </Select>
          <Button variant="danger" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-neutral-500">Budget</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(event.budget)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-neutral-500">Spent / Estimated</p>
          <p className="mt-1 text-lg font-semibold">
            {formatCurrency(spent)} <span className="text-sm font-normal text-neutral-400">/ {formatCurrency(estimated)}</span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-neutral-500">Guests confirmed</p>
          <p className="mt-1 text-lg font-semibold">
            {confirmedGuests} <span className="text-sm font-normal text-neutral-400">/ {event.guests?.length ?? 0}</span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-neutral-500">Open tasks</p>
          <p className="mt-1 text-lg font-semibold">{(event.tasks ?? []).filter((t) => t.status !== 'DONE').length}</p>
        </Card>
      </div>

      <div className="flex gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t ? 'border-b-2 border-brand-500 text-brand-700' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {tab === 'Overview' && <Overview event={event} />}
      {tab === 'Tasks' && <TasksTab event={event} onChange={load} onError={setError} />}
      {tab === 'Budget' && <BudgetTab event={event} onChange={load} onError={setError} />}
      {tab === 'Guests' && <GuestsTab event={event} onChange={load} onError={setError} />}
      {tab === 'Vendors' && <VendorsTab event={event} onChange={load} onError={setError} />}
    </div>
  );
}

function Overview({ event }: { event: Event }) {
  return (
    <Card className="p-5">
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-neutral-500">Location</dt>
          <dd className="text-sm text-neutral-800">{event.location || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">End date</dt>
          <dd className="text-sm text-neutral-800">{formatDate(event.endDate)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-neutral-500">Description</dt>
          <dd className="whitespace-pre-wrap text-sm text-neutral-800">{event.description || '—'}</dd>
        </div>
      </dl>
    </Card>
  );
}

// ---------------- Tasks ----------------

function TasksTab({ event, onChange, onError }: { event: Event; onChange: () => void; onError: (e: string | null) => void }) {
  const [form, setForm] = useState({ title: '', dueDate: '', priority: 'MEDIUM' });

  const addTask = async (e: FormEvent) => {
    e.preventDefault();
    onError(null);
    try {
      await api.post(`/events/${event.id}/tasks`, { ...form, dueDate: form.dueDate || null });
      setForm({ title: '', dueDate: '', priority: 'MEDIUM' });
      onChange();
    } catch (err) {
      onError(apiErrorMessage(err, 'Could not add task'));
    }
  };

  const toggleDone = async (task: Task) => {
    await api.put(`/events/${event.id}/tasks/${task.id}`, { status: task.status === 'DONE' ? 'TODO' : 'DONE' });
    onChange();
  };

  const removeTask = async (task: Task) => {
    await api.delete(`/events/${event.id}/tasks/${task.id}`);
    onChange();
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form onSubmit={addTask} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <Field label="Task">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Field>
          </div>
          <Field label="Due date">
            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
          </Field>
          <Button type="submit">Add task</Button>
        </form>
      </Card>

      {!event.tasks || event.tasks.length === 0 ? (
        <EmptyState title="No tasks yet" />
      ) : (
        <Card>
          <ul className="divide-y divide-neutral-100">
            {event.tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === 'DONE'}
                    onChange={() => toggleDone(task)}
                    className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-400"
                  />
                  <div>
                    <p className={`text-sm font-medium ${task.status === 'DONE' ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-neutral-500">Due {formatDate(task.dueDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge value={task.priority} />
                  <button onClick={() => removeTask(task)} className="text-xs text-neutral-400 hover:text-red-600">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ---------------- Budget ----------------

function BudgetTab({ event, onChange, onError }: { event: Event; onChange: () => void; onError: (e: string | null) => void }) {
  const [form, setForm] = useState({ category: '', estimatedCost: '', actualCost: '' });

  const addItem = async (e: FormEvent) => {
    e.preventDefault();
    onError(null);
    try {
      await api.post(`/events/${event.id}/budget-items`, {
        category: form.category,
        estimatedCost: Number(form.estimatedCost) || 0,
        actualCost: Number(form.actualCost) || 0,
      });
      setForm({ category: '', estimatedCost: '', actualCost: '' });
      onChange();
    } catch (err) {
      onError(apiErrorMessage(err, 'Could not add budget item'));
    }
  };

  const togglePaid = async (item: BudgetItem) => {
    await api.put(`/events/${event.id}/budget-items/${item.id}`, { paid: !item.paid });
    onChange();
  };

  const removeItem = async (item: BudgetItem) => {
    await api.delete(`/events/${event.id}/budget-items/${item.id}`);
    onChange();
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form onSubmit={addItem} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <Field label="Category">
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
            </Field>
          </div>
          <Field label="Estimated ($)">
            <Input type="number" min="0" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} />
          </Field>
          <Field label="Actual ($)">
            <Input type="number" min="0" value={form.actualCost} onChange={(e) => setForm({ ...form, actualCost: e.target.value })} />
          </Field>
          <Button type="submit">Add line item</Button>
        </form>
      </Card>

      {!event.budgetItems || event.budgetItems.length === 0 ? (
        <EmptyState title="No budget items yet" />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500">
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Estimated</th>
                <th className="px-5 py-3 font-medium">Actual</th>
                <th className="px-5 py-3 font-medium">Paid</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {event.budgetItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3 font-medium text-neutral-900">{item.category}</td>
                  <td className="px-5 py-3 text-neutral-600">{formatCurrency(item.estimatedCost)}</td>
                  <td className="px-5 py-3 text-neutral-600">{formatCurrency(item.actualCost)}</td>
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={item.paid}
                      onChange={() => togglePaid(item)}
                      className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-400"
                    />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => removeItem(item)} className="text-xs text-neutral-400 hover:text-red-600">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ---------------- Guests ----------------

function GuestsTab({ event, onChange, onError }: { event: Event; onChange: () => void; onError: (e: string | null) => void }) {
  const [form, setForm] = useState({ name: '', email: '', plusOne: false });

  const addGuest = async (e: FormEvent) => {
    e.preventDefault();
    onError(null);
    try {
      await api.post(`/events/${event.id}/guests`, form);
      setForm({ name: '', email: '', plusOne: false });
      onChange();
    } catch (err) {
      onError(apiErrorMessage(err, 'Could not add guest'));
    }
  };

  const setRsvp = async (guest: Guest, rsvpStatus: string) => {
    await api.put(`/events/${event.id}/guests/${guest.id}`, { rsvpStatus });
    onChange();
  };

  const removeGuest = async (guest: Guest) => {
    await api.delete(`/events/${event.id}/guests/${guest.id}`);
    onChange();
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form onSubmit={addGuest} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <Field label="Guest name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
          </div>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 pb-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={form.plusOne}
              onChange={(e) => setForm({ ...form, plusOne: e.target.checked })}
              className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-400"
            />
            Plus one
          </label>
          <Button type="submit">Add guest</Button>
        </form>
      </Card>

      {!event.guests || event.guests.length === 0 ? (
        <EmptyState title="No guests yet" />
      ) : (
        <Card>
          <ul className="divide-y divide-neutral-100">
            {event.guests.map((guest) => (
              <li key={guest.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {guest.name} {guest.plusOne && <span className="text-xs text-neutral-400">(+1)</span>}
                  </p>
                  <p className="text-xs text-neutral-500">{guest.email || '—'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={guest.rsvpStatus} onChange={(e) => setRsvp(guest, e.target.value)} className="w-36">
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="DECLINED">Declined</option>
                  </Select>
                  <button onClick={() => removeGuest(guest)} className="text-xs text-neutral-400 hover:text-red-600">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ---------------- Vendors ----------------

function VendorsTab({ event, onChange, onError }: { event: Event; onChange: () => void; onError: (e: string | null) => void }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState({ vendorId: '', cost: '' });

  useEffect(() => {
    api.get('/vendors').then((res) => setVendors(res.data.vendors));
  }, []);

  const bookedIds = new Set((event.eventVendors ?? []).map((ev) => ev.vendor?.id));
  const available = vendors.filter((v) => !bookedIds.has(v.id));

  const addBooking = async (e: FormEvent) => {
    e.preventDefault();
    onError(null);
    if (!form.vendorId) return;
    try {
      await api.post(`/events/${event.id}/vendors`, { vendorId: form.vendorId, cost: Number(form.cost) || 0 });
      setForm({ vendorId: '', cost: '' });
      onChange();
    } catch (err) {
      onError(apiErrorMessage(err, 'Could not book vendor'));
    }
  };

  const setStatus = async (eventVendorId: string, status: string) => {
    await api.put(`/events/${event.id}/vendors/${eventVendorId}`, { status });
    onChange();
  };

  const removeBooking = async (eventVendorId: string) => {
    await api.delete(`/events/${event.id}/vendors/${eventVendorId}`);
    onChange();
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form onSubmit={addBooking} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Field label="Vendor">
              <Select value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} required>
                <option value="">Select a vendor…</option>
                {available.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category})
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Cost ($)">
            <Input type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </Field>
          <Button type="submit">Book vendor</Button>
        </form>
      </Card>

      {!event.eventVendors || event.eventVendors.length === 0 ? (
        <EmptyState title="No vendors booked yet" />
      ) : (
        <Card>
          <ul className="divide-y divide-neutral-100">
            {event.eventVendors.map((ev) => (
              <li key={ev.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{ev.vendor?.name}</p>
                  <p className="text-xs text-neutral-500">
                    {ev.vendor?.category} · {formatCurrency(ev.cost)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={ev.status} onChange={(e) => setStatus(ev.id, e.target.value)} className="w-36">
                    <option value="INQUIRY">Inquiry</option>
                    <option value="BOOKED">Booked</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                  <button onClick={() => removeBooking(ev.id)} className="text-xs text-neutral-400 hover:text-red-600">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
