'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Clock, SearchX, ClipboardList, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useData, DAY_MS } from '@/components/DataProvider';
import TaskModal from '@/components/TaskModal';
import { Avatar, Counts, Crumbs, EmptyState, PriorityBadge, StatusBadge, STATUSES } from '@/components/ui';

const RANK = { High: 0, Medium: 1, Low: 2 };
const timeLeft = (iso, now) => {
  const m = Math.max(0, Math.floor((DAY_MS - (now - Date.parse(iso))) / 60000));
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};
// Keep dragged cards inside their own column's vertical lane
const verticalOnly = ({ transform }) => ({ ...transform, x: 0 });

function TaskCard({ t, now, onStatus, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: t.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <article ref={setNodeRef} style={style}
      className={`relative rounded-xl border bg-white p-4 shadow-sm ${isDragging ? 'z-10 border-indigo-300 opacity-90 shadow-lg ring-2 ring-indigo-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-1.5">
          <button type="button" aria-label="Drag to reorder" title="Drag to reorder" {...attributes} {...listeners}
            className="-ml-1 mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing">
            <GripVertical size={16} />
          </button>
          <h3 className="font-medium text-slate-900">{t.title}</h3>
        </div>
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
          onChange={e => onStatus(t, e.target.value)}>
          {STATUSES.map(x => <option key={x}>{x}</option>)}
        </select>
        <button aria-label="Edit task" onClick={() => onEdit(t)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"><Pencil size={16} /></button>
        <button aria-label="Delete task" onClick={() => onDelete(t)} className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
      </div>
    </article>
  );
}

export default function WorkerPage() {
  const { teamId, workerId } = useParams();
  const { teams, workers, tasks, loading, now, addTask, updateTask, deleteTask } = useData();
  const [editing, setEditing] = useState(null); // null = closed, {} = new task, task = edit
  const [pending, setPending] = useState({}); // positions applied instantly while the server confirms
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
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
  const pos = t => pending[t.id] ?? t.position ?? 0;
  const mine = tasks
    .filter(t => t.worker_id === worker.id)
    .sort((a, b) => pos(a) - pos(b) || a.created_at.localeCompare(b.created_at));

  // Where a task lands when it is created or moved to another column:
  // right after the last task of the same or higher priority (so High stays above Low by default).
  const slot = (status, priority, excludeId) => {
    const col = mine.filter(t => t.status === status && t.id !== excludeId);
    if (!col.length) return Date.now() / 1000;
    let i = -1;
    col.forEach((t, k) => { if (RANK[t.priority] <= RANK[priority]) i = k; });
    if (i === -1) return pos(col[0]) - 1;
    if (i === col.length - 1) return pos(col[i]) + 1;
    return (pos(col[i]) + pos(col[i + 1])) / 2;
  };

  const setPosition = (id, p) => {
    setPending(s => ({ ...s, [id]: p }));
    updateTask(id, { position: p })
      .catch(() => {})
      .finally(() => setPending(s => { const { [id]: _drop, ...rest } = s; return rest; }));
  };

  // Drag & drop inside one status column
  const onDragEnd = (items, { active, over }) => {
    if (!over || active.id === over.id) return;
    const to = items.findIndex(t => t.id === over.id);
    const rest = items.filter(t => t.id !== active.id);
    const before = rest[to - 1];
    const after = rest[to];
    const p = before && after ? (pos(before) + pos(after)) / 2 : before ? pos(before) + 1 : pos(after) - 1;
    setPosition(active.id, p);
  };

  const changeStatus = (t, status) =>
    updateTask(t.id, { status, position: slot(status, t.priority, t.id) }).catch(() => {});

  const save = values => {
    if (!editing.id) return addTask({ ...values, worker_id: worker.id, position: slot(values.status, values.priority) });
    const extra = values.status !== editing.status ? { position: slot(values.status, values.priority, editing.id) } : {};
    return updateTask(editing.id, { ...values, ...extra });
  };

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
                <DndContext id={`dnd-${s}`} sensors={sensors} collisionDetection={closestCenter}
                  modifiers={[verticalOnly]} onDragEnd={e => onDragEnd(items, e)}>
                  <SortableContext items={items.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {items.map(t => (
                        <TaskCard key={t.id} t={t} now={now}
                          onStatus={changeStatus}
                          onEdit={setEditing}
                          onDelete={x => confirm('Delete this task?') && deleteTask(x.id).catch(() => {})} />
                      ))}
                      {!items.length && <p className="py-6 text-center text-xs text-slate-400">No tasks</p>}
                    </div>
                  </SortableContext>
                </DndContext>
              </section>
            );
          })}
        </div>
      )}

      <TaskModal open={!!editing} task={editing} workerTasks={mine} onClose={() => setEditing(null)} onSave={save} />
    </>
  );
}
