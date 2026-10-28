'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { X, ChevronRight, Activity, PauseCircle, CheckCircle2, Flag, LayoutDashboard, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useData } from './DataProvider';

export const STATUSES = ['Working On', 'Suspended', 'Finished'];
export const PRIORITIES = ['High', 'Medium', 'Low'];

const STATUS_STYLE = {
  'Working On': { cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', Icon: Activity },
  Suspended: { cls: 'bg-red-50 text-red-700 ring-red-600/20', Icon: PauseCircle },
  Finished: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', Icon: CheckCircle2 },
};
const PRIORITY_STYLE = {
  High: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Medium: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  Low: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};
const pill = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset';

export function StatusBadge({ status }) {
  const { cls, Icon } = STATUS_STYLE[status];
  return <span className={`${pill} ${cls}`}><Icon size={12} />{status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`${pill} shrink-0 ${PRIORITY_STYLE[priority]}`}><Flag size={11} />{priority}</span>;
}

export function Counts({ tasks }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUSES.map(s => {
        const { cls, Icon } = STATUS_STYLE[s];
        return <span key={s} title={s} className={`${pill} ${cls}`}><Icon size={12} />{tasks.filter(t => t.status === s).length}</span>;
      })}
    </div>
  );
}

export function Avatar({ name, size = 'h-11 w-11' }) {
  const initials = name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
  return <div className={`${size} flex shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700`}>{initials}</div>;
}

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative max-h-[90vh] w-full max-w-lg animate-pop overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function NameForm({ label, placeholder, submitLabel, onSubmit, onClose }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try { await onSubmit(name.trim()); onClose(); } catch {} finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4 p-5">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        <input autoFocus className="input mt-1" value={name} onChange={e => setName(e.target.value)} placeholder={placeholder} />
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={busy || !name.trim()}>{submitLabel}</button>
      </div>
    </form>
  );
}

export function NameModal({ open, onClose, title, ...form }) {
  return <Modal open={open} onClose={onClose} title={title}><NameForm onClose={onClose} {...form} /></Modal>;
}

export function Crumbs({ items }) {
  return (
    <nav className="mb-5 flex flex-wrap items-center gap-1 text-sm text-slate-500">
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} />}
          {c.href ? <Link href={c.href} className="hover:text-indigo-600">{c.label}</Link> : <span className="font-medium text-slate-800">{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Header() {
  const { connected } = useData();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white"><LayoutDashboard size={18} /></span>
          Team Task Hub
        </Link>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
          {connected ? 'Live' : 'Connecting…'}
        </span>
      </div>
    </header>
  );
}

export function ErrorBanner() {
  const { error, clearError } = useData();
  if (!error) return null;
  return (
    <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <p className="flex-1">{error}</p>
      <button onClick={clearError} aria-label="Dismiss"><X size={16} /></button>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <Icon className="mx-auto text-slate-400" size={32} />
      <h3 className="mt-3 font-medium text-slate-900">{title}</h3>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export const GridSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {[0, 1, 2, 3].map(i => <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200/70" />)}
  </div>
);
