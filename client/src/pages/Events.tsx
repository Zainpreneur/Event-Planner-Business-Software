import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/client';
import type { Client, Event, EventStatus } from '../api/types';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Textarea, formatCurrency, formatDate } from '../components/ui';

const STATUSES: EventStatus[] = ['LEAD', 'PLANNING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({
    title: '',
    type: '',
    startDate: '',
    location: '',
    budget: '',
    clientId: '',
    description: '',
  });

  const load = () =>
    api.get('/events', { params: statusFilter ? { status: statusFilter } : {} }).then((res) => setEvents(res.data.events));

  useEffect(() => {
    Promise.all([load(), api.get('/clients').then((res) => setClients(res.data.clients))]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('/events', {
        ...form,
        budget: form.budget ? Number(form.budget) : 0,
        clientId: form.clientId || null,
      });
      setOpen(false);
      navigate(`/events/${res.data.event.id}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create event'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Events</h1>
          <p className="mt-1 text-sm text-neutral-500">Every event you're planning, past and upcoming.</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ New event</Button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            statusFilter === '' ? 'bg-brand-500 text-white' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusFilter === s ? 'bg-brand-500 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : events.length === 0 ? (
        <EmptyState title="No events found" subtitle="Create an event to start planning." />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Budget</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-neutral-50">
                  <td className="px-5 py-3">
                    <Link to={`/events/${event.id}`} className="font-medium text-neutral-900 hover:text-brand-600">
                      {event.title}
                    </Link>
                    <p className="text-xs text-neutral-500">{event.type || 'Event'}</p>
                  </td>
                  <td className="px-5 py-3 text-neutral-600">{event.client?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-neutral-600">{formatDate(event.startDate)}</td>
                  <td className="px-5 py-3 text-neutral-600">{formatCurrency(event.budget)}</td>
                  <td className="px-5 py-3">
                    <Badge value={event.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New event">
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Input placeholder="Wedding, Corporate…" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            </Field>
            <Field label="Start date">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </Field>
          </div>
          <Field label="Client">
            <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
            <Field label="Budget (USD)">
              <Input type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full">
            Create event
          </Button>
        </form>
      </Modal>
    </div>
  );
}
