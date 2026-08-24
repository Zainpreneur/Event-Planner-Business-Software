import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/client';
import type { Client } from '../api/types';
import { Button, Card, EmptyState, Field, Input, Modal, Textarea } from '../components/ui';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', notes: '' });

  const load = () => api.get('/clients').then((res) => setClients(res.data.clients));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/clients', form);
      setForm({ name: '', email: '', phone: '', company: '', notes: '' });
      setOpen(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create client'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Clients</h1>
          <p className="mt-1 text-sm text-neutral-500">People and companies you plan events for.</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ New client</Button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : clients.length === 0 ? (
        <EmptyState title="No clients yet" subtitle="Add your first client to get started." />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Events</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-neutral-50">
                  <td className="px-5 py-3">
                    <Link to={`/clients/${client.id}`} className="font-medium text-neutral-900 hover:text-brand-600">
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-neutral-600">{client.company || '—'}</td>
                  <td className="px-5 py-3 text-neutral-600">{client.email || '—'}</td>
                  <td className="px-5 py-3 text-neutral-600">{client.phone || '—'}</td>
                  <td className="px-5 py-3 text-neutral-600">{client._count?.events ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New client">
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          <Field label="Company">
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </Field>
          <Field label="Notes">
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full">
            Save client
          </Button>
        </form>
      </Modal>
    </div>
  );
}
