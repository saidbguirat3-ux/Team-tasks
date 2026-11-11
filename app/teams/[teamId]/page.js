'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useData } from '@/components/DataProvider';
import { Avatar, Counts, Crumbs, EmptyState, GridSkeleton, NameModal, teamIcon, teamTheme } from '@/components/ui';

export default function TeamPage() {
  const { teamId } = useParams();
  const { teams, workers, tasks, loading, addWorker, deleteWorker } = useData();
  const [open, setOpen] = useState(false);
  const team = teams.find(t => t.id === teamId);

  if (loading) return <GridSkeleton />;
  if (!team) {
    return (
      <EmptyState title="Team not found" hint="It may have been deleted.">
        <Link href="/" className="btn btn-primary">Back to teams</Link>
      </EmptyState>
    );
  }
  const members = workers.filter(w => w.team_id === team.id);
  const theme = teamTheme(team.name);
  const Icon = teamIcon(team.name);

  return (
    <>
      <Crumbs items={[{ label: 'Teams', href: '/' }, { label: team.name }]} />
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${theme.blob}`}><Icon size={28} /></span>
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">{team.name}</h1>
            <p className="text-slate-500">{members.length ? `${members.length} ${members.length === 1 ? 'member' : 'members'}. Pick someone to see their tasks.` : 'No members yet.'}</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add worker</button>
      </div>

      {!members.length ? (
        <EmptyState title="No workers in this team" hint="Add the first teammate to start assigning tasks.">
          <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add worker</button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map(w => {
            const mine = tasks.filter(k => k.worker_id === w.id);
            const active = mine.filter(k => k.status === 'Working On').length;
            return (
              <div key={w.id} className={`group relative rounded-3xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${theme.hover}`}>
                <Link href={`/teams/${team.id}/workers/${w.id}`} className="flex items-center gap-4 rounded-3xl p-5">
                  <Avatar name={w.name} size="h-14 w-14" />
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-lg font-semibold text-ink">{w.name}</h2>
                    <p className="text-sm text-slate-500">{active ? `${active} active ${active === 1 ? 'task' : 'tasks'}` : 'No active tasks'}</p>
                    <div className="mt-2"><Counts tasks={mine} /></div>
                  </div>
                </Link>
                <button aria-label={`Delete ${w.name}`}
                  onClick={() => confirm(`Delete ${w.name} and all their tasks?`) && deleteWorker(w.id).catch(() => {})}
                  className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <NameModal open={open} onClose={() => setOpen(false)} title={`Add worker to ${team.name}`} label="Worker name"
        placeholder="e.g. Amira" submitLabel="Add worker" onSubmit={name => addWorker(team.id, name)} />
    </>
  );
}
