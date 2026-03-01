import { useState, useEffect } from 'react';
import { curriculum, Task } from './curriculum';
import {
  CheckCircle2,
  Circle,
  Play,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Zap,
  BookOpen,
  Trophy,
} from 'lucide-react';

interface ModulePageProps {
  moduleId: string;
  onBack?: () => void;
  onStartTask: (task: Task) => void;
  completedKeys?: Record<string, boolean>;
  activeTaskId?: string | null;
}

const colorMap: Record<string, {
  header: string; badge: string; activeBorder: string; activeTitle: string;
  hintBg: string; hintBorder: string; hintText: string; progressBar: string;
  startBtn: string; dot: string;
}> = {
  emerald: {
    header: 'from-emerald-950 to-slate-950',
    badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
    activeBorder: 'border-emerald-500/70',
    activeTitle: 'text-emerald-300',
    hintBg: 'bg-emerald-950/60',
    hintBorder: 'border-emerald-700/50',
    hintText: 'text-emerald-200',
    progressBar: 'bg-emerald-500',
    startBtn: 'bg-emerald-600 hover:bg-emerald-500',
    dot: 'bg-emerald-500',
  },
  cyan: {
    header: 'from-cyan-950 to-slate-950',
    badge: 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50',
    activeBorder: 'border-cyan-500/70',
    activeTitle: 'text-cyan-300',
    hintBg: 'bg-cyan-950/60',
    hintBorder: 'border-cyan-700/50',
    hintText: 'text-cyan-200',
    progressBar: 'bg-cyan-500',
    startBtn: 'bg-cyan-600 hover:bg-cyan-500',
    dot: 'bg-cyan-500',
  },
  sky: {
    header: 'from-sky-950 to-slate-950',
    badge: 'bg-sky-900/60 text-sky-300 border-sky-700/50',
    activeBorder: 'border-sky-500/70',
    activeTitle: 'text-sky-300',
    hintBg: 'bg-sky-950/60',
    hintBorder: 'border-sky-700/50',
    hintText: 'text-sky-200',
    progressBar: 'bg-sky-500',
    startBtn: 'bg-sky-600 hover:bg-sky-500',
    dot: 'bg-sky-500',
  },
  amber: {
    header: 'from-amber-950 to-slate-950',
    badge: 'bg-amber-900/60 text-amber-300 border-amber-700/50',
    activeBorder: 'border-amber-500/70',
    activeTitle: 'text-amber-300',
    hintBg: 'bg-amber-950/60',
    hintBorder: 'border-amber-700/50',
    hintText: 'text-amber-200',
    progressBar: 'bg-amber-500',
    startBtn: 'bg-amber-600 hover:bg-amber-500',
    dot: 'bg-amber-500',
  },
  orange: {
    header: 'from-orange-950 to-slate-950',
    badge: 'bg-orange-900/60 text-orange-300 border-orange-700/50',
    activeBorder: 'border-orange-500/70',
    activeTitle: 'text-orange-300',
    hintBg: 'bg-orange-950/60',
    hintBorder: 'border-orange-700/50',
    hintText: 'text-orange-200',
    progressBar: 'bg-orange-500',
    startBtn: 'bg-orange-600 hover:bg-orange-500',
    dot: 'bg-orange-500',
  },
  rose: {
    header: 'from-rose-950 to-slate-950',
    badge: 'bg-rose-900/60 text-rose-300 border-rose-700/50',
    activeBorder: 'border-rose-500/70',
    activeTitle: 'text-rose-300',
    hintBg: 'bg-rose-950/60',
    hintBorder: 'border-rose-700/50',
    hintText: 'text-rose-200',
    progressBar: 'bg-rose-500',
    startBtn: 'bg-rose-600 hover:bg-rose-500',
    dot: 'bg-rose-500',
  },
  teal: {
    header: 'from-teal-950 to-slate-950',
    badge: 'bg-teal-900/60 text-teal-300 border-teal-700/50',
    activeBorder: 'border-teal-500/70',
    activeTitle: 'text-teal-300',
    hintBg: 'bg-teal-950/60',
    hintBorder: 'border-teal-700/50',
    hintText: 'text-teal-200',
    progressBar: 'bg-teal-500',
    startBtn: 'bg-teal-600 hover:bg-teal-500',
    dot: 'bg-teal-500',
  },
  violet: {
    header: 'from-violet-950 to-slate-950',
    badge: 'bg-violet-900/60 text-violet-300 border-violet-700/50',
    activeBorder: 'border-violet-500/70',
    activeTitle: 'text-violet-300',
    hintBg: 'bg-violet-950/60',
    hintBorder: 'border-violet-700/50',
    hintText: 'text-violet-200',
    progressBar: 'bg-violet-500',
    startBtn: 'bg-violet-600 hover:bg-violet-500',
    dot: 'bg-violet-500',
  },
  pink: {
    header: 'from-pink-950 to-slate-950',
    badge: 'bg-pink-900/60 text-pink-300 border-pink-700/50',
    activeBorder: 'border-pink-500/70',
    activeTitle: 'text-pink-300',
    hintBg: 'bg-pink-950/60',
    hintBorder: 'border-pink-700/50',
    hintText: 'text-pink-200',
    progressBar: 'bg-pink-500',
    startBtn: 'bg-pink-600 hover:bg-pink-500',
    dot: 'bg-pink-500',
  },
  red: {
    header: 'from-red-950 to-slate-950',
    badge: 'bg-red-900/60 text-red-300 border-red-700/50',
    activeBorder: 'border-red-500/70',
    activeTitle: 'text-red-300',
    hintBg: 'bg-red-950/60',
    hintBorder: 'border-red-700/50',
    hintText: 'text-red-200',
    progressBar: 'bg-red-500',
    startBtn: 'bg-red-600 hover:bg-red-500',
    dot: 'bg-red-500',
  },
};

export default function ModulePage({ moduleId, onStartTask, completedKeys = {}, activeTaskId = null }: ModulePageProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(activeTaskId);
  const [shownHints, setShownHints] = useState<Record<string, boolean>>({});
  const [localKeys, setLocalKeys] = useState<Record<string, boolean>>(completedKeys);

  const module = curriculum.find(m => m.id === moduleId);
  const colors = module ? (colorMap[module.color] || colorMap.emerald) : colorMap.emerald;

  useEffect(() => {
    setLocalKeys(completedKeys);
  }, [completedKeys]);

  useEffect(() => {
    const handler = () => setLocalKeys(JSON.parse(localStorage.getItem('pycode_completed_tasks') || '{}'));
    window.addEventListener('pycode_progress_update', handler);
    return () => window.removeEventListener('pycode_progress_update', handler);
  }, []);

  useEffect(() => {
    if (activeTaskId) setExpandedTask(activeTaskId);
  }, [activeTaskId]);

  if (!module) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Module not found.
      </div>
    );
  }

  const done = module.tasks.filter((_, i) => localKeys[`${module.id}-${i}`]).length;
  const pct = Math.round((done / module.tasks.length) * 100);

  const DiffIcon = module.difficulty === 'Beginner' ? Zap : module.difficulty === 'Intermediate' ? BookOpen : Trophy;

  return (
    <div className="text-white">
      {/* Compact header for sidebar */}
      <div className={`bg-gradient-to-b ${colors.header} border-b border-slate-800 px-4 py-4`}>
        <div className="flex items-center gap-2 mb-1">
          <DiffIcon size={12} className={colors.dot.replace('bg-', 'text-')} />
          <span className="text-xs text-slate-500 font-medium">Module {module.number}</span>
        </div>
        <div className="text-base font-bold text-white mb-1">{module.title}</div>
        <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">{module.description}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${colors.progressBar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] text-slate-500 shrink-0">{done}/{module.tasks.length} done</span>
        </div>
      </div>

      {/* Tasks */}
      <div className="px-3 py-4 space-y-2">
        {module.tasks.map((task, index) => {
          const taskKey = `${module.id}-${index}`;
          const isDone = !!localKeys[taskKey];
          const isActive = activeTaskId === task.id;
          const isExpanded = expandedTask === task.id;
          const hintShown = !!shownHints[task.id];

          return (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              isDone={isDone}
              isActive={isActive}
              isExpanded={isExpanded}
              hintShown={hintShown}
              colors={colors}
              onToggle={() => setExpandedTask(isExpanded ? null : task.id)}
              onToggleHint={() => setShownHints(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
              onStart={() => onStartTask(task)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  index: number;
  isDone: boolean;
  isActive: boolean;
  isExpanded: boolean;
  hintShown: boolean;
  colors: { header: string; badge: string; activeBorder: string; activeTitle: string; hintBg: string; hintBorder: string; hintText: string; progressBar: string; startBtn: string; dot: string };
  onToggle: () => void;
  onToggleHint: () => void;
  onStart: () => void;
}

function TaskCard({ task, index, isDone, isActive, isExpanded, hintShown, colors, onToggle, onToggleHint, onStart }: TaskCardProps) {
  return (
    <div className={`rounded-lg border transition-all ${
      isActive
        ? `${colors.activeBorder} bg-slate-800/80 ring-1 ring-inset ${colors.activeBorder}`
        : isExpanded
          ? `${colors.activeBorder} bg-slate-900/60`
          : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
    }`}>
      <button
        className="w-full flex items-center gap-2.5 p-3 text-left"
        onClick={onToggle}
      >
        <div className="shrink-0">
          {isDone
            ? <CheckCircle2 size={15} className="text-emerald-400" />
            : isActive
              ? <div className="w-3.5 h-3.5 rounded-full border-2 border-sky-400 animate-pulse" />
              : <Circle size={15} className="text-slate-600" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500 font-medium">Task {index + 1}</span>
            {task.usesTurtle && (
              <span className="text-[9px] bg-teal-900/40 text-teal-400 border border-teal-700/40 px-1 py-px rounded-full">Turtle</span>
            )}
          </div>
          <div className={`font-semibold text-xs mt-0.5 truncate ${isActive ? colors.activeTitle : isExpanded ? colors.activeTitle : 'text-white'}`}>
            {task.title}
          </div>
        </div>

        <div className="shrink-0 text-slate-500">
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-800 pt-3">
          <p className="text-xs text-slate-300 leading-relaxed">{task.description}</p>

          <div className="rounded border border-slate-700/50 bg-slate-800/50 p-2">
            <div className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mb-1">Expected Output</div>
            <p className="text-[10px] text-slate-400 italic">{task.expectedOutput}</p>
          </div>

          <div>
            <button
              onClick={onToggleHint}
              className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded border transition-all ${
                hintShown
                  ? `${colors.hintBg} ${colors.hintBorder} ${colors.hintText}`
                  : 'text-slate-400 border-slate-700 hover:border-slate-600 hover:text-white'
              }`}
            >
              <Lightbulb size={11} />
              {hintShown ? 'Hide Hint' : 'Show Me How'}
            </button>

            {hintShown && (
              <div className={`mt-2 rounded border ${colors.hintBorder} ${colors.hintBg} p-2`}>
                <div className="flex items-start gap-1.5">
                  <Lightbulb size={11} className="mt-0.5 shrink-0 text-amber-400" />
                  <p className={`text-[11px] leading-relaxed ${colors.hintText}`}>{task.hint}</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onStart}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 ${colors.startBtn} text-white text-xs font-semibold rounded transition-colors`}
          >
            <Play size={11} fill="currentColor" />
            {isActive ? 'Reload Starter Code' : 'Start Task'}
          </button>
        </div>
      )}
    </div>
  );
}
