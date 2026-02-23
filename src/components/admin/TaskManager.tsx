import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Loader2, X, Check, ClipboardList, Link2, Copy, FileText, Trash2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { generateShareCode } from '../../lib/api';

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

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    setTasks((data as Task[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) {
      setDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
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

      const { error: insertErr } = await supabase.from('tasks').insert({
        share_code: shareCode,
        title: title.trim(),
        description: description.trim(),
        file_name: taskFiles.length === 1 ? taskFiles[0].name : null,
        file_path: taskFiles.length === 1 ? taskFiles[0].path : null,
        task_files: taskFiles,
        created_by: user?.id,
      });
      if (insertErr) throw insertErr;

      setShowCreate(false);
      setTitle('');
      setDescription('');
      setFiles([]);
      await fetchTasks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSaving(false);
    }
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
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Attachments
              </label>
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
    </div>
  );
}
