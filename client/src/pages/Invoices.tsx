import { useEffect, useState, type FormEvent } from 'react';
import { api, apiErrorMessage } from '../api/client';
import type { Client, Event, Invoice } from '../api/types';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, formatCurrency, formatDate } from '../components/ui';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    number: '',
    amount: '',
    amountPaid: '0',
    status: 'DRAFT',
    dueDate: '',
    clientId: '',
    eventId: '',
    description: '',
  });

  const load = () => api.get('/invoices').then((res) => setInvoices(res.data.invoices));

  useEffect(() => {
    Promise.all([
      load(),
      api.get('/clients').then((res) => setClients(res.data.clients)),
      api.get('/events').then((res) => setEvents(res.data.events)),
    ]).finally(() => setLoading(false));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/invoices', {
        ...form,
        amount: Number(form.amount),
        amountPaid: Number(form.amountPaid) || 0,
        dueDate: form.dueDate || null,
      });
      setForm({ number: '', amount: '', amountPaid: '0', status: 'DRAFT', dueDate: '', clientId: '', eventId: '', description: '' });
      setOpen(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create invoice'));
    }
  };

  const eventsForClient = events.filter((e) => e.clientId === form.clientId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Invoices</h1>
          <p className="mt-1 text-sm text-neutral-500">Track billing and payments across every event.</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ New invoice</Button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : invoices.length === 0 ? (
        <EmptyState title="No invoices yet" subtitle="Create an invoice to start tracking payments." />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-5 py-3 font-medium">Number</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Paid</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-neutral-50">
                  <td className="px-5 py-3 font-medium text-neutral-900">{inv.number}</td>
                  <td className="px-5 py-3 text-neutral-600">{inv.client?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-neutral-600">{inv.event?.title ?? '—'}</td>
                  <td className="px-5 py-3 text-neutral-600">{formatCurrency(inv.amount)}</td>
                  <td className="px-5 py-3 text-neutral-600">{formatCurrency(inv.amountPaid)}</td>
                  <td className="px-5 py-3 text-neutral-600">{formatDate(inv.dueDate)}</td>
                  <td className="px-5 py-3">
                    <Badge value={inv.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New invoice">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Invoice number">
              <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PARTIALLY_PAID">Partially paid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </Select>
            </Field>
          </div>
          <Field label="Client">
            <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, eventId: '' })} required>
              <option value="">Select a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Event">
            <Select value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })} required>
              <option value="">Select an event…</option>
              {eventsForClient.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount ($)">
              <Input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </Field>
            <Field label="Amount paid ($)">
              <Input type="number" min="0" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
            </Field>
          </div>
          <Field label="Due date">
            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full">
            Save invoice
          </Button>
        </form>
      </Modal>
    </div>
  );
}
