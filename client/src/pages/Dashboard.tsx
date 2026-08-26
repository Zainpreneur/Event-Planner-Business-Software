import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import type { DashboardData } from '../api/types';
import { Badge, Card, EmptyState, formatCurrency, formatDate } from '../components/ui';

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-neutral-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get('/dashboard').then((res) => setData(res.data));
  }, []);

  if (!data) return <p className="text-sm text-neutral-500">Loading…</p>;

  const chartData = data.eventsByStatus.map((row) => ({ name: row.status.replace(/_/g, ' '), count: row.count }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">Here's how your event business is doing.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total events" value={String(data.totalEvents)} />
        <StatCard label="Active clients" value={String(data.activeClients)} />
        <StatCard label="Open tasks" value={String(data.openTasks)} hint={`${data.overdueTasks} overdue`} />
        <StatCard label="Revenue collected" value={formatCurrency(data.revenue)} hint={`${formatCurrency(data.outstanding)} outstanding`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-neutral-800">Events by status</h2>
          {chartData.length === 0 ? (
            <EmptyState title="No events yet" subtitle="Create your first event to see it here." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#d4652f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-800">Upcoming events (next 30 days)</h2>
            <Link to="/events" className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {data.upcomingEvents.length === 0 ? (
            <EmptyState title="Nothing coming up" subtitle="No events scheduled in the next 30 days." />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {data.upcomingEvents.map((event) => (
                <li key={event.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link to={`/events/${event.id}`} className="text-sm font-medium text-neutral-900 hover:text-brand-600">
                      {event.title}
                    </Link>
                    <p className="text-xs text-neutral-500">
                      {formatDate(event.startDate)} · {event.client?.name ?? 'No client'}
                    </p>
                  </div>
                  <Badge value={event.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
