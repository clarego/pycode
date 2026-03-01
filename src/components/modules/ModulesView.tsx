import { useState, useEffect, useCallback, useRef } from 'react';
import { curriculum, Task, Module } from './curriculum';
import ModuleMap from './ModuleMap';
import ModulePage from './ModulePage';
import PastWorkPanel from './PastWorkPanel';
import { useAuth } from '../auth/AuthContext';
import { markTaskComplete, loadUserProgress, syncLocalProgressToDb } from '../../lib/moduleProgress';
import PythonPlayground from '../PythonPlayground';
import ChangePasswordModal from '../auth/ChangePasswordModal';
import LoginModal from '../auth/LoginModal';
import { ArrowLeft, GraduationCap, ChevronRight, BookOpen, KeyRound } from 'lucide-react';

type ModulesSubview = 'map' | 'module';

interface ActiveTaskInfo {
  task: Task;
  taskIndex: number;
  module: Module;
}

export default function ModulesView() {
  const { user, changePassword } = useAuth();
  const [subview, setSubview] = useState<ModulesSubview>('map');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeTaskInfo, setActiveTaskInfo] = useState<ActiveTaskInfo | null>(null);
  const [completedKeys, setCompletedKeys] = useState<Record<string, boolean>>({});
  const [praiseTaskId, setPraiseTaskId] = useState<string | null>(null);
  const [showPastWork, setShowPastWork] = useState(false);
  const [pastWorkKey, setPastWorkKey] = useState(0);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const currentFilesRef = useRef<Record<string, string>>({});
  const currentActiveFileRef = useRef<string>('main.py');

  useEffect(() => {
    const local = JSON.parse(localStorage.getItem('pycode_completed_tasks') || '{}');
    setCompletedKeys(local);

    if (user?.username) {
      syncLocalProgressToDb(user.username);
      loadUserProgress(user.username).then(remote => {
        const merged = { ...local, ...remote };
        localStorage.setItem('pycode_completed_tasks', JSON.stringify(merged));
        setCompletedKeys(merged);
        window.dispatchEvent(new Event('pycode_progress_update'));
      });
    }
  }, [user?.username]);

  useEffect(() => {
    const handler = () => {
      setCompletedKeys(JSON.parse(localStorage.getItem('pycode_completed_tasks') || '{}'));
    };
    window.addEventListener('pycode_progress_update', handler);
    return () => window.removeEventListener('pycode_progress_update', handler);
  }, []);

  const handleStartTask = useCallback((task: Task, module: Module) => {
    const taskIndex = module.tasks.findIndex(t => t.id === task.id);
    setActiveTaskInfo({ task, taskIndex, module });
  }, []);

  const handleMarkDone = useCallback(async () => {
    if (!activeTaskInfo) return;

    if (!user?.username) {
      setShowLogin(true);
      return;
    }

    const { task, taskIndex, module } = activeTaskInfo;
    const savedCode = currentFilesRef.current[currentActiveFileRef.current] ?? currentFilesRef.current['main.py'] ?? '';

    await markTaskComplete(user.username, module.id, task.id, taskIndex, savedCode);
    setPastWorkKey(k => k + 1);

    setPraiseTaskId(task.id);
    setTimeout(() => {
      setPraiseTaskId(null);
      advanceToNext(module, taskIndex);
    }, 2200);
  }, [activeTaskInfo, user]);

  const advanceToNext = useCallback((currentModule: Module, currentTaskIndex: number) => {
    const nextTaskIndex = currentTaskIndex + 1;

    if (nextTaskIndex < currentModule.tasks.length) {
      const nextTask = currentModule.tasks[nextTaskIndex];
      setActiveTaskInfo({ task: nextTask, taskIndex: nextTaskIndex, module: currentModule });
    } else {
      const currentModuleIndex = curriculum.findIndex(m => m.id === currentModule.id);
      const nextModule = curriculum[currentModuleIndex + 1];
      if (nextModule) {
        setSelectedModuleId(nextModule.id);
        setActiveTaskInfo({ task: nextModule.tasks[0], taskIndex: 0, module: nextModule });
      } else {
        setActiveTaskInfo(null);
      }
    }
  }, []);

  const isTaskDone = useCallback((moduleId: string, taskIndex: number) => {
    return !!completedKeys[`${moduleId}-${taskIndex}`];
  }, [completedKeys]);

  const handleLoadPastCode = useCallback((code: string) => {
    if (activeTaskInfo) {
      currentFilesRef.current = { ...currentFilesRef.current, [currentActiveFileRef.current]: code };
    }
    setShowPastWork(false);
    window.dispatchEvent(new CustomEvent('pycode_load_code', { detail: { code } }));
  }, [activeTaskInfo]);

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 bg-slate-900 border-b border-slate-800 px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 group">
            <img src="/pycode_logo.png" alt="PyCode" className="h-8 w-auto" />
          </a>
          <div className="w-px h-5 bg-slate-700" />
          <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <GraduationCap size={15} className="text-sky-400" />
            Learning Modules
          </div>
          {subview === 'module' && selectedModuleId && (
            <>
              <ChevronRight size={13} className="text-slate-600" />
              <span className="text-sm text-slate-300">
                {curriculum.find(m => m.id === selectedModuleId)?.title}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!user && (
            <button
              onClick={() => setShowLogin(true)}
              className="text-xs text-amber-400 bg-amber-900/30 border border-amber-700/40 px-2.5 py-1 rounded-lg hover:bg-amber-900/50 transition-colors"
            >
              Log in to save progress
            </button>
          )}
          {user && (
            <button
              onClick={() => setShowChangePassword(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700"
              title="Change Password"
            >
              <KeyRound size={12} />
              Password
            </button>
          )}
          <button
            onClick={() => setShowPastWork(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              showPastWork
                ? 'bg-sky-900/40 border-sky-700/60 text-sky-300'
                : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700'
            }`}
          >
            <BookOpen size={12} />
            Past Work
          </button>
          <a
            href="/playground"
            className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors font-medium"
          >
            Open Editor
          </a>
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel: module navigation */}
        <div className="w-[360px] shrink-0 border-r border-slate-800 overflow-y-auto bg-slate-950">
          {subview === 'map' ? (
            <ModuleMap
              onSelectModule={(id) => {
                setSelectedModuleId(id);
                setSubview('module');
              }}
              completedKeys={completedKeys}
            />
          ) : (
            <div>
              <div className="px-4 py-3 border-b border-slate-800">
                <button
                  onClick={() => { setSubview('map'); setActiveTaskInfo(null); }}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors group"
                >
                  <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                  All Modules
                </button>
              </div>
              {selectedModuleId && (
                <ModulePage
                  moduleId={selectedModuleId}
                  completedKeys={completedKeys}
                  activeTaskId={activeTaskInfo?.task.id ?? null}
                  onStartTask={(task) => {
                    const mod = curriculum.find(m => m.id === selectedModuleId)!;
                    handleStartTask(task, mod);
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Right panel: editor */}
        <div className="flex-1 min-w-0 relative flex">
          <div className="flex-1 min-w-0">
            {activeTaskInfo ? (
              <PythonPlayground
                key={activeTaskInfo.task.id}
                initialTask={activeTaskInfo.task}
                onMarkDone={handleMarkDone}
                praiseTaskId={praiseTaskId}
                isTaskDone={isTaskDone(activeTaskInfo.module.id, activeTaskInfo.taskIndex)}
                embedded={false}
                profile={user ? { username: user.username, role: user.isAdmin ? 'admin' : 'student' } : null}
                onFilesChange={(files, activeFile) => {
                  currentFilesRef.current = files;
                  currentActiveFileRef.current = activeFile;
                }}
              />
            ) : (
              <EditorPlaceholder onSelectModule={() => setSubview('map')} />
            )}
          </div>

          {/* Past Work panel */}
          {showPastWork && (
            <PastWorkPanel
              key={pastWorkKey}
              username={user?.username ?? null}
              onClose={() => setShowPastWork(false)}
              onLoadCode={handleLoadPastCode}
            />
          )}
        </div>
      </div>
      {showChangePassword && user && (
        <ChangePasswordModal
          username={user.username}
          onClose={() => setShowChangePassword(false)}
          onChangePassword={changePassword}
        />
      )}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}

function EditorPlaceholder({ onSelectModule }: { onSelectModule: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8 bg-slate-950">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mb-5">
        <GraduationCap size={28} className="text-sky-400" />
      </div>
      <h2 className="text-lg font-bold text-white mb-2">Select a task to begin</h2>
      <p className="text-sm text-slate-400 max-w-xs mb-6">
        Choose a module, expand a task, and click "Start Task" to load the starter code here.
      </p>
      <button
        onClick={onSelectModule}
        className="flex items-center gap-2 text-sm font-medium text-sky-300 hover:text-sky-200 bg-sky-900/30 hover:bg-sky-900/50 border border-sky-700/50 px-4 py-2 rounded-lg transition-colors"
      >
        Browse Modules
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
