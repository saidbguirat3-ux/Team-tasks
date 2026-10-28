'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, Users, ShieldCheck, Radar, Network, Server, Trash2 } from 'lucide-react';
import { useData } from '@/components/DataProvider';
import { NameModal, EmptyState, GridSkeleton, Counts } from '@/components/ui';

const ICONS = { 'data protection': ShieldCheck, soc: Radar, network: Network, system: Server };

export default function Home() {
  const { teams, workers, tasks, loading, addTeam, deleteTeam } = useData();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Teams</h1>
          <p className="mt-1 text-sm text-slate-500">Pick a team to see its people and their tasks.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add team</button>
      </div>

      {loading ? <GridSkeleton /> : !teams.length ? (
        <EmptyState icon={Users} title="No teams yet" hint="Create the first team to get started.">
          <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add team</button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map(t => {
            const members = workers.filter(w => w.team_id === t.id);
            const ids = new Set(members.map(w => w.id));
            const teamTasks = tasks.filter(k => ids.has(k.worker_id));
            const Icon = ICONS[t.name.toLowerCase()] || Users;
            return (
              <div key={t.id} className="group relative rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-300 hover:shadow-md">
                <Link href={`/teams/${t.id}`} className="block p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={20} /></span>
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">{t.name}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
                  <div className="mt-4"><Counts tasks={teamTasks} /></div>
                </Link>
                <button aria-label={`Delete ${t.name}`}
                  onClick={() => confirm(`Delete team "${t.name}" with all its workers and tasks?`) && deleteTeam(t.id).catch(() => {})}
                  className="absolute right-3 top-3 rounded-md p-1.5 text-slate-300 opacity-100 hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100">
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
