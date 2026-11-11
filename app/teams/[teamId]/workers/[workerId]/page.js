'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Clock, SearchX, ClipboardList, GripVertical } from 'lucide-react';
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, pointerWithin, useDroppable, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useData, DAY_MS } from '@/components/DataProvider';
import TaskModal from '@/components/TaskModal';
import { Avatar, Counts, Crumbs, EmptyState, PriorityBadge, StatusBadge, STATUSES } from '@/components/ui';

const RANK = { High: 0, Medium: 1, Low: 2 };
const COL = 'col:';
const isCol = id => String(id).startsWith(COL);
const pos = t => t.position ?? 0;
const timeLeft = (iso, now) => {
  const m = Math.max(0, Math.floor((DAY_MS - (now - Date.parse(iso))) / 60000));
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};
// A position number that puts a card between two neighbours (either may be missing)
const between = (before, after) =>
  before && after ? (pos(before) + pos(after)) / 2 : before ? pos(before) + 1 : after ? pos(after) - 1 : Date.now() / 1000;

// Prefer the card under the pointer; fall back to the column; then to the nearest thing
const collide = args => {
  const hits = pointerWithin(args);
  const card = hits.find(h => !isCol(h.id));
  if (card) return [card];
  if (hits.length) return hits;
  return closestCenter(args);
};

function CardContent({ t, now, handleProps, onStatus, onEdit, onDelete }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-1.5">
          {handleProps ? (
            <button type="button" aria-label="Drag to move" title="Drag to move" {...handleProps}
              className="-ml-1 mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing">
              <GripVertical size={16} />
            </button>
          ) : (
            <span className="-ml-1 mt-0.5 shrink-0 p-0.5 text-slate-400"><GripVertical size={16} /></span>
          )}
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
          onChange={e => onStatus?.(t, e.target.value)}>
          {STATUSES.map(x => <option key={x}>{x}</option>)}
        </select>
        <button aria-label="Edit task" onClick={() => onEdit?.(t)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"><Pencil size={16} /></button>
        <button aria-label="Delete task" onClick={() => onDelete?.(t)} className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
      </div>
    </>
  );
}

function SortableCard(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.t.id });
  return (
    <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${isDragging ? 'opacity-40' : ''}`}>
      <CardContent {...props} handleProps={{ ...attributes, ...listeners }} />
    </article>
  );
}

function Column({ status, items, highlight, children }) {
  const { setNodeRef } = useDroppable({ id: COL + status });
  return (
    <section className={`flex flex-col rounded-2xl p-3 transition-colors ${highlight ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-slate-100/70'}`}>
      <div className="mb-3 flex items-center justify-between px-1">
        <StatusBadge status={status} />
        <span className="text-xs font-medium text-slate-500">{items.length}</span>
      </div>
      <SortableContext items={items.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="min-h-[120px] flex-1 space-y-3">
          {children}
          {!items.length && <p className="py-6 text-center text-xs text-slate-400">No tasks — drop one here</p>}
        </div>
      </SortableContext>
    </section>
  );
}

export default function WorkerPage() {
  const { teamId, workerId } = useParams();
  const { teams, workers, tasks, loading, now, addTask, updateTask, deleteTask } = useData();
  const [editing, setEditing] = useState(null); // null = closed, {} = new task, task = edit
  const [pending, setPending] = useState({}); // changes shown instantly while the server confirms
  const [activeId, setActiveId] = useState(null);
  const [overCol, setOverCol] = useState(null);
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
  const mine = tasks
    .filter(t => t.worker_id === worker.id)
    .map(t => (pending[t.id] ? { ...t, ...pending[t.id] } : t))
    .sort((a, b) => pos(a) - pos(b) || a.created_at.localeCompare(b.created_at));

  // Where a task lands when it is created or moved with the dropdown / edit form:
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

  const commit = (id, values) => {
    setPending(s => ({ ...s, [id]: values }));
    updateTask(id, values)
      .catch(() => {})
      .finally(() => setPending(s => { const { [id]: _drop, ...rest } = s; return rest; }));
  };

  const colOf = id => (isCol(id) ? String(id).slice(COL.length) : mine.find(t => t.id === id)?.status ?? null);

  const onDragEnd = ({ active, over }) => {
    setActiveId(null);
    setOverCol(null);
    if (!over || active.id === over.id) return;
    const t = mine.find(x => x.id === active.id);
    const status = colOf(over.id);
    if (!t || !status) return;

    const col = mine.filter(x => x.status === status);
    const rest = col.filter(x => x.id !== t.id);
    let idx;
    if (isCol(over.id)) idx = rest.length; // dropped on empty space in a column -> bottom
    else if (t.status === status) idx = col.findIndex(x => x.id === over.id); // same column: take the target's place
    else {
      // other column: above or below the card we are hovering, depending on where the dragged card is
      const r = active.rect.current.translated;
      const below = r && r.top + r.height / 2 > over.rect.top + over.rect.height / 2;
      idx = rest.findIndex(x => x.id === over.id) + (below ? 1 : 0);
    }
    commit(t.id, { status, position: between(rest[idx - 1], rest[idx]) });
  };

  const changeStatus = (t, status) => commit(t.id, { status, position: slot(status, t.priority, t.id) });

  const save = values => {
    if (!editing.id) return addTask({ ...values, worker_id: worker.id, position: slot(values.status, values.priority) });
    const extra = values.status !== editing.status ? { position: slot(values.status, values.priority, editing.id) } : {};
    return updateTask(editing.id, { ...values, ...extra });
  };

  const dragged = mine.find(t => t.id === activeId);

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
        <DndContext id="board" sensors={sensors} collisionDetection={collide}
          onDragStart={e => setActiveId(e.active.id)}
          onDragOver={e => setOverCol(e.over ? colOf(e.over.id) : null)}
          onDragCancel={() => { setActiveId(null); setOverCol(null); }}
          onDragEnd={onDragEnd}>
          <div className="grid gap-4 lg:grid-cols-3">
            {STATUSES.map(s => {
              const items = mine.filter(t => t.status === s);
              return (
                <Column key={s} status={s} items={items} highlight={!!dragged && overCol === s && dragged.status !== s}>
                  {items.map(t => (
                    <SortableCard key={t.id} t={t} now={now}
                      onStatus={changeStatus}
                      onEdit={setEditing}
                      onDelete={x => confirm('Delete this task?') && deleteTask(x.id).catch(() => {})} />
                  ))}
                </Column>
              );
            })}
          </div>
          <DragOverlay dropAnimation={null}>
            {dragged && (
              <article className="rounded-xl border border-indigo-300 bg-white p-4 shadow-xl ring-2 ring-indigo-200">
                <CardContent t={dragged} now={now} />
              </article>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <TaskModal open={!!editing} task={editing} workerTasks={mine} onClose={() => setEditing(null)} onSave={save} />
    </>
  );
}
