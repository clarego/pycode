import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Send, CheckCircle2, ClipboardList, LogOut, AlertCircle, Clock, MessageSquare, ChevronDown, List } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { saveSession } from '../../lib/sessions';
import { useSessionRecorder } from '../../hooks/useSessionRecorder';
import PythonPlayground from '../PythonPlayground';
import ResizablePanel from '../ResizablePanel';

interface TaskFile {
  name: string;
  path: string;
}

interface Task {
  id: string;
  share_code: string;
  title: string;
  description: string;
  file_name: string | null;
  file_path: string | null;
  task_files: TaskFile[];
}

interface ExistingSubmission {
  id: string;
  submitted_at: string;
  reviewed: boolean;
  feedback: string | null;
  files: Record<string, string> | null;
}

interface TaskViewProps {
  shareCode: string;
}

interface AssignedTaskItem {
  task_id: string;
  tasks: {
    id: string;
    share_code: string;
    title: string;
  };
}

const TEXT_EXTENSIONS = new Set([
  'py', 'txt', 'js', 'ts', 'html', 'css', 'json', 'csv', 'md',
  'xml', 'yaml', 'yml', 'toml', 'cfg', 'ini', 'sh', 'bat', 'sql',
  'java', 'c', 'cpp', 'h', 'hpp', 'rb', 'php', 'ipynb',
]);

function isTextFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return TEXT_EXTENSIONS.has(ext);
}

export default function TaskView({ shareCode }: TaskViewProps) {
  const { user, logout } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [submission, setSubmission] = useState<ExistingSubmission | null>(null);
  const [initialFiles, setInitialFiles] = useState<Record<string, string> | null>(null);
  const [binaryFiles, setBinaryFiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [assignedTasks, setAssignedTasks] = useState<AssignedTaskItem[]>([]);
  const [showTasksDropdown, setShowTasksDropdown] = useState(false);
  const currentFilesRef = useRef<Record<string, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { updateFiles, getSnapshots, recordEvent, getRedFlags } = useSessionRecorder();

  const handleFilesChange = useCallback((files: Record<string, string>, activeFile: string) => {
    currentFilesRef.current = files;
    updateFiles(files, activeFile);
  }, [updateFiles]);

  const handlePasteDetected = useCallback(() => {
    recordEvent('paste');
  }, [recordEvent]);

  const fetchTask = useCallback(async () => {
    const { data: t, error: err } = await supabase
      .from('tasks')
      .select('*')
      .eq('share_code', shareCode)
      .maybeSingle();

    if (err || !t) {
      setError('Task not found');
      setLoading(false);
      return;
    }

    const taskData = t as Task;
    setTask(taskData);

    let existingSub: ExistingSubmission | null = null;
    if (user) {
      const { data: sub } = await supabase
        .from('task_submissions')
        .select('id, submitted_at, reviewed, feedback, files')
        .eq('task_id', taskData.id)
        .eq('student_id', user.username)
        .maybeSingle();
      if (sub) {
        existingSub = sub as ExistingSubmission;
        setSubmission(existingSub);
      }
    }

    const files: Record<string, string> = {};
    const binaries: Record<string, string> = {};

    const taskFileList: TaskFile[] = taskData.task_files?.length > 0
      ? taskData.task_files
      : (taskData.file_name && taskData.file_path)
        ? [{ name: taskData.file_name, path: taskData.file_path }]
        : [];

    for (const tf of taskFileList) {
      if (!isTextFile(tf.name)) {
        const { data: urlData } = await supabase.storage
          .from('task-files')
          .createSignedUrl(tf.path, 3600);
        if (urlData?.signedUrl) {
          binaries[tf.name] = urlData.signedUrl;
        }
      }
    }

    if (existingSub?.files && Object.keys(existingSub.files).length > 0) {
      for (const [name, content] of Object.entries(existingSub.files)) {
        if (name.endsWith('.info.txt') && content.startsWith('# Binary file:')) continue;
        files[name] = content;
      }
    } else {
      for (const tf of taskFileList) {
        if (isTextFile(tf.name)) {
          const { data: blob, error: dlErr } = await supabase.storage
            .from('task-files')
            .download(tf.path);
          if (blob && !dlErr) {
            const text = await blob.text();
            const looksLikeErrorJson = (() => {
              try {
                const parsed = JSON.parse(text);
                return parsed && typeof parsed === 'object' && ('statusCode' in parsed || 'error' in parsed);
              } catch {
                return false;
              }
            })();
            if (!looksLikeErrorJson) {
              files[tf.name] = text;
            }
          }
        }
      }
    }

    if (Object.keys(files).length === 0) {
      files['main.py'] = '# Write your code here\n';
    }

    if (!files['main.py'] && !Object.keys(files).some(f => f.endsWith('.py'))) {
      files['main.py'] = '# Write your code here\n';
    }

    setBinaryFiles(binaries);
    setInitialFiles(files);
    currentFilesRef.current = files;
    setLoading(false);
  }, [shareCode, user]);

  useEffect(() => { fetchTask(); }, [fetchTask]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('task_assignments')
      .select('task_id, tasks(id, share_code, title)')
      .eq('student_id', user.username)
      .then(({ data }) => {
        if (data) setAssignedTasks(data as unknown as AssignedTaskItem[]);
      });
  }, [user]);

  useEffect(() => {
    if (!showTasksDropdown) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTasksDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showTasksDropdown]);

  const handleSubmit = async () => {
    if (!task || !user) return;
    setSubmitting(true);
    setError('');

    try {
      const { snapshots, durationMs } = getSnapshots();
      const flags = getRedFlags();
      let sessionShareId: string | null = null;

      try {
        if (snapshots.length > 0) {
          const result = await saveSession(snapshots, durationMs, 'main.py', user.username);
          if ('shareId' in result) {
            sessionShareId = result.shareId;
          }
        }
      } catch {
        // session save failure should not block submission
      }

      const allFiles = { ...currentFilesRef.current };
      const filesToSubmit = Object.keys(allFiles).length > 0 ? allFiles : { 'main.py': '# Write your code here\n' };

      if (submission) {
        const { error: updateErr } = await supabase
          .from('task_submissions')
          .update({
            files: filesToSubmit,
            session_share_id: sessionShareId ?? undefined,
            submitted_at: new Date().toISOString(),
            red_flags: flags,
          })
          .eq('id', submission.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('task_submissions')
          .insert({
            task_id: task.id,
            student_id: user.username,
            files: filesToSubmit,
            session_share_id: sessionShareId,
            red_flags: flags,
          });
        if (insertErr) throw insertErr;
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-slate-400" size={28} />
          <span className="text-sm text-slate-500">Loading task...</span>
        </div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-3 text-red-400" size={32} />
          <p className="text-sm text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-emerald-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Submitted!</h2>
          <p className="text-sm text-slate-500 mb-6">
            Your work for "{task?.title}" has been submitted successfully. Your teacher will review it shortly.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setSubmitted(false)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Continue working
            </button>
            {assignedTasks.filter(a => a.tasks?.share_code !== shareCode).length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-slate-400 mb-2">Other assigned tasks:</p>
                {assignedTasks.filter(a => a.tasks?.share_code !== shareCode).map(a => (
                  <a
                    key={a.task_id}
                    href={`/task/${a.tasks.share_code}`}
                    className="block px-4 py-2 text-sm text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-colors"
                  >
                    {a.tasks.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <a
            href="https://digitalvector.com.au"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img src="/digivec_logo.png" alt="Digital Vector" className="h-6" />
          </a>
          <div className="w-px h-4 bg-slate-600" />
          <ClipboardList size={14} className="text-sky-400" />
          <span className="text-sm font-semibold text-white truncate max-w-xs">{task?.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {submission && (
            <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
              submission.reviewed
                ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700'
                : 'bg-amber-900/40 text-amber-300 border border-amber-700'
            }`}>
              {submission.reviewed ? <CheckCircle2 size={9} /> : <Clock size={9} />}
              {submission.reviewed ? 'Reviewed' : 'Pending review'}
            </span>
          )}
          {assignedTasks.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowTasksDropdown(!showTasksDropdown)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              >
                <List size={12} />
                <span>My Tasks</span>
                <ChevronDown size={10} className={`transition-transform ${showTasksDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showTasksDropdown && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-slate-700">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Assigned Tasks</span>
                  </div>
                  {assignedTasks.map(a => {
                    if (!a.tasks) return null;
                    const isCurrent = a.tasks.share_code === shareCode;
                    return (
                      <a
                        key={a.task_id}
                        href={`/task/${a.tasks.share_code}`}
                        onClick={() => setShowTasksDropdown(false)}
                        className={`flex items-center gap-2 px-3 py-2.5 text-xs transition-colors ${
                          isCurrent
                            ? 'bg-slate-700 text-sky-300 cursor-default pointer-events-none'
                            : 'text-slate-200 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCurrent ? 'bg-sky-400' : 'bg-slate-500'}`} />
                        <span className="truncate">{a.tasks.title}</span>
                        {isCurrent && <span className="ml-auto text-[9px] text-sky-400 shrink-0">current</span>}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <span className="text-xs text-slate-400">{user?.username}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
          >
            <LogOut size={12} />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        {panelCollapsed ? (
          <div className="h-full relative">
            <button
              onClick={() => setPanelCollapsed(false)}
              className="absolute top-2 left-2 z-10 px-2 py-1 text-[10px] text-slate-500 hover:text-slate-700 bg-white/80 hover:bg-white border border-slate-200 rounded-md transition-colors backdrop-blur-sm"
            >
              Show Task
            </button>
            <div className="h-full">
              {initialFiles && (
                <PythonPlayground
                  embedded
                  initialFiles={initialFiles}
                  onFilesChange={handleFilesChange}
                  onPasteDetected={handlePasteDetected}
                  binaryFiles={Object.keys(binaryFiles).length > 0 ? binaryFiles : undefined}
                />
              )}
            </div>
          </div>
        ) : (
          <ResizablePanel
            direction="horizontal"
            defaultRatio={0.22}
            minRatio={0.15}
            maxRatio={0.4}
            left={
              <div className="h-full bg-white border-r border-slate-200 flex flex-col">
                <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
                  <h2 className="text-sm font-bold text-slate-800">Task Instructions</h2>
                  <button
                    onClick={() => setPanelCollapsed(true)}
                    className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                  >
                    Hide
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  {task?.description ? (
                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{task.description}</p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No instructions provided.</p>
                  )}
                  {submission?.feedback && (
                    <div className={`mt-4 p-3 rounded-lg border ${
                      submission.reviewed
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-sky-50 border-sky-200'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <MessageSquare size={12} className={submission.reviewed ? 'text-emerald-600' : 'text-sky-600'} />
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                          submission.reviewed ? 'text-emerald-700' : 'text-sky-700'
                        }`}>
                          Teacher Feedback
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{submission.feedback}</p>
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-slate-100 shrink-0">
                  {error && (
                    <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    {submitting ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                    {submitting ? 'Submitting...' : submission ? 'Resubmit' : 'Submit'}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-1.5">
                    All files in the editor will be submitted
                  </p>
                </div>
              </div>
            }
            right={
              <div className="h-full">
                {initialFiles && (
                  <PythonPlayground
                    embedded
                    initialFiles={initialFiles}
                    onFilesChange={handleFilesChange}
                    onPasteDetected={handlePasteDetected}
                    binaryFiles={Object.keys(binaryFiles).length > 0 ? binaryFiles : undefined}
                  />
                )}
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
