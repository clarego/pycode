import { useState, useEffect } from 'react';
import {
  loadAllUsersProgressSummary,
  loadAllUsersProgress,
  resetModuleProgress,
  ProgressRow,
} from '../../lib/moduleProgress';
import { curriculum } from '../modules/curriculum';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Trophy,
  Users,
  BarChart2,
  RefreshCw,
  AlertCircle,
  Code2,
  X,
  Trash2,
  RotateCcw,
  Play,
} from 'lucide-react';
import SessionReview from '../SessionReview';

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

interface CodeModalProps {
  title: string;
  code: string;
  onClose: () => void;
}

function CodeModal({ title, code, onClose }: CodeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Code2 size={15} className="text-sky-400" />
            <span className="text-sm font-semibold text-white">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {code ? (
            <pre className="text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap break-words">
              {code}
            </pre>
          ) : (
            <p className="text-sm text-slate-500 italic text-center py-8">No code saved for this task.</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface ResetConfirmProps {
  username: string;
  moduleName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ResetConfirmModal({ username, moduleName, onConfirm, onCancel }: ResetConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 size={16} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Reset Module Progress</h3>
            <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-5">
          Remove all progress for <strong>{username}</strong> in <strong>{moduleName}</strong>? Their saved code will also be deleted.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Reset Progress
          </button>
        </div>
      </div>
    </div>
  );
}

interface ModuleProgressViewerProps {
  initialUser?: string | null;
  onClearUser?: () => void;
  hideUserBanner?: boolean;
}

export default function ModuleProgressViewer({ initialUser, onClearUser, hideUserBanner }: ModuleProgressViewerProps = {}) {
  const [summaries, setSummaries] = useState<UserSummary[]>([]);
  const [allRows, setAllRows] = useState<ProgressRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(initialUser ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'students' | 'activity'>('students');
  const [codeModal, setCodeModal] = useState<{ title: string; code: string } | null>(null);
  const [resetTarget, setResetTarget] = useState<{ username: string; moduleId: string; moduleName: string } | null>(null);
  const [resetting, setResetting] = useState(false);
  const [playbackShareId, setPlaybackShareId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sums, rows] = await Promise.all([
        loadAllUsersProgressSummary(),
        loadAllUsersProgress(),
      ]);
      setSummaries(sums.sort((a, b) => b.total - a.total));
      setAllRows(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (initialUser) setExpanded(initialUser);
  }, [initialUser]);

  const visibleSummaries = initialUser
    ? summaries.filter(s => s.username === initialUser)
    : summaries;

  const getUserRows = (username: string) => allRows.filter(r => r.username === username);

  const handleResetConfirm = async () => {
    if (!resetTarget) return;
    setResetting(true);
    await resetModuleProgress(resetTarget.username, resetTarget.moduleId);
    setResetTarget(null);
    setResetting(false);
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-slate-500 border-t-slate-200 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-sm text-slate-600 font-medium">Failed to load progress data</p>
        <p className="text-xs text-slate-400 max-w-xs text-center">{error}</p>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {initialUser && !hideUserBanner && (
        <div className="flex items-center justify-between mb-4 px-4 py-2.5 bg-sky-50 border border-sky-200 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-sky-700">
            <Users size={14} />
            <span>Viewing progress for <strong>{initialUser}</strong></span>
          </div>
          <button
            onClick={() => {
              setExpanded(null);
              onClearUser?.();
            }}
            className="flex items-center gap-1 text-xs text-sky-500 hover:text-sky-700 transition-colors"
          >
            <X size={13} />
            Show all
          </button>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Module Progress</h2>
          <p className="text-sm text-slate-500 mt-0.5">{visibleSummaries.length} student{visibleSummaries.length !== 1 ? 's' : ''} · {TOTAL_TASKS} tasks total</p>
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
          summaries={visibleSummaries}
          expanded={expanded}
          onToggle={(u) => setExpanded(expanded === u ? null : u)}
          getUserRows={getUserRows}
          onViewCode={(title, code) => setCodeModal({ title, code })}
          onResetModule={(username, moduleId, moduleName) => setResetTarget({ username, moduleId, moduleName })}
          onWatchPlayback={(shareId) => setPlaybackShareId(shareId)}
        />
      ) : (
        <ActivityView
          allRows={allRows}
          onViewCode={(title, code) => setCodeModal({ title, code })}
          onWatchPlayback={(shareId) => setPlaybackShareId(shareId)}
        />
      )}

      {codeModal && (
        <CodeModal title={codeModal.title} code={codeModal.code} onClose={() => setCodeModal(null)} />
      )}

      {resetTarget && (
        <ResetConfirmModal
          username={resetTarget.username}
          moduleName={resetTarget.moduleName}
          onConfirm={handleResetConfirm}
          onCancel={() => setResetTarget(null)}
        />
      )}

      {playbackShareId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700 shrink-0">
            <span className="text-xs font-semibold text-white">Session Playback</span>
            <button
              onClick={() => setPlaybackShareId(null)}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              <X size={13} />
              Close
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <SessionReview shareId={playbackShareId} />
          </div>
        </div>
      )}

      {resetting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

function StudentsView({ summaries, expanded, onToggle, getUserRows, onViewCode, onResetModule, onWatchPlayback }: {
  summaries: UserSummary[];
  expanded: string | null;
  onToggle: (u: string) => void;
  getUserRows: (u: string) => ProgressRow[];
  onViewCode: (title: string, code: string) => void;
  onResetModule: (username: string, moduleId: string, moduleName: string) => void;
  onWatchPlayback: (shareId: string) => void;
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
                    const hasProgress = completedCount > 0;

                    return (
                      <div key={mod.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-700 truncate flex-1 mr-2">{mod.title}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-slate-400">{completedCount}/{mod.tasks.length}</span>
                            {hasProgress && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onResetModule(student.username, mod.id, mod.title);
                                }}
                                title={`Reset ${mod.title} progress for ${student.username}`}
                                className="flex items-center gap-0.5 text-[10px] font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-1.5 py-0.5 rounded transition-colors"
                              >
                                <RotateCcw size={9} />
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="h-1 bg-slate-200 rounded-full overflow-hidden mb-2">
                          <div className={`h-full ${bg} opacity-70 rounded-full transition-all`} style={{ width: `${modPct}%` }} />
                        </div>
                        <div className="flex flex-col gap-1">
                          {mod.tasks.map((task, i) => {
                            const row = modRows.find(r => r.task_index === i);
                            const done = !!row;
                            const hasCode = !!row?.saved_code;
                            const hasSession = !!row?.session_share_id;
                            if (!done) {
                              return (
                                <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-slate-100 border border-slate-200">
                                  <span className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-slate-400 bg-slate-200 shrink-0">{i + 1}</span>
                                  <span className="text-[10px] text-slate-400 truncate flex-1">{task.title}</span>
                                </div>
                              );
                            }
                            return (
                              <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 border border-emerald-200">
                                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                <span className="text-[10px] font-medium text-emerald-700 truncate flex-1">{task.title}</span>
                                {hasCode && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onViewCode(
                                        `${student.username} — ${mod.title} · Task ${i + 1}: ${task.title}`,
                                        row?.saved_code || ''
                                      );
                                    }}
                                    title="View submitted code"
                                    className="flex items-center gap-0.5 text-[10px] font-medium text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-1.5 py-0.5 rounded transition-colors shrink-0"
                                  >
                                    <Code2 size={9} />
                                    Code
                                  </button>
                                )}
                                {hasSession && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onWatchPlayback(row!.session_share_id!);
                                    }}
                                    title="Watch coding session playback"
                                    className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded transition-colors shrink-0"
                                  >
                                    <Play size={9} fill="currentColor" />
                                    Watch
                                  </button>
                                )}
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

function ActivityView({ allRows, onViewCode, onWatchPlayback }: {
  allRows: ProgressRow[];
  onViewCode: (title: string, code: string) => void;
  onWatchPlayback: (shareId: string) => void;
}) {
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
      <div className="px-5 py-3 border-b border-slate-100 text-xs font-medium text-slate-500 grid grid-cols-6 gap-3">
        <span>Student</span>
        <span>Module</span>
        <span>Task</span>
        <span>Completed</span>
        <span>Code</span>
        <span>Session</span>
      </div>
      <div className="divide-y divide-slate-50">
        {recent.map((row) => {
          const mod = curriculum.find(m => m.id === row.module_id);
          const task = mod?.tasks[row.task_index];
          const bg = moduleColors[row.module_id] || 'bg-slate-400';
          const date = new Date(row.completed_at);

          return (
            <div key={`${row.username}-${row.task_id}`} className="px-5 py-2.5 grid grid-cols-6 gap-3 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
              <span className="font-medium text-slate-800">{row.username}</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${bg} shrink-0`} />
                <span className="truncate">{mod?.title || row.module_id}</span>
              </div>
              <span className="text-slate-500 truncate">{task?.title || `Task ${row.task_index + 1}`}</span>
              <span className="text-slate-400">{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>
                {row.saved_code ? (
                  <button
                    onClick={() => onViewCode(
                      `${row.username} — ${mod?.title || row.module_id} · Task ${row.task_index + 1}${task ? ': ' + task.title : ''}`,
                      row.saved_code || ''
                    )}
                    className="flex items-center gap-1 text-sky-600 hover:text-sky-800 font-medium transition-colors"
                  >
                    <Code2 size={11} />
                    Code
                  </button>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </span>
              <span>
                {row.session_share_id ? (
                  <button
                    onClick={() => onWatchPlayback(row.session_share_id!)}
                    className="flex items-center gap-1 text-amber-600 hover:text-amber-800 font-medium transition-colors"
                  >
                    <Play size={11} fill="currentColor" />
                    Watch
                  </button>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
