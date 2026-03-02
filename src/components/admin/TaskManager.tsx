import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Loader2, X, Check, ClipboardList, Link2, Copy, FileText, Trash2, Upload, Users, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { generateShareCode } from '../../lib/api';

const STANDALONE_URL = 'https://qfitpwdrswvnbmzvkoyd.supabase.co';
const STANDALONE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaXRwd2Ryc3d2bmJtenZrb3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNTc4NTIsImV4cCI6MjA3NjkzMzg1Mn0.owLaj3VrcyR7_LW9xMwOTTFQupbDKlvAlVwYtbidiNE';

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
  created_at: string;
}

interface StudentUser {
  username: string;
  is_admin: boolean;
}

async function fetchStudents(): Promise<StudentUser[]> {
  const res = await fetch(
    `${STANDALONE_URL}/rest/v1/users_login?select=username,is_admin&is_admin=eq.false&order=username.asc`,
    {
      headers: {
        apikey: STANDALONE_ANON_KEY,
        Authorization: `Bearer ${STANDALONE_ANON_KEY}`,
      },
    }
  );
  if (!res.ok) return [];
  return res.json();
}

function AssignStudentsModal({ task, students, currentAssignments, onClose, onSave }: {
  task: Task;
  students: StudentUser[];
  currentAssignments: string[];
  onClose: () => void;
  onSave: (taskId: string, selected: string[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentAssignments));
  const [saving, setSaving] = useState(false);

  const toggle = (username: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === students.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map(s => s.username)));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(task.id, Array.from(selected));
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[70vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">Assign Students</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">{task.title}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-2 border-b border-slate-100">
          <button
            onClick={selectAll}
            className="text-xs text-sky-600 hover:text-sky-700 font-medium"
          >
            {selected.size === students.length ? 'Deselect all' : 'Select all'}
          </button>
          <span className="text-xs text-slate-400 ml-2">{selected.size} selected</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {students.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">No students found</p>
          ) : (
            <div className="space-y-0.5">
              {students.map(s => (
                <label
                  key={s.username}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selected.has(s.username) ? 'bg-sky-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(s.username)}
                    onChange={() => toggle(s.username)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500/30"
                  />
                  <span className="text-sm text-slate-700">{s.username}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save Assignments
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TaskManager() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [assignmentsMap, setAssignmentsMap] = useState<Record<string, string[]>>({});
  const [assignModalTask, setAssignModalTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    const [{ data: taskData }, { data: assignData }] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('task_assignments').select('task_id, student_id'),
    ]);
    setTasks((taskData as Task[]) || []);

    const map: Record<string, string[]> = {};
    for (const row of (assignData || [])) {
      if (!map[row.task_id]) map[row.task_id] = [];
      map[row.task_id].push(row.student_id);
    }
    setAssignmentsMap(map);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    fetchStudents().then(setStudents);
  }, []);

  const toggleStudent = (username: string) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  };

  const selectAllStudents = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.username)));
    }
  };

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      const unique = arr.filter(f => !existing.has(f.name));
      return [...prev, ...unique];
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) setDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragging(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError('');

    try {
      const shareCode = generateShareCode();
      const taskFiles: TaskFile[] = [];

      for (const file of files) {
        const storagePath = `${shareCode}/${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from('task-files')
          .upload(storagePath, file);
        if (uploadErr) throw uploadErr;
        taskFiles.push({ name: file.name, path: storagePath });
      }

      const { data: insertedTask, error: insertErr } = await supabase.from('tasks').insert({
        share_code: shareCode,
        title: title.trim(),
        description: description.trim(),
        file_name: taskFiles.length === 1 ? taskFiles[0].name : null,
        file_path: taskFiles.length === 1 ? taskFiles[0].path : null,
        task_files: taskFiles,
        created_by: user?.id,
      }).select('id').maybeSingle();
      if (insertErr) throw insertErr;

      if (insertedTask && selectedStudents.size > 0) {
        const rows = Array.from(selectedStudents).map(sid => ({
          task_id: insertedTask.id,
          student_id: sid,
        }));
        const { error: assignErr } = await supabase.from('task_assignments').insert(rows);
        if (assignErr) throw assignErr;
      }

      setShowCreate(false);
      setTitle('');
      setDescription('');
      setFiles([]);
      setSelectedStudents(new Set());
      await fetchTasks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAssignments = async (taskId: string, selected: string[]) => {
    const current = assignmentsMap[taskId] || [];
    const toAdd = selected.filter(s => !current.includes(s));
    const toRemove = current.filter(s => !selected.includes(s));

    if (toRemove.length > 0) {
      await supabase.from('task_assignments')
        .delete()
        .eq('task_id', taskId)
        .in('student_id', toRemove);
    }
    if (toAdd.length > 0) {
      await supabase.from('task_assignments')
        .insert(toAdd.map(sid => ({ task_id: taskId, student_id: sid })));
    }
    await fetchTasks();
  };

  const handleDelete = async (task: Task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      const paths: string[] = [];
      if (task.task_files?.length > 0) {
        paths.push(...task.task_files.map(f => f.path));
      } else if (task.file_path) {
        paths.push(task.file_path);
      }
      if (paths.length > 0) {
        await supabase.storage.from('task-files').remove(paths);
      }
      await supabase.from('tasks').delete().eq('id', task.id);
      await fetchTasks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const copyLink = (shareCode: string) => {
    const url = `${window.location.origin}/task/${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(shareCode);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFileCount = (task: Task) => {
    if (task.task_files?.length > 0) return task.task_files.length;
    if (task.file_name) return 1;
    return 0;
  };

  const getFileNames = (task: Task): string[] => {
    if (task.task_files?.length > 0) return task.task_files.map(f => f.name);
    if (task.file_name) return [task.file_name];
    return [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList size={20} className="text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-800">Tasks</h2>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{tasks.length} tasks</span>
        </div>
        <button
          onClick={() => { setShowCreate(true); setError(''); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Plus size={13} />
          Create Task
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {showCreate && (
        <div className="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Create New Task</h3>
            <button onClick={() => setShowCreate(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Instructions</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write task instructions for students..."
                rows={4}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 resize-y"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-600">Assign to Students</label>
                <button
                  type="button"
                  onClick={selectAllStudents}
                  className="text-[10px] text-sky-600 hover:text-sky-700 font-medium"
                >
                  {selectedStudents.size === students.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              {students.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No students found</p>
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg max-h-40 overflow-y-auto p-1">
                  {students.map(s => (
                    <label
                      key={s.username}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                        selectedStudents.has(s.username) ? 'bg-sky-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(s.username)}
                        onChange={() => toggleStudent(s.username)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500/30"
                      />
                      <span className="text-xs text-slate-700">{s.username}</span>
                    </label>
                  ))}
                </div>
              )}
              {selectedStudents.size > 0 && (
                <p className="text-[10px] text-slate-400 mt-1">{selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Attachments</label>
              <div
                ref={dropRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                  dragging
                    ? 'border-sky-400 bg-sky-50/80 scale-[1.01]'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className={`p-2 rounded-full transition-colors ${dragging ? 'bg-sky-100' : 'bg-slate-100'}`}>
                  <Upload size={18} className={dragging ? 'text-sky-500' : 'text-slate-400'} />
                </div>
                <div className="text-center">
                  <span className="text-xs font-medium text-slate-600">
                    Drop files here or <span className="text-sky-600">browse</span>
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Python, text, HTML, CSS, JSON, PDF, images, and more
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
                  className="hidden"
                />
              </div>

              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg group"
                    >
                      <FileText size={13} className="text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-700 truncate flex-1">{f.name}</span>
                      <span className="text-[10px] text-slate-400">{(f.size / 1024).toFixed(1)} KB</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="p-0.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Create Task
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {tasks.map((task) => {
          const fileNames = getFileNames(task);
          const fileCount = getFileCount(task);
          const assigned = assignmentsMap[task.id] || [];
          return (
            <div key={task.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">{task.title}</h3>
                  {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    {fileCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded" title={fileNames.join(', ')}>
                        <FileText size={10} />
                        {fileCount} file{fileCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {assigned.length > 0 && (
                      <button
                        onClick={() => setAssignModalTask(task)}
                        className="inline-flex items-center gap-1 text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 hover:bg-sky-100 transition-colors"
                        title={assigned.join(', ')}
                      >
                        <Users size={10} />
                        {assigned.length} student{assigned.length !== 1 ? 's' : ''}
                      </button>
                    )}
                    {assigned.length === 0 && (
                      <button
                        onClick={() => setAssignModalTask(task)}
                        className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-sky-600 px-2 py-0.5 rounded border border-dashed border-slate-200 hover:border-sky-300 transition-colors"
                      >
                        <UserPlus size={9} />
                        Assign
                      </button>
                    )}
                    <span className="text-xs text-slate-400">
                      {new Date(task.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-3 shrink-0">
                  <button
                    onClick={() => copyLink(task.share_code)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      copiedId === task.share_code
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'text-sky-600 hover:bg-sky-50 border border-sky-200'
                    }`}
                  >
                    {copiedId === task.share_code ? <Check size={12} /> : <Copy size={12} />}
                    {copiedId === task.share_code ? 'Copied' : 'Copy Link'}
                  </button>
                  <a
                    href={`/task/${task.share_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                  >
                    <Link2 size={12} />
                    Open
                  </a>
                  <button
                    onClick={() => handleDelete(task)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="text-center py-16 text-sm text-slate-400">
            No tasks yet. Create your first task to get started.
          </div>
        )}
      </div>

      {assignModalTask && (
        <AssignStudentsModal
          task={assignModalTask}
          students={students}
          currentAssignments={assignmentsMap[assignModalTask.id] || []}
          onClose={() => setAssignModalTask(null)}
          onSave={handleSaveAssignments}
        />
      )}
    </div>
  );
}
