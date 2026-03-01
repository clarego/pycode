import { useEffect, useState } from 'react';
import { curriculum, Module } from './curriculum';
import { Clock, ChevronRight, CheckCircle2, BookOpen, Zap, Trophy, Lock } from 'lucide-react';

interface ModuleMapProps {
  onSelectModule: (moduleId: string) => void;
}

const colorMap: Record<string, { bg: string; border: string; badge: string; dot: string; progress: string; icon: string }> = {
  emerald: {
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-700/50 hover:border-emerald-500/80',
    badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
    dot: 'bg-emerald-500',
    progress: 'bg-emerald-500',
    icon: 'text-emerald-400',
  },
  cyan: {
    bg: 'bg-cyan-950/40',
    border: 'border-cyan-700/50 hover:border-cyan-500/80',
    badge: 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50',
    dot: 'bg-cyan-500',
    progress: 'bg-cyan-500',
    icon: 'text-cyan-400',
  },
  sky: {
    bg: 'bg-sky-950/40',
    border: 'border-sky-700/50 hover:border-sky-500/80',
    badge: 'bg-sky-900/60 text-sky-300 border-sky-700/50',
    dot: 'bg-sky-500',
    progress: 'bg-sky-500',
    icon: 'text-sky-400',
  },
  amber: {
    bg: 'bg-amber-950/40',
    border: 'border-amber-700/50 hover:border-amber-500/80',
    badge: 'bg-amber-900/60 text-amber-300 border-amber-700/50',
    dot: 'bg-amber-500',
    progress: 'bg-amber-500',
    icon: 'text-amber-400',
  },
  orange: {
    bg: 'bg-orange-950/40',
    border: 'border-orange-700/50 hover:border-orange-500/80',
    badge: 'bg-orange-900/60 text-orange-300 border-orange-700/50',
    dot: 'bg-orange-500',
    progress: 'bg-orange-500',
    icon: 'text-orange-400',
  },
  rose: {
    bg: 'bg-rose-950/40',
    border: 'border-rose-700/50 hover:border-rose-500/80',
    badge: 'bg-rose-900/60 text-rose-300 border-rose-700/50',
    dot: 'bg-rose-500',
    progress: 'bg-rose-500',
    icon: 'text-rose-400',
  },
  teal: {
    bg: 'bg-teal-950/40',
    border: 'border-teal-700/50 hover:border-teal-500/80',
    badge: 'bg-teal-900/60 text-teal-300 border-teal-700/50',
    dot: 'bg-teal-500',
    progress: 'bg-teal-500',
    icon: 'text-teal-400',
  },
  violet: {
    bg: 'bg-violet-950/40',
    border: 'border-violet-700/50 hover:border-violet-500/80',
    badge: 'bg-violet-900/60 text-violet-300 border-violet-700/50',
    dot: 'bg-violet-500',
    progress: 'bg-violet-500',
    icon: 'text-violet-400',
  },
  pink: {
    bg: 'bg-pink-950/40',
    border: 'border-pink-700/50 hover:border-pink-500/80',
    badge: 'bg-pink-900/60 text-pink-300 border-pink-700/50',
    dot: 'bg-pink-500',
    progress: 'bg-pink-500',
    icon: 'text-pink-400',
  },
  red: {
    bg: 'bg-red-950/40',
    border: 'border-red-700/50 hover:border-red-500/80',
    badge: 'bg-red-900/60 text-red-300 border-red-700/50',
    dot: 'bg-red-500',
    progress: 'bg-red-500',
    icon: 'text-red-400',
  },
};

const difficultyColors: Record<string, string> = {
  Beginner: 'text-emerald-400 bg-emerald-900/40 border-emerald-700/50',
  Intermediate: 'text-amber-400 bg-amber-900/40 border-amber-700/50',
  Advanced: 'text-red-400 bg-red-900/40 border-red-700/50',
};

function getProgress(moduleId: string, taskCount: number): number {
  const completed = JSON.parse(localStorage.getItem('pycode_completed_tasks') || '{}');
  let done = 0;
  for (let i = 0; i < taskCount; i++) {
    const key = `${moduleId}-${i}`;
    if (completed[key]) done++;
  }
  return done;
}

function getTotalProgress(): { done: number; total: number } {
  const completed = JSON.parse(localStorage.getItem('pycode_completed_tasks') || '{}');
  const total = curriculum.reduce((acc, m) => acc + m.tasks.length, 0);
  const done = Object.values(completed).filter(Boolean).length;
  return { done, total };
}

function isModuleUnlocked(index: number): boolean {
  if (index === 0) return true;
  const prev = curriculum[index - 1];
  const done = getProgress(prev.id, prev.tasks.length);
  return done >= Math.ceil(prev.tasks.length / 2);
}

export default function ModuleMap({ onSelectModule }: ModuleMapProps) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1);
    window.addEventListener('pycode_progress_update', handler);
    return () => window.removeEventListener('pycode_progress_update', handler);
  }, []);

  const { done: totalDone, total: totalTasks } = getTotalProgress();
  const overallPct = Math.round((totalDone / totalTasks) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={18} className="text-sky-400" />
                <span className="text-sky-400 text-sm font-medium uppercase tracking-widest">Learning Path</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Python Modules</h1>
              <p className="text-slate-400 text-sm max-w-xl">
                A structured curriculum for Year 9/10 students — from turtle drawing to real maths problem solving. Complete tasks to unlock the next module.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 min-w-[120px]">
              <div className="flex items-center gap-2">
                <Trophy size={15} className="text-amber-400" />
                <span className="text-2xl font-bold text-white">{totalDone}</span>
                <span className="text-slate-500 text-sm">/ {totalTasks}</span>
              </div>
              <div className="text-xs text-slate-500">tasks completed</div>
              <div className="w-full mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <div className="text-xs text-slate-400">{overallPct}% complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {curriculum.map((module, index) => {
            const colors = colorMap[module.color] || colorMap.emerald;
            const done = getProgress(module.id, module.tasks.length);
            const pct = Math.round((done / module.tasks.length) * 100);
            const unlocked = isModuleUnlocked(index);
            const allDone = done === module.tasks.length;

            return (
              <ModuleCard
                key={module.id}
                module={module}
                colors={colors}
                done={done}
                pct={pct}
                unlocked={unlocked}
                allDone={allDone}
                onSelect={() => unlocked && onSelectModule(module.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ModuleCardProps {
  module: Module;
  colors: ReturnType<typeof Object.values<typeof colorMap>[0]>;
  done: number;
  pct: number;
  unlocked: boolean;
  allDone: boolean;
  onSelect: () => void;
}

function ModuleCard({ module, colors, done, pct, unlocked, allDone, onSelect }: ModuleCardProps) {
  const DiffIcon = module.difficulty === 'Beginner' ? Zap : module.difficulty === 'Intermediate' ? BookOpen : Trophy;

  return (
    <button
      onClick={onSelect}
      disabled={!unlocked}
      className={`
        w-full text-left p-5 rounded-xl border transition-all duration-200
        ${colors.bg} ${colors.border}
        ${unlocked ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : 'opacity-40 cursor-not-allowed'}
      `}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm
            ${allDone ? 'bg-emerald-500/20 text-emerald-300' : `${colors.bg} ${colors.icon}`}
            border ${allDone ? 'border-emerald-500/40' : 'border-slate-700/50'}
          `}>
            {allDone ? <CheckCircle2 size={18} /> : (
              <span className="text-xs font-bold opacity-60">M{module.number}</span>
            )}
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium mb-0.5">Module {module.number}</div>
            <div className="text-sm font-semibold text-white leading-tight">{module.title}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!unlocked && <Lock size={12} className="text-slate-600" />}
          {unlocked && <ChevronRight size={14} className="text-slate-500" />}
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">{module.description}</p>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${difficultyColors[module.difficulty]}`}>
          <DiffIcon size={9} />
          {module.difficulty}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/40">
          <Clock size={9} />
          {module.estimatedTime}
        </span>
        <span className="text-[10px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/40">
          {module.tasks.length} tasks
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.progress} rounded-full transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-slate-500 shrink-0">{done}/{module.tasks.length}</span>
      </div>

      {/* Task dots */}
      <div className="flex gap-1 mt-2">
        {module.tasks.map((_, i) => {
          const taskKey = `${module.id}-${i}`;
          const taskDone = JSON.parse(localStorage.getItem('pycode_completed_tasks') || '{}')[taskKey];
          return (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${taskDone ? colors.dot : 'bg-slate-700'}`}
            />
          );
        })}
      </div>
    </button>
  );
}
