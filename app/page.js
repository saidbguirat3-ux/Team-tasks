'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useData } from '@/components/DataProvider';
import { NameModal, EmptyState, GridSkeleton, Counts, AvatarStack, teamTheme, teamIcon } from '@/components/ui';

export default function Home() {
  const { teams, workers, tasks, loading, addTeam, deleteTeam } = useData();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Your teams</h1>
          <p className="mt-1 text-slate-500">Pick a team to see its people and what they’re working on.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add team</button>
      </div>

      {!loading && teams.length > 0 && <div className="mb-8"><Counts tasks={tasks} labels /></div>}

      {loading ? <GridSkeleton /> : !teams.length ? (
        <EmptyState title="No teams yet" hint="Create your first team to get started.">
          <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add team</button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map(t => {
            const members = workers.filter(w => w.team_id === t.id);
            const ids = new Set(members.map(w => w.id));
            const teamTasks = tasks.filter(k => ids.has(k.worker_id));
            const theme = teamTheme(t.name);
            const Icon = teamIcon(t.name);
            return (
              <div key={t.id} className={`group relative rounded-3xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${theme.hover}`}>
                <Link href={`/teams/${t.id}`} className="block rounded-3xl p-5">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme.blob}`}><Icon size={24} /></span>
                  <h2 className="mt-4 font-display text-xl font-semibold text-ink">{t.name}</h2>
                  <div className="mt-2 flex items-center gap-3">
                    {members.length > 0 && <AvatarStack names={members.map(w => w.name)} />}
                    <p className="text-sm text-slate-500">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
                  </div>
                  <div className="mt-4"><Counts tasks={teamTasks} /></div>
                </Link>
                <button aria-label={`Delete ${t.name}`}
                  onClick={() => confirm(`Delete team "${t.name}" with all its workers and tasks?`) && deleteTeam(t.id).catch(() => {})}
                  className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <NameModal open={open} onClose={() => setOpen(false)} title="Add team" label="Team name"
        placeholder="e.g. Cloud" submitLabel="Add team" onSubmit={addTeam} />
    </>
  );
}
