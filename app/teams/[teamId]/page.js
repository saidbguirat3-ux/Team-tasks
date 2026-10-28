'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Plus, UserPlus, SearchX, Trash2 } from 'lucide-react';
import { useData } from '@/components/DataProvider';
import { Avatar, Counts, Crumbs, EmptyState, GridSkeleton, NameModal } from '@/components/ui';

export default function TeamPage() {
  const { teamId } = useParams();
  const { teams, workers, tasks, loading, addWorker, deleteWorker } = useData();
  const [open, setOpen] = useState(false);
  const team = teams.find(t => t.id === teamId);

  if (loading) return <GridSkeleton />;
  if (!team) {
    return (
      <EmptyState icon={SearchX} title="Team not found" hint="It may have been deleted.">
        <Link href="/" className="btn btn-primary">Back to teams</Link>
      </EmptyState>
    );
  }
  const members = workers.filter(w => w.team_id === team.id);

  return (
    <>
      <Crumbs items={[{ label: 'Teams', href: '/' }, { label: team.name }]} />
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{team.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add worker</button>
      </div>

      {!members.length ? (
        <EmptyState icon={UserPlus} title="No workers in this team" hint="Add the first teammate to start assigning tasks.">
          <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add worker</button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map(w => (
            <div key={w.id} className="group relative rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-300 hover:shadow-md">
              <Link href={`/teams/${team.id}/workers/${w.id}`} className="flex items-center gap-3 p-5">
                <Avatar name={w.name} />
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-slate-900">{w.name}</h2>
                  <div className="mt-1.5"><Counts tasks={tasks.filter(k => k.worker_id === w.id)} /></div>
                </div>
              </Link>
              <button aria-label={`Delete ${w.name}`}
                onClick={() => confirm(`Delete ${w.name} and all their tasks?`) && deleteWorker(w.id).catch(() => {})}
                className="absolute right-3 top-3 rounded-md p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <NameModal open={open} onClose={() => setOpen(false)} title={`Add worker to ${team.name}`} label="Worker name"
        placeholder="e.g. Amira" submitLabel="Add worker" onSubmit={name => addWorker(team.id, name)} />
    </>
  );
}
