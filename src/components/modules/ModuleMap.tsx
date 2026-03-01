import { useEffect, useState } from 'react';
import { curriculum, Module } from './curriculum';
import { ChevronRight, CheckCircle2, BookOpen, Lock } from 'lucide-react';

interface ModuleMapProps {
  onSelectModule: (moduleId: string) => void;
  completedKeys?: Record<string, boolean>;
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

function getProgressFromKeys(moduleId: string, taskCount: number, keys: Record<string, boolean>): number {
  let done = 0;
  for (let i = 0; i < taskCount; i++) {
    if (keys[`${moduleId}-${i}`]) done++;
  }
  return done;
}

function isModuleUnlocked(index: number, keys: Record<string, boolean>): boolean {
  if (index === 0) return true;
  const prev = curriculum[index - 1];
  const done = getProgressFromKeys(prev.id, prev.tasks.length, keys);
  return done >= Math.ceil(prev.tasks.length / 2);
}

export default function ModuleMap({ onSelectModule, completedKeys = {} }: ModuleMapProps) {
  const [localKeys, setLocalKeys] = useState<Record<string, boolean>>(completedKeys);

  useEffect(() => {
    setLocalKeys(completedKeys);
  }, [completedKeys]);

  useEffect(() => {
    const handler = () => {
      setLocalKeys(JSON.parse(localStorage.getItem('pycode_completed_tasks') || '{}'));
    };
    window.addEventListener('pycode_progress_update', handler);
    return () => window.removeEventListener('pycode_progress_update', handler);
  }, []);

  const total = curriculum.reduce((acc, m) => acc + m.tasks.length, 0);
  const totalDone = Object.values(localKeys).filter(Boolean).length;
  const overallPct = Math.round((totalDone / total) * 100);

  return (
    <div className="text-white">
      {/* Header */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-5 py-5">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={14} className="text-sky-400" />
          <span className="text-sky-400 text-xs font-medium uppercase tracking-widest">Learning Path</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-1">Python Modules</h1>
        <p className="text-slate-400 text-xs leading-relaxed mb-3">
          10 modules from turtle basics to maths problem solving. Complete tasks to unlock the next module.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 shrink-0">{totalDone}/{total}</span>
        </div>
      </div>

      {/* Module list (compact for sidebar) */}
      <div className="px-3 py-4 space-y-2">
        {curriculum.map((module, index) => {
          const colors = colorMap[module.color] || colorMap.emerald;
          const done = getProgressFromKeys(module.id, module.tasks.length, localKeys);
          const pct = Math.round((done / module.tasks.length) * 100);
          const unlocked = isModuleUnlocked(index, localKeys);
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
              completedKeys={localKeys}
              onSelect={() => unlocked && onSelectModule(module.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

type ColorEntry = { bg: string; border: string; badge: string; dot: string; progress: string; icon: string };

interface ModuleCardProps {
  module: Module;
  colors: ColorEntry;
  done: number;
  pct: number;
  unlocked: boolean;
  allDone: boolean;
  completedKeys: Record<string, boolean>;
  onSelect: () => void;
}

function ModuleCard({ module, colors, done, pct, unlocked, allDone, completedKeys, onSelect }: ModuleCardProps) {
  return (
    <button
      onClick={onSelect}
      disabled={!unlocked}
      className={`
        w-full text-left px-3 py-3 rounded-lg border transition-all duration-200
        ${colors.bg} ${colors.border}
        ${unlocked ? 'cursor-pointer hover:brightness-110' : 'opacity-35 cursor-not-allowed'}
      `}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${allDone ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : `${colors.bg} border-slate-700/50 ${colors.icon}`}`}>
          {allDone ? <CheckCircle2 size={13} /> : <span className="text-[10px] font-bold opacity-70">{module.number}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-white truncate">{module.title}</div>
          <div className="text-[10px] text-slate-500">{module.estimatedTime} · {module.tasks.length} tasks</div>
        </div>
        {!unlocked ? <Lock size={11} className="text-slate-600 shrink-0" /> : <ChevronRight size={12} className="text-slate-500 shrink-0" />}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${colors.progress} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-0.5 shrink-0">
          {module.tasks.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${completedKeys[`${module.id}-${i}`] ? colors.dot : 'bg-slate-700'}`} />
          ))}
        </div>
        <span className="text-[9px] text-slate-500 shrink-0">{done}/{module.tasks.length}</span>
      </div>
    </button>
  );
}
