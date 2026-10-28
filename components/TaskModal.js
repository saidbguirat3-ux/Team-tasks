'use client';
import { useState } from 'react';
import { Modal, PRIORITIES, STATUSES } from './ui';

const PICK = {
  High: 'border-rose-500 bg-rose-50 text-rose-700',
  Medium: 'border-indigo-500 bg-indigo-50 text-indigo-700',
  Low: 'border-slate-500 bg-slate-100 text-slate-700',
};

function Form({ task, workerTasks, onClose, onSave }) {
  const active = workerTasks.filter(t => t.status === 'Working On' && t.id !== task?.id);
  const count = p => active.filter(t => t.priority === p).length;
  const suggested = active.length >= 6 ? 'Low' : active.length >= 3 ? 'Medium' : 'High';
  const [f, setF] = useState(
    task?.id
      ? { title: task.title, description: task.description, priority: task.priority, status: task.status }
      : { title: '', description: '', priority: suggested, status: 'Working On' }
  );
  const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    try { await onSave({ ...f, title: f.title.trim(), description: f.description.trim() }); onClose(); } catch {} finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4 p-5">
      <label className="block text-sm font-medium text-slate-700">
        Title
        <input autoFocus required className="input mt-1" value={f.title} onChange={set('title')} placeholder="e.g. Review firewall rules" />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Description
        <textarea rows={3} className="input mt-1" value={f.description} onChange={set('description')} placeholder="What needs to be done?" />
      </label>
      <div>
        <p className="text-sm font-medium text-slate-700">Priority</p>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {PRIORITIES.map(p => (
            <button type="button" key={p} onClick={() => setF({ ...f, priority: p })}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${f.priority === p ? PICK[p] : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
              {p}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Current workload: {active.length} active ({count('High')} high, {count('Medium')} medium, {count('Low')} low). Suggested priority: <b>{suggested}</b>.
        </p>
      </div>
      <label className="block text-sm font-medium text-slate-700">
        Status
        <select className="input mt-1" value={f.status} onChange={set('status')}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </label>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={busy || !f.title.trim()}>{task?.id ? 'Save changes' : 'Add task'}</button>
      </div>
    </form>
  );
}

export default function TaskModal({ open, task, workerTasks, onClose, onSave }) {
  return (
    <Modal open={open} onClose={onClose} title={task?.id ? 'Edit task' : 'Add task'}>
      <Form task={task} workerTasks={workerTasks} onClose={onClose} onSave={onSave} />
    </Modal>
  );
}
