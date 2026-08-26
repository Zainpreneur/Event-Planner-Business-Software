import { useEffect, useState, type FormEvent } from 'react';
import { api, apiErrorMessage } from '../api/client';
import type { Vendor } from '../api/types';
import { Button, Card, EmptyState, Field, Input, Modal, Textarea } from '../components/ui';

const CATEGORIES = ['Venue', 'Catering', 'Photography', 'Videography', 'Florist', 'Music/DJ', 'Rentals', 'Decor', 'Other'];

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    category: CATEGORIES[0],
    contactName: '',
    email: '',
    phone: '',
    priceRange: '',
    notes: '',
  });

  const load = () => api.get('/vendors').then((res) => setVendors(res.data.vendors));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/vendors', form);
      setForm({ name: '', category: CATEGORIES[0], contactName: '', email: '', phone: '', priceRange: '', notes: '' });
      setOpen(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create vendor'));
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Remove this vendor?')) return;
    await api.delete(`/vendors/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Vendors</h1>
          <p className="mt-1 text-sm text-neutral-500">Your directory of caterers, venues, photographers and more.</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ New vendor</Button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : vendors.length === 0 ? (
        <EmptyState title="No vendors yet" subtitle="Add a vendor to start booking them on events." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Card key={vendor.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-neutral-900">{vendor.name}</p>
                  <p className="text-xs text-neutral-500">{vendor.category}</p>
                </div>
                <button onClick={() => onDelete(vendor.id)} className="text-xs text-neutral-400 hover:text-red-600">
                  Remove
                </button>
              </div>
              <dl className="mt-3 space-y-1 text-xs text-neutral-600">
                {vendor.contactName && <p>{vendor.contactName}</p>}
                {vendor.email && <p>{vendor.email}</p>}
                {vendor.phone && <p>{vendor.phone}</p>}
                {vendor.priceRange && <p className="font-medium text-neutral-700">{vendor.priceRange}</p>}
              </dl>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New vendor">
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Category">
            <select
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact name">
              <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            </Field>
            <Field label="Price range">
              <Input placeholder="$$" value={form.priceRange} onChange={(e) => setForm({ ...form, priceRange: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full">
            Save vendor
          </Button>
        </form>
      </Modal>
    </div>
  );
}
