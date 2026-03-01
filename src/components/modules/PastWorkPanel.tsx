import { useState, useEffect } from 'react';
import { curriculum } from './curriculum';
import { loadUserCompletedCode, ProgressRow } from '../../lib/moduleProgress';
import { X, CheckCircle2, Copy, ChevronDown, ChevronRight, BookOpen, Code2, ClipboardCopy, RefreshCw } from 'lucide-react';

interface PastWorkPanelProps {
  username: string | null;
  onClose: () => void;
  onLoadCode: (code: string, taskTitle: string) => void;
  onOpenTask?: (moduleId: string, taskId: string) => void;
}

const moduleColorDot: Record<string, string> = {
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

interface EnrichedRow extends ProgressRow {
  moduleTitle: string;
  taskTitle: string;
}

export default function PastWorkPanel({ username, onClose, onLoadCode, onOpenTask }: PastWorkPanelProps) {
  const [rows, setRows] = useState<EnrichedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }
    loadUserCompletedCode(username).then(data => {
      const enriched: EnrichedRow[] = data.map(row => {
        const mod = curriculum.find(m => m.id === row.module_id);
        const task = mod?.tasks[row.task_index];
        return {
          ...row,
          moduleTitle: mod?.title ?? row.module_id,
          taskTitle: task?.title ?? `Task ${row.task_index + 1}`,
        };
      });
      setRows(enriched);
      const moduleIds = [...new Set(enriched.map(r => r.module_id))];
      const initial: Record<string, boolean> = {};
      if (moduleIds.length > 0) initial[moduleIds[0]] = true;
      setExpandedModules(initial);
      setLoading(false);
    });
  }, [username]);

  const grouped = curriculum
    .map(mod => ({
      mod,
      tasks: rows.filter(r => r.module_id === mod.id),
    }))
    .filter(g => g.tasks.length > 0);

  const selectedRow = rows.find(r => r.task_id === selectedTaskId);

  const handleCopy = (code: string, taskId: string) => {
    navigator.clipboard.writeText(code);
    setCopied(taskId);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-white" style={{ width: 440 }}>
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-sky-400" />
          <span className="text-sm font-semibold text-white">Past Work</span>
          {rows.length > 0 && (
            <span className="text-[10px] text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-px rounded-full">
              {rows.length} {rows.length === 1 ? 'task' : 'tasks'}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
        </div>
      ) : !username ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <Code2 size={28} className="text-slate-600 mb-3" />
          <p className="text-sm text-slate-400 mb-1">Log in to see your past work</p>
          <p className="text-xs text-slate-600">Completed task code is saved to your account.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <CheckCircle2 size={28} className="text-slate-600 mb-3" />
          <p className="text-sm text-slate-400 mb-1">No completed tasks yet</p>
          <p className="text-xs text-slate-600">When you mark a task as done, your code will be saved here.</p>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          {/* Left: module/task list */}
          <div className="w-44 shrink-0 border-r border-slate-800 overflow-y-auto py-2">
            {grouped.map(({ mod, tasks }) => {
              const dot = moduleColorDot[mod.id] || 'bg-slate-500';
              const isExpanded = !!expandedModules[mod.id];
              return (
                <div key={mod.id}>
                  <button
                    onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-800/60 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                    <span className="flex-1 text-[11px] font-semibold text-slate-200 truncate">{mod.title}</span>
                    <span className="text-[9px] text-slate-500">{tasks.length}</span>
                    {isExpanded ? <ChevronDown size={10} className="text-slate-500 shrink-0" /> : <ChevronRight size={10} className="text-slate-500 shrink-0" />}
                  </button>
                  {isExpanded && tasks.map(row => (
                    <button
                      key={row.task_id}
                      onClick={() => setSelectedTaskId(row.task_id)}
                      className={`w-full flex items-center gap-2 pl-6 pr-3 py-1.5 text-left transition-colors ${
                        selectedTaskId === row.task_id
                          ? 'bg-sky-900/40 text-sky-300'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                      <span className="text-[10px] truncate">{row.taskTitle}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Right: code viewer */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {selectedRow ? (
              <>
                <div className="shrink-0 px-3 py-2.5 border-b border-slate-800 bg-slate-900/60">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500 mb-0.5">{selectedRow.moduleTitle}</div>
                      <div className="text-xs font-semibold text-white truncate">{selectedRow.taskTitle}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        Completed {new Date(selectedRow.completed_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {selectedRow.saved_code && (
                        <>
                          <button
                            onClick={() => handleCopy(selectedRow.saved_code!, selectedRow.task_id)}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border text-slate-400 border-slate-700 hover:text-white hover:border-slate-600 transition-colors"
                          >
                            {copied === selectedRow.task_id ? (
                              <><CheckCircle2 size={10} className="text-emerald-400" /> Copied</>
                            ) : (
                              <><ClipboardCopy size={10} /> Copy</>
                            )}
                          </button>
                          <button
                            onClick={() => onLoadCode(selectedRow.saved_code!, selectedRow.taskTitle)}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border font-medium text-sky-300 border-sky-700/60 bg-sky-900/30 hover:bg-sky-800/50 transition-colors"
                          >
                            <Copy size={10} />
                            Load into Editor
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {selectedRow.saved_code ? (
                    <pre className="p-3 text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                      {selectedRow.saved_code}
                    </pre>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                      <Code2 size={22} className="text-slate-600 mb-2" />
                      <p className="text-xs text-slate-500">No code saved for this task.</p>
                      <p className="text-[10px] text-slate-600 mt-1 mb-3">This task was completed before code saving was introduced.</p>
                      {onOpenTask && (
                        <button
                          onClick={() => { onOpenTask(selectedRow.module_id, selectedRow.task_id); onClose(); }}
                          className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded border font-medium text-sky-300 border-sky-700/60 bg-sky-900/30 hover:bg-sky-800/50 transition-colors"
                        >
                          <RefreshCw size={11} />
                          Re-open task to save code
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
                <Code2 size={24} className="text-slate-700 mb-2" />
                <p className="text-xs text-slate-500">Select a task to view your code</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
