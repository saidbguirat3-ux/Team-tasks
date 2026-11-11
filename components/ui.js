'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  X, ChevronRight, Activity, PauseCircle, CheckCircle2, Flag, AlertTriangle,
  ShieldCheck, Radar, Network, Server, Users,
} from 'lucide-react';
import { useData } from './DataProvider';

export const STATUSES = ['Working On', 'Suspended', 'Finished'];
export const PRIORITIES = ['High', 'Medium', 'Low'];

export const STATUS_STYLE = {
  'Working On': { pill: 'bg-amber-100 text-amber-800 ring-amber-500/25', col: 'bg-amber-50/80', label: 'in progress', Icon: Activity },
  Suspended: { pill: 'bg-rose-100 text-rose-800 ring-rose-500/25', col: 'bg-rose-50/80', label: 'suspended', Icon: PauseCircle },
  Finished: { pill: 'bg-emerald-100 text-emerald-800 ring-emerald-500/25', col: 'bg-emerald-50/80', label: 'finished', Icon: CheckCircle2 },
};
const PRIORITY_STYLE = {
  High: 'bg-rose-100 text-rose-700 ring-rose-500/25',
  Medium: 'bg-indigo-100 text-indigo-700 ring-indigo-500/25',
  Low: 'bg-slate-100 text-slate-600 ring-slate-400/30',
};
export const PRIORITY_BAR = { High: 'border-l-rose-400', Medium: 'border-l-indigo-400', Low: 'border-l-slate-300' };
const pill = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset';

/* ---------- Mascot: a friendly shield with a "done" badge ---------- */
export function Mascot({ size = 40, mood = 'happy', blink = false, className = '' }) {
  const sleepy = mood === 'sleepy';
  const eye = cx => (
    <g key={cx}>
      <ellipse cx={cx} cy="29" rx="5" ry="5.8" fill="#fff" />
      <circle cx={cx + 1} cy="30" r="3" fill="#1B2340" />
      <circle cx={cx + 2} cy="28.8" r="1" fill="#fff" />
    </g>
  );
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Team Task Hub mascot" className={className}>
      <path d="M32 4C39 8.5 48 10.5 56 10.5V31C56 45.5 46.5 54.5 32 60C17.5 54.5 8 45.5 8 31V10.5C16 10.5 25 8.5 32 4Z" fill="#4A5CF0" />
      <ellipse cx="20" cy="18" rx="6" ry="3.2" fill="#fff" opacity=".28" transform="rotate(-25 20 18)" />
      {sleepy ? (
        <>
          <path d="M18.5 29q5 4.5 10 0M35.5 29q5 4.5 10 0" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <ellipse cx="32" cy="40.5" rx="2.4" ry="2" fill="#fff" />
        </>
      ) : (
        <>
          <g className={blink ? 'mascot-blink' : undefined}>{eye(23.5)}{eye(40.5)}</g>
          <path d="M26.5 38.5q5.5 6 11 0" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        </>
      )}
      <circle cx="16.5" cy="37.5" r="3.2" fill="#FF8FA3" opacity=".75" />
      <circle cx="47.5" cy="37.5" r="3.2" fill="#FF8FA3" opacity=".75" />
      <circle cx="50" cy="50" r="10" fill="#2FBF8F" stroke="#fff" strokeWidth="3" />
      <path d="M45.5 50.2l3.2 3.2 5.6-6.4" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {sleepy && <text x="55" y="12" fontSize="10" fontWeight="700" fill="#1B2340">z</text>}
    </svg>
  );
}

/* ---------- Colour helpers: every team and person gets their own colour ---------- */
const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const AVATARS = [
  'bg-violet-200 text-violet-800', 'bg-sky-200 text-sky-800', 'bg-rose-200 text-rose-800', 'bg-amber-200 text-amber-800',
  'bg-emerald-200 text-emerald-800', 'bg-fuchsia-200 text-fuchsia-800', 'bg-teal-200 text-teal-800',
];
const THEMES = [
  { blob: 'bg-violet-100 text-violet-600', hover: 'hover:border-violet-300' },
  { blob: 'bg-rose-100 text-rose-600', hover: 'hover:border-rose-300' },
  { blob: 'bg-sky-100 text-sky-600', hover: 'hover:border-sky-300' },
  { blob: 'bg-emerald-100 text-emerald-600', hover: 'hover:border-emerald-300' },
  { blob: 'bg-amber-100 text-amber-600', hover: 'hover:border-amber-300' },
  { blob: 'bg-fuchsia-100 text-fuchsia-600', hover: 'hover:border-fuchsia-300' },
];
const KNOWN = { 'data protection': 0, soc: 1, network: 2, system: 3 };
const ICONS = { 'data protection': ShieldCheck, soc: Radar, network: Network, system: Server };
export const teamTheme = name => THEMES[KNOWN[name.toLowerCase()] ?? hash(name.toLowerCase()) % THEMES.length];
export const teamIcon = name => ICONS[name.toLowerCase()] || Users;

export function StatusBadge({ status }) {
  const { pill: cls, Icon } = STATUS_STYLE[status];
  return <span className={`${pill} ${cls}`}><Icon size={12} />{status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`${pill} shrink-0 ${PRIORITY_STYLE[priority]}`}><Flag size={11} />{priority}</span>;
}

export function Counts({ tasks, labels = false }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUSES.map(s => {
        const { pill: cls, Icon, label } = STATUS_STYLE[s];
        const n = tasks.filter(t => t.status === s).length;
        return (
          <span key={s} title={s} className={`${pill} ${cls}`}>
            <Icon size={12} />{n}{labels && <span className="font-medium">{label}</span>}
          </span>
        );
      })}
    </div>
  );
}

export function Avatar({ name, size = 'h-11 w-11' }) {
  const initials = name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`${size} flex shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ring-2 ring-white ${AVATARS[hash(name.toLowerCase()) % AVATARS.length]}`}>
      {initials}
    </div>
  );
}

export function AvatarStack({ names, max = 4 }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map(n => <Avatar key={n} name={n} size="h-8 w-8" />)}
      {extra > 0 && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 ring-2 ring-white">+{extra}</div>
      )}
    </div>
  );
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
      <div className="absolute inset-0 animate-fade bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative max-h-[90vh] w-full max-w-lg animate-pop overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={18} /></button>
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
      <label className="block text-sm font-semibold text-slate-700">
        {label}
        <input autoFocus className="input mt-1 font-normal" value={name} onChange={e => setName(e.target.value)} placeholder={placeholder} />
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
          {c.href ? <Link href={c.href} className="rounded font-medium hover:text-brand">{c.label}</Link> : <span className="font-semibold text-ink">{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Header() {
  const { connected } = useData();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 rounded-xl">
          <Mascot size={40} blink />
          <span className="leading-tight">
            <span className="block font-display text-xl font-semibold text-ink">Team Task Hub</span>
            <span className="hidden text-xs text-slate-500 sm:block">Who’s working on what</span>
          </span>
        </Link>
        <span
          title={connected ? 'Changes from your teammates appear instantly' : 'Reconnecting to live updates. Your changes still save.'}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          <span className="relative flex h-2 w-2">
            {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </span>
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
    <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <p className="flex-1">{error}</p>
      <button onClick={clearError} aria-label="Dismiss"><X size={16} /></button>
    </div>
  );
}

export function EmptyState({ title, hint, mood = 'sleepy', children }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-300/80 bg-white/70 px-6 py-12 text-center">
      <Mascot size={72} mood={mood} className="mx-auto" />
      <h3 className="mt-4 font-display text-xl font-semibold text-ink">{title}</h3>
      {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export const GridSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {[0, 1, 2, 3].map(i => <div key={i} className="h-44 animate-pulse rounded-3xl bg-slate-200/70" />)}
  </div>
);
