import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-xl border border-neutral-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const styles = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-300',
    secondary: 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    ghost: 'text-neutral-600 hover:bg-neutral-100',
  };
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed',
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
        props.className
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
        props.className
      )}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
        props.className
      )}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      {children}
    </label>
  );
}

const badgeColors: Record<string, string> = {
  LEAD: 'bg-neutral-100 text-neutral-700',
  PLANNING: 'bg-blue-50 text-blue-700',
  CONFIRMED: 'bg-emerald-50 text-emerald-700',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-violet-50 text-violet-700',
  CANCELLED: 'bg-red-50 text-red-700',
  TODO: 'bg-neutral-100 text-neutral-700',
  DONE: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  DECLINED: 'bg-red-50 text-red-700',
  LOW: 'bg-neutral-100 text-neutral-600',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-red-50 text-red-700',
  DRAFT: 'bg-neutral-100 text-neutral-700',
  SENT: 'bg-blue-50 text-blue-700',
  PARTIALLY_PAID: 'bg-amber-50 text-amber-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  OVERDUE: 'bg-red-50 text-red-700',
  INQUIRY: 'bg-neutral-100 text-neutral-700',
  BOOKED: 'bg-blue-50 text-blue-700',
};

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        badgeColors[value] ?? 'bg-neutral-100 text-neutral-700'
      )}
    >
      {value.replace(/_/g, ' ')}
    </span>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 py-14 text-center">
      <p className="text-sm font-medium text-neutral-700">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    value || 0
  );
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
