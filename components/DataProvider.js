'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

const Ctx = createContext(null);
export const useData = () => useContext(Ctx);
export const DAY_MS = 24 * 60 * 60 * 1000;

const upsert = (set, row) =>
  set(prev => [...prev.filter(r => r.id !== row.id), row].sort((a, b) => a.created_at.localeCompare(b.created_at)));
const drop = (set, id) => set(prev => prev.filter(r => r.id !== id));

export function DataProvider({ children }) {
  const [teams, setTeams] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [rawTasks, setRawTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!supabase) {
      setError('Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.');
      setLoading(false);
      return;
    }
    const sweep = () => supabase.rpc('cleanup_finished_tasks').then(() => {});
    const load = async () => {
      await sweep();
      const [t, w, k] = await Promise.all(
        ['teams', 'workers', 'tasks'].map(n => supabase.from(n).select('*').order('created_at'))
      );
      const err = t.error || w.error || k.error;
      if (err) setError(err.message);
      else { setTeams(t.data); setWorkers(w.data); setRawTasks(k.data); }
      setLoading(false);
    };
    load();

    const sets = { teams: setTeams, workers: setWorkers, tasks: setRawTasks };
    let ch = supabase.channel('hub');
    Object.entries(sets).forEach(([table, set]) => {
      ch = ch.on('postgres_changes', { event: '*', schema: 'public', table }, p =>
        p.eventType === 'DELETE' ? drop(set, p.old.id) : upsert(set, p.new)
      );
    });
    let seen = false;
    ch.subscribe(s => {
      setConnected(s === 'SUBSCRIBED');
      if (s === 'SUBSCRIBED') { if (seen) load(); seen = true; } // resync after a dropped connection
    });

    const tick = setInterval(() => setNow(Date.now()), 30000);
    const sweeper = setInterval(sweep, 5 * 60000);
    return () => { supabase.removeChannel(ch); clearInterval(tick); clearInterval(sweeper); };
  }, []);

  const fail = e => { setError(e.message); throw e; };
  const insert = async (table, set, values) => {
    const { data, error } = await supabase.from(table).insert(values).select().single();
    if (error) fail(error);
    upsert(set, data);
    return data;
  };
  const update = async (table, set, id, values) => {
    const { data, error } = await supabase.from(table).update(values).eq('id', id).select().single();
    if (error) fail(error);
    upsert(set, data);
    return data;
  };
  const remove = async (table, set, id) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) fail(error);
    drop(set, id);
  };

  // Finished tasks older than 24h are hidden immediately; the database sweep deletes them for good.
  const tasks = useMemo(
    () => rawTasks.filter(t => t.status !== 'Finished' || !t.finished_at || now - Date.parse(t.finished_at) < DAY_MS),
    [rawTasks, now]
  );

  const value = {
    teams, workers, tasks, loading, connected, error, now,
    clearError: () => setError(null),
    addTeam: name => insert('teams', setTeams, { name }),
    deleteTeam: async id => {
      await remove('teams', setTeams, id);
      const ids = workers.filter(w => w.team_id === id).map(w => w.id);
      setWorkers(p => p.filter(w => w.team_id !== id));
      setRawTasks(p => p.filter(t => !ids.includes(t.worker_id)));
    },
    addWorker: (team_id, name) => insert('workers', setWorkers, { team_id, name }),
    deleteWorker: async id => {
      await remove('workers', setWorkers, id);
      setRawTasks(p => p.filter(t => t.worker_id !== id));
    },
    addTask: values => insert('tasks', setRawTasks, values),
    updateTask: (id, values) => update('tasks', setRawTasks, id, values),
    deleteTask: id => remove('tasks', setRawTasks, id),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
