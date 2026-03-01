import { useState, useEffect } from 'react';
import { curriculum, Task, Module } from './curriculum';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Play,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Clock,
  Zap,
  BookOpen,
  Trophy,
  Turtle,
  X,
} from 'lucide-react';

interface ModulePageProps {
  moduleId: string;
  onBack: () => void;
  onStartTask: (task: Task) => void;
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

const difficultyColors: Record<string, string> = {
  Beginner: 'text-emerald-400 bg-emerald-900/40 border-emerald-700/50',
  Intermediate: 'text-amber-400 bg-amber-900/40 border-amber-700/50',
  Advanced: 'text-red-400 bg-red-900/40 border-red-700/50',
};

function getCompletedTasks(): Record<string, boolean> {
  return JSON.parse(localStorage.getItem('pycode_completed_tasks') || '{}');
}

export default function ModulePage({ moduleId, onBack, onStartTask }: ModulePageProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [shownHints, setShownHints] = useState<Record<string, boolean>>({});
  const [, forceUpdate] = useState(0);

  const module = curriculum.find(m => m.id === moduleId);
  const colors = module ? (colorMap[module.color] || colorMap.emerald) : colorMap.emerald;

  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1);
    window.addEventListener('pycode_progress_update', handler);
    return () => window.removeEventListener('pycode_progress_update', handler);
  }, []);

  if (!module) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Module not found.
      </div>
    );
  }

  const completed = getCompletedTasks();
  const done = module.tasks.filter((_, i) => completed[`${module.id}-${i}`]).length;
  const pct = Math.round((done / module.tasks.length) * 100);

  const DiffIcon = module.difficulty === 'Beginner' ? Zap : module.difficulty === 'Intermediate' ? BookOpen : Trophy;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className={`bg-gradient-to-b ${colors.header} border-b border-slate-800`}>
        <div className="max-w-3xl mx-auto px-6 py-7">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-5 transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            All Modules
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs text-slate-500 font-medium mb-1">Module {module.number}</div>
              <h1 className="text-2xl font-bold text-white mb-2">{module.title}</h1>
              <p className="text-slate-400 text-sm max-w-lg">{module.description}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={`flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full border ${difficultyColors[module.difficulty]}`}>
                  <DiffIcon size={9} />
                  {module.difficulty}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/40">
                  <Clock size={9} />
                  {module.estimatedTime}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{done}<span className="text-slate-500 text-base font-normal">/{module.tasks.length}</span></div>
              <div className="text-xs text-slate-500 mb-2">tasks done</div>
              <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${colors.progressBar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-3">
        {module.tasks.map((task, index) => {
          const taskKey = `${module.id}-${index}`;
          const isDone = !!completed[taskKey];
          const isExpanded = expandedTask === task.id;
          const hintShown = !!shownHints[task.id];

          return (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              isDone={isDone}
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
  isExpanded: boolean;
  hintShown: boolean;
  colors: ReturnType<typeof Object.values<typeof colorMap>[0]>;
  onToggle: () => void;
  onToggleHint: () => void;
  onStart: () => void;
}

function TaskCard({ task, index, isDone, isExpanded, hintShown, colors, onToggle, onToggleHint, onStart }: TaskCardProps) {
  return (
    <div className={`rounded-xl border bg-slate-900/60 transition-all ${isExpanded ? colors.activeBorder : 'border-slate-800 hover:border-slate-700'}`}>
      {/* Card header */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={onToggle}
      >
        <div className="shrink-0">
          {isDone
            ? <CheckCircle2 size={18} className="text-emerald-400" />
            : <Circle size={18} className="text-slate-600" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-medium">Task {index + 1}</span>
            {task.usesTurtle && (
              <span className="text-[10px] bg-teal-900/40 text-teal-400 border border-teal-700/40 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <span>🐢</span> Turtle
              </span>
            )}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${difficultyColors[task.difficulty]}`}>
              {task.difficulty}
            </span>
          </div>
          <div className={`font-semibold text-sm mt-0.5 ${isExpanded ? colors.activeTitle : 'text-white'}`}>
            {task.title}
          </div>
        </div>

        <div className="shrink-0 text-slate-500">
          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-800 pt-4">
          <p className="text-sm text-slate-300 leading-relaxed">{task.description}</p>

          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3">
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">Expected Output</div>
            <p className="text-xs text-slate-400 italic">{task.expectedOutput}</p>
          </div>

          {/* Hint toggle */}
          <div>
            <button
              onClick={onToggleHint}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                hintShown
                  ? `${colors.hintBg} ${colors.hintBorder} ${colors.hintText}`
                  : 'text-slate-400 border-slate-700 hover:border-slate-600 hover:text-white'
              }`}
            >
              <Lightbulb size={12} />
              {hintShown ? 'Hide Hint' : 'Show Me How'}
            </button>

            {hintShown && (
              <div className={`mt-2 rounded-lg border ${colors.hintBorder} ${colors.hintBg} p-3`}>
                <div className="flex items-start gap-2">
                  <Lightbulb size={13} className="mt-0.5 shrink-0 text-amber-400" />
                  <p className={`text-xs leading-relaxed ${colors.hintText}`}>{task.hint}</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onStart}
            className={`flex items-center gap-2 px-4 py-2 ${colors.startBtn} text-white text-sm font-semibold rounded-lg transition-colors`}
          >
            <Play size={13} fill="currentColor" />
            Start Task in Editor
          </button>
        </div>
      )}
    </div>
  );
}
