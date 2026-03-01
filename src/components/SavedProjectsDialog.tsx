import { useState, useEffect, useRef } from 'react';
import { X, FolderOpen, Save, Trash2, Edit2, Check, Loader2, AlertCircle, Plus, Clock } from 'lucide-react';
import { listSavedProjects, saveProject, deleteProject } from '../lib/savedProjects';
import type { SavedProject } from '../lib/savedProjects';

type Mode = 'open' | 'save';

interface SavedProjectsDialogProps {
  mode: Mode;
  username: string;
  currentFiles: Record<string, string>;
  currentActiveFile: string;
  onLoad: (files: Record<string, string>, activeFile: string) => void;
  onClose: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function SavedProjectsDialog({
  mode,
  username,
  currentFiles,
  currentActiveFile,
  onLoad,
  onClose,
}: SavedProjectsDialogProps) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveName, setSaveName] = useState('Untitled Project');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProjects();
  }, [username]);

  async function loadProjects() {
    setLoadingList(true);
    setError('');
    try {
      const list = await listSavedProjects(username);
      setProjects(list);
    } catch (e) {
      setError('Failed to load projects.');
    } finally {
      setLoadingList(false);
    }
  }

  async function handleSave() {
    if (!saveName.trim()) return;
    setSaving(true);
    setError('');
    try {
      const saved = await saveProject(username, saveName.trim(), currentFiles, currentActiveFile);
      setProjects((prev) => [saved, ...prev]);
      onClose();
    } catch (e) {
      setError('Failed to save project.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRenameCommit(project: SavedProject) {
    if (!renameValue.trim() || renameValue === project.name) {
      setRenamingId(null);
      return;
    }
    try {
      const updated = await saveProject(username, renameValue.trim(), project.files, project.active_file, project.id);
      setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)));
    } catch {
      setError('Failed to rename.');
    } finally {
      setRenamingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteProject(username, id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  const fileCount = (p: SavedProject) => Object.keys(p.files).length;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            {mode === 'save' ? (
              <Save size={16} className="text-sky-400" />
            ) : (
              <FolderOpen size={16} className="text-sky-400" />
            )}
            <h2 className="text-sm font-semibold text-white">
              {mode === 'save' ? 'Save Project' : 'Open Project'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {mode === 'save' && (
          <div className="px-5 py-4 border-b border-slate-700">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Project name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="flex-1 bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 placeholder-slate-500"
                placeholder="Enter project name..."
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={saving || !saveName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:text-slate-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2 text-xs mb-3">
              <AlertCircle size={13} />
              {error}
            </div>
          )}

          {loadingList ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-slate-500" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <FolderOpen size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No saved projects yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="group flex items-center gap-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 rounded-lg px-3 py-2.5 transition-colors cursor-pointer"
                  onClick={() => {
                    if (renamingId === project.id) return;
                    if (mode === 'open') {
                      onLoad(project.files as Record<string, string>, project.active_file);
                      onClose();
                    }
                  }}
                >
                  <div className="flex-1 min-w-0">
                    {renamingId === project.id ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameCommit(project);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        onBlur={() => handleRenameCommit(project)}
                        className="w-full bg-slate-600 border border-sky-500 text-white text-sm rounded px-2 py-0.5 focus:outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <p className="text-sm font-medium text-white truncate">{project.name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">
                        {fileCount(project)} {fileCount(project) === 1 ? 'file' : 'files'}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={10} />
                        {timeAgo(project.updated_at)}
                      </span>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {renamingId === project.id ? (
                      <button
                        onClick={() => handleRenameCommit(project)}
                        className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-600 rounded transition-colors"
                        title="Confirm rename"
                      >
                        <Check size={13} />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setRenamingId(project.id);
                          setRenameValue(project.name);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                        title="Rename"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(project.id)}
                      disabled={deletingId === project.id}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded transition-colors"
                      title="Delete"
                    >
                      {deletingId === project.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>

                  {mode === 'open' && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <Plus size={14} className="text-sky-400 rotate-45 hidden" />
                      <FolderOpen size={14} className="text-sky-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
