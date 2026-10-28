'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Clock, SearchX, ClipboardList } from 'lucide-react';
import { useData, DAY_MS } from '@/components/DataProvider';
import TaskModal from '@/components/TaskModal';
import { Avatar, Counts, Crumbs, EmptyState, PriorityBadge, StatusBadge, STATUSES } from '@/components/ui';

const RANK = { High: 0, Medium: 1, Low: 2 };
const timeLeft = (iso, now) => {
  const m = Math.max(0, Math.floor((DAY_MS - (now - Date.parse(iso))) / 60000));
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

export default function WorkerPage() {
  const { teamId, workerId } = useParams();
  const { teams, workers, tasks, loading, now, addTask, updateTask, deleteTask } = useData();
  const [editing, setEditing] = useState(null); // null = closed, {} = new task, task = edit
  const worker = workers.find(w => w.id === workerId);
  const team = teams.find(t => t.id === teamId);

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70" />;
  if (!worker || !team) {
    return (
      <EmptyState icon={SearchX} title="Worker not found" hint="They may have been removed.">
        <Link href="/" className="btn btn-primary">Back to teams</Link>
      </EmptyState>
    );
  }
  const mine = tasks
    .filter(t => t.worker_id === worker.id)
    .sort((a, b) => RANK[a.priority] - RANK[b.priority] || a.created_at.localeCompare(b.created_at));
  const save = values => (editing.id ? updateTask(editing.id, values) : addTask({ ...values, worker_id: worker.id }));

  return (
    <>
      <Crumbs items={[{ label: 'Teams', href: '/' }, { label: team.name, href: `/teams/${team.id}` }, { label: worker.name }]} />
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={worker.name} size="h-14 w-14" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{worker.name}</h1>
            <div className="mt-1.5"><Counts tasks={mine} /></div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={16} /> Add task</button>
      </div>

      {!mine.length ? (
        <EmptyState icon={ClipboardList} title="No tasks yet" hint="Add a task and pick a priority based on current workload.">
          <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={16} /> Add task</button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {STATUSES.map(s => {
            const items = mine.filter(t => t.status === s);
            return (
              <section key={s} className="rounded-2xl bg-slate-100/70 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <StatusBadge status={s} />
                  <span className="text-xs font-medium text-slate-500">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.map(t => (
                    <article key={t.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-slate-900">{t.title}</h3>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      {t.description && <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-sm text-slate-500">{t.description}</p>}
                      {t.status === 'Finished' && t.finished_at && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-emerald-700">
                          <Clock size={12} /> Auto-removes in {timeLeft(t.finished_at, now)}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <select aria-label="Change status" value={t.status} className="input min-w-0 flex-1 py-1.5"
                          onChange={e => updateTask(t.id, { status: e.target.value }).catch(() => {})}>
                          {STATUSES.map(x => <option key={x}>{x}</option>)}
                        </select>
                        <button aria-label="Edit task" onClick={() => setEditing(t)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"><Pencil size={16} /></button>
                        <button aria-label="Delete task" onClick={() => confirm('Delete this task?') && deleteTask(t.id).catch(() => {})} className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </article>
                  ))}
                  {!items.length && <p className="py-6 text-center text-xs text-slate-400">No tasks</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <TaskModal open={!!editing} task={editing} workerTasks={mine} onClose={() => setEditing(null)} onSave={save} />
    </>
  );
}
