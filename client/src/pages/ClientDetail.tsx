import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Client } from '../api/types';
import { Badge, Button, Card, EmptyState, formatCurrency, formatDate } from '../components/ui';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);

  const load = () => api.get(`/clients/${id}`).then((res) => setClient(res.data.client));

  useEffect(() => {
    load();
  }, [id]);

  const onDelete = async () => {
    if (!confirm('Delete this client? This cannot be undone.')) return;
    await api.delete(`/clients/${id}`);
    navigate('/clients');
  };

  if (!client) return <p className="text-sm text-neutral-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/clients" className="text-xs font-medium text-neutral-500 hover:text-brand-600">
            ← Back to clients
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{client.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">{client.company || 'No company'}</p>
        </div>
        <Button variant="danger" onClick={onDelete}>
          Delete
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800">Contact</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs text-neutral-500">Email</dt>
              <dd className="text-neutral-800">{client.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Phone</dt>
              <dd className="text-neutral-800">{client.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Notes</dt>
              <dd className="whitespace-pre-wrap text-neutral-800">{client.notes || '—'}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5 md:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800">Events</h2>
          {!client.events || client.events.length === 0 ? (
            <EmptyState title="No events yet" />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {client.events.map((event) => (
                <li key={event.id} className="flex items-center justify-between py-2.5">
                  <Link to={`/events/${event.id}`} className="text-sm font-medium text-neutral-900 hover:text-brand-600">
                    {event.title}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-500">{formatDate(event.startDate)}</span>
                    <Badge value={event.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 md:col-span-3">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800">Invoices</h2>
          {!client.invoices || client.invoices.length === 0 ? (
            <EmptyState title="No invoices yet" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500">
                  <th className="py-2 font-medium">Number</th>
                  <th className="py-2 font-medium">Amount</th>
                  <th className="py-2 font-medium">Paid</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {client.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2">{inv.number}</td>
                    <td className="py-2">{formatCurrency(inv.amount)}</td>
                    <td className="py-2">{formatCurrency(inv.amountPaid)}</td>
                    <td className="py-2">
                      <Badge value={inv.status} />
                    </td>
                    <td className="py-2">{formatDate(inv.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
