import { useState, useEffect } from 'react';
import { loadAllUsersProgressSummary, loadAllUsersProgress, ProgressRow } from '../../lib/moduleProgress';
import { curriculum } from '../modules/curriculum';
import { ChevronDown, ChevronRight, CheckCircle2, Trophy, Users, BarChart2, RefreshCw } from 'lucide-react';

const moduleColors: Record<string, string> = {
  'module-1': 'bg-emerald-500',
  'module-2': 'bg-cyan-500',
  'module-3': 'bg-sky-500',
  'module-4': 'bg-amber-500',
  'module-5': 'bg-orange-500',
  'module-6': 'bg-rose-500',
  'module-7': 'bg-teal-500',
  'module-8': 'bg-violet-500',
  'module-9': 'bg-pink-500',
  'module-10': 'bg-red-500',
};

const TOTAL_TASKS = curriculum.reduce((acc, m) => acc + m.tasks.length, 0);

interface UserSummary {
  username: string;
  total: number;
  by_module: Record<string, number>;
}

export default function ModuleProgressViewer() {
  const [summaries, setSummaries] = useState<UserSummary[]>([]);
  const [allRows, setAllRows] = useState<ProgressRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'students' | 'activity'>('students');

  const load = async () => {
    setLoading(true);
    const [sums, rows] = await Promise.all([
      loadAllUsersProgressSummary(),
      loadAllUsersProgress(),
    ]);
    setSummaries(sums.sort((a, b) => b.total - a.total));
    setAllRows(rows);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getUserRows = (username: string) => allRows.filter(r => r.username === username);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-slate-500 border-t-slate-200 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Module Progress</h2>
          <p className="text-sm text-slate-500 mt-0.5">{summaries.length} students · {TOTAL_TASKS} tasks total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setView('students')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'students' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Users size={12} />
              Students
            </button>
            <button
              onClick={() => setView('activity')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'activity' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <BarChart2 size={12} />
              Activity
            </button>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {view === 'students' ? (
        <StudentsView
          summaries={summaries}
          expanded={expanded}
          onToggle={(u) => setExpanded(expanded === u ? null : u)}
          getUserRows={getUserRows}
        />
      ) : (
        <ActivityView allRows={allRows} />
      )}
    </div>
  );
}

function StudentsView({ summaries, expanded, onToggle, getUserRows }: {
  summaries: UserSummary[];
  expanded: string | null;
  onToggle: (u: string) => void;
  getUserRows: (u: string) => ProgressRow[];
}) {
  if (summaries.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Trophy size={32} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No student progress recorded yet.</p>
        <p className="text-xs mt-1 text-slate-500">Progress is saved when students log in and mark tasks as done.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {summaries.map((student) => {
        const pct = Math.round((student.total / TOTAL_TASKS) * 100);
        const isExp = expanded === student.username;
        const rows = isExp ? getUserRows(student.username) : [];

        return (
          <div key={student.username} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => onToggle(student.username)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-white">{student.username[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-sm">{student.username}</span>
                  <span className="text-xs text-slate-400">{student.total} / {TOTAL_TASKS} tasks</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[200px]">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">{pct}%</span>
                </div>
              </div>
              {/* Per-module dots */}
              <div className="hidden md:flex gap-1 shrink-0">
                {curriculum.map((mod) => {
                  const done = student.by_module[mod.id] || 0;
                  const barPct = Math.round((done / mod.tasks.length) * 100);
                  const bg = moduleColors[mod.id] || 'bg-slate-500';
                  return (
                    <div key={mod.id} title={`${mod.title}: ${done}/${mod.tasks.length}`} className="flex flex-col items-center gap-0.5">
                      <div className="w-3 h-8 bg-slate-100 rounded-sm overflow-hidden relative">
                        <div
                          className={`absolute bottom-0 left-0 right-0 ${bg} opacity-80 rounded-sm transition-all`}
                          style={{ height: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {isExp ? <ChevronDown size={14} className="text-slate-400 shrink-0" /> : <ChevronRight size={14} className="text-slate-400 shrink-0" />}
            </button>

            {isExp && (
              <div className="border-t border-slate-100 px-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {curriculum.map((mod) => {
                    const completedCount = student.by_module[mod.id] || 0;
                    const modPct = Math.round((completedCount / mod.tasks.length) * 100);
                    const modRows = rows.filter(r => r.module_id === mod.id);
                    const bg = moduleColors[mod.id] || 'bg-slate-500';

                    return (
                      <div key={mod.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-700">{mod.title}</span>
                          <span className="text-[10px] text-slate-400">{completedCount}/{mod.tasks.length}</span>
                        </div>
                        <div className="h-1 bg-slate-200 rounded-full overflow-hidden mb-2">
                          <div className={`h-full ${bg} opacity-70 rounded-full transition-all`} style={{ width: `${modPct}%` }} />
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {mod.tasks.map((task, i) => {
                            const done = !!modRows.find(r => r.task_index === i);
                            return (
                              <div
                                key={i}
                                title={`Task ${i + 1}: ${task.title}`}
                                className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold border ${
                                  done
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                    : 'bg-slate-100 border-slate-200 text-slate-400'
                                }`}
                              >
                                {done ? <CheckCircle2 size={10} className="text-emerald-500" /> : <span>{i + 1}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActivityView({ allRows }: { allRows: ProgressRow[] }) {
  const recent = [...allRows].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()).slice(0, 50);

  if (recent.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <BarChart2 size={32} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 text-xs font-medium text-slate-500 grid grid-cols-4 gap-3">
        <span>Student</span>
        <span>Module</span>
        <span>Task</span>
        <span>Completed</span>
      </div>
      <div className="divide-y divide-slate-50">
        {recent.map((row) => {
          const mod = curriculum.find(m => m.id === row.module_id);
          const task = mod?.tasks[row.task_index];
          const bg = moduleColors[row.module_id] || 'bg-slate-400';
          const date = new Date(row.completed_at);

          return (
            <div key={`${row.username}-${row.task_id}`} className="px-5 py-2.5 grid grid-cols-4 gap-3 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
              <span className="font-medium text-slate-800">{row.username}</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${bg} shrink-0`} />
                <span className="truncate">{mod?.title || row.module_id}</span>
              </div>
              <span className="text-slate-500 truncate">{task?.title || `Task ${row.task_index + 1}`}</span>
              <span className="text-slate-400">{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
