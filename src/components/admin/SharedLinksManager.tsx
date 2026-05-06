import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Link2, Trash2, Eye, EyeOff, ExternalLink, RefreshCw, Search,
  Calendar, User, FileCode2, Code2, Check, Folder, FolderOpen,
  FolderPlus, ChevronRight, ChevronDown, Pencil, X, FolderMinus,
  ChevronUp,
} from 'lucide-react';
import {
  getAllSnippets, adminUpdateSnippet, adminDeleteSnippet,
  adminMoveSnippetToFolder, getAllFolders, createFolder,
  updateFolder, deleteFolder, updateSnippetPositions,
} from '../../lib/snippets';
import type { CodeSnippet, SharedLinkFolder } from '../../lib/snippets';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function getFileNames(files: Record<string, string>): string {
  const names = Object.keys(files);
  if (names.length === 0) return 'No files';
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1} more`;
}

// Minimal syntax-highlighted code preview (no external deps)
function CodePreview({ files, activeFile }: { files: Record<string, string>; activeFile: string | null }) {
  const fileNames = Object.keys(files);
  if (fileNames.length === 0) return null;

  const firstFile = activeFile && files[activeFile] ? activeFile : fileNames[0];
  const code = files[firstFile] || '';
  const lines = code.split('\n').slice(0, 12);

  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 bg-[#1e1e2e]">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#181825] border-b border-[#313244]">
        <FileCode2 size={11} className="text-[#89b4fa]" />
        <span className="text-[10px] font-mono text-[#cdd6f4] truncate">{firstFile}</span>
        {fileNames.length > 1 && (
          <span className="text-[9px] text-[#6c7086] ml-auto shrink-0">+{fileNames.length - 1} more</span>
        )}
      </div>
      <pre className="px-3 py-2 text-[10px] leading-[1.6] font-mono text-[#cdd6f4] overflow-hidden max-h-[120px] select-none">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span className="text-[#45475a] w-5 shrink-0 text-right mr-3 select-none">{i + 1}</span>
            <span className="truncate">{line || ' '}</span>
          </div>
        ))}
        {code.split('\n').length > 12 && (
          <div className="text-[#45475a] mt-0.5">…</div>
        )}
      </pre>
    </div>
  );
}

// ── Snippet card ─────────────────────────────────────────────────────────────

interface SnippetCardProps {
  snippet: CodeSnippet;
  folders: SharedLinkFolder[];
  editingDesc: Record<string, string>;
  savingDesc: Record<string, boolean>;
  deletingId: string | null;
  togglingId: string | null;
  copiedEmbedId: string | null;
  onDescChange: (id: string, val: string) => void;
  onSaveDesc: (id: string) => void;
  onTogglePublic: (s: CodeSnippet) => void;
  onDelete: (id: string) => void;
  onCopyEmbed: (id: string) => void;
  onMoveToFolder: (shareId: string, folderId: string | null) => void;
  dragging: boolean;
  onDragStart: (shareId: string) => void;
  onDragEnd: () => void;
  // unfiled reorder drop target
  onDragEnterCard?: (shareId: string) => void;
}

function SnippetCard({
  snippet, editingDesc, savingDesc, deletingId, togglingId, copiedEmbedId,
  onDescChange, onSaveDesc, onTogglePublic, onDelete, onCopyEmbed,
  dragging, onDragStart, onDragEnd, onMoveToFolder, onDragEnterCard,
}: SnippetCardProps) {
  const descChanged = (editingDesc[snippet.share_id] ?? '') !== (snippet.description ?? '');
  const base = window.location.origin;
  const [previewOpen, setPreviewOpen] = useState(false);
  const hasFiles = Object.keys(snippet.files).length > 0;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('snippet_share_id', snippet.share_id);
        onDragStart(snippet.share_id);
      }}
      onDragEnd={onDragEnd}
      onDragEnter={() => onDragEnterCard?.(snippet.share_id)}
      className={`bg-white border rounded-xl overflow-hidden transition-all cursor-grab active:cursor-grabbing select-none ${
        dragging ? 'opacity-40 scale-95' : ''
      } ${snippet.is_public ? 'border-slate-200' : 'border-amber-200 bg-amber-50/30'}`}
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="mt-0.5 p-2 bg-slate-100 rounded-lg shrink-0 cursor-grab">
          <FileCode2 size={15} className="text-slate-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              /{snippet.share_id}
            </span>
            {snippet.is_public ? (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <Eye size={9} /> Public
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <EyeOff size={9} /> Disabled
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <User size={9} /> {snippet.created_by || 'anonymous'}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Calendar size={9} /> {formatDate(snippet.created_at)}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <FileCode2 size={9} /> {getFileNames(snippet.files)}
            </span>
            {snippet.folder_id && (
              <button
                onClick={() => onMoveToFolder(snippet.share_id, null)}
                title="Remove from folder"
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500 transition-colors"
              >
                <FolderMinus size={9} />
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="Add a description…"
            value={editingDesc[snippet.share_id] ?? ''}
            onChange={(e) => onDescChange(snippet.share_id, e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && descChanged) onSaveDesc(snippet.share_id); }}
            className="w-full mt-1.5 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 placeholder:text-slate-300"
          />

          {/* Code preview */}
          {hasFiles && (
            <div>
              <button
                onClick={() => setPreviewOpen((v) => !v)}
                className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 hover:text-sky-600 transition-colors"
              >
                {previewOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                {previewOpen ? 'Hide preview' : 'Show preview'}
              </button>
              {previewOpen && (
                <CodePreview files={snippet.files} activeFile={snippet.active_file} />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {descChanged && (
            <button
              onClick={() => onSaveDesc(snippet.share_id)}
              disabled={savingDesc[snippet.share_id]}
              className="px-2.5 py-1.5 text-[11px] font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {savingDesc[snippet.share_id] ? 'Saving…' : 'Save'}
            </button>
          )}

          <a
            href={`${base}/embed/${snippet.share_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
            title="Open embed"
          >
            <ExternalLink size={14} />
          </a>

          <button
            onClick={() => onCopyEmbed(snippet.share_id)}
            title="Copy embed code"
            className={`p-1.5 rounded-lg transition-colors ${
              copiedEmbedId === snippet.share_id
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50'
            }`}
          >
            {copiedEmbedId === snippet.share_id ? <Check size={14} /> : <Code2 size={14} />}
          </button>

          <button
            onClick={() => onTogglePublic(snippet)}
            disabled={togglingId === snippet.share_id}
            title={snippet.is_public ? 'Disable link' : 'Enable link'}
            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              snippet.is_public
                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                : 'text-amber-600 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            {snippet.is_public ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>

          <button
            onClick={() => onDelete(snippet.share_id)}
            disabled={deletingId === snippet.share_id}
            title="Delete permanently"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Folder node ───────────────────────────────────────────────────────────────

interface FolderNodeProps {
  folder: SharedLinkFolder;
  allFolders: SharedLinkFolder[];
  snippets: CodeSnippet[];
  depth: number;
  editingDesc: Record<string, string>;
  savingDesc: Record<string, boolean>;
  deletingId: string | null;
  togglingId: string | null;
  copiedEmbedId: string | null;
  draggingSnippetId: string | null;
  onDescChange: (id: string, val: string) => void;
  onSaveDesc: (id: string) => void;
  onTogglePublic: (s: CodeSnippet) => void;
  onDeleteSnippet: (id: string) => void;
  onCopyEmbed: (id: string) => void;
  onMoveToFolder: (shareId: string, folderId: string | null) => void;
  onDragStartSnippet: (id: string) => void;
  onDragEndSnippet: () => void;
  onFolderRenamed: (id: string, name: string) => void;
  onFolderDeleted: (id: string) => void;
  onSubfolderCreated: (parentId: string) => void;
}

function FolderNode({
  folder, allFolders, snippets, depth,
  editingDesc, savingDesc, deletingId, togglingId, copiedEmbedId, draggingSnippetId,
  onDescChange, onSaveDesc, onTogglePublic, onDeleteSnippet, onCopyEmbed,
  onMoveToFolder, onDragStartSnippet, onDragEndSnippet,
  onFolderRenamed, onFolderDeleted, onSubfolderCreated,
}: FolderNodeProps) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(folder.name);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const children = allFolders.filter((f) => f.parent_id === folder.id);
  const folderSnippets = snippets.filter((s) => s.folder_id === folder.id);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const shareId = e.dataTransfer.getData('snippet_share_id');
    if (shareId) onMoveToFolder(shareId, folder.id);
  }

  function handleRenameSubmit() {
    const trimmed = nameVal.trim();
    if (trimmed && trimmed !== folder.name) onFolderRenamed(folder.id, trimmed);
    setEditing(false);
  }

  const indentPx = depth * 16;

  return (
    <div
      className={`rounded-xl border transition-all ${
        dragOver ? 'border-sky-400 bg-sky-50/60' : 'border-slate-200 bg-slate-50/50'
      }`}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
      onDrop={handleDrop}
    >
      {/* Folder header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
        style={{ paddingLeft: `${12 + indentPx}px` }}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-slate-400 shrink-0">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
        <span className="text-slate-500 shrink-0">
          {open ? <FolderOpen size={15} className="text-sky-500" /> : <Folder size={15} className="text-sky-500" />}
        </span>

        {editing ? (
          <input
            ref={inputRef}
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') { setNameVal(folder.name); setEditing(false); }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 text-sm font-medium text-slate-700 bg-white border border-sky-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          />
        ) : (
          <span className="flex-1 min-w-0 text-sm font-medium text-slate-700 truncate">
            {folder.name}
          </span>
        )}

        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
          {folderSnippets.length + children.reduce((acc, c) => acc + snippets.filter((s) => s.folder_id === c.id).length, 0)}
        </span>

        {/* Folder actions */}
        <div className="flex items-center gap-0.5 shrink-0 ml-1" onClick={(e) => e.stopPropagation()}>
          {depth < 3 && (
            <button
              title="Add subfolder"
              onClick={() => onSubfolderCreated(folder.id)}
              className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-100 rounded transition-colors"
            >
              <FolderPlus size={13} />
            </button>
          )}
          <button
            title="Rename folder"
            onClick={() => setEditing(true)}
            className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-100 rounded transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            title="Delete folder"
            onClick={() => onFolderDeleted(folder.id)}
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Folder contents */}
      {open && (
        <div className="px-3 pb-3 space-y-2" style={{ paddingLeft: `${12 + indentPx}px` }}>
          {/* Subfolders */}
          {children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              allFolders={allFolders}
              snippets={snippets}
              depth={depth + 1}
              editingDesc={editingDesc}
              savingDesc={savingDesc}
              deletingId={deletingId}
              togglingId={togglingId}
              copiedEmbedId={copiedEmbedId}
              draggingSnippetId={draggingSnippetId}
              onDescChange={onDescChange}
              onSaveDesc={onSaveDesc}
              onTogglePublic={onTogglePublic}
              onDeleteSnippet={onDeleteSnippet}
              onCopyEmbed={onCopyEmbed}
              onMoveToFolder={onMoveToFolder}
              onDragStartSnippet={onDragStartSnippet}
              onDragEndSnippet={onDragEndSnippet}
              onFolderRenamed={onFolderRenamed}
              onFolderDeleted={onFolderDeleted}
              onSubfolderCreated={onSubfolderCreated}
            />
          ))}

          {/* Snippets in this folder */}
          {folderSnippets.map((s) => (
            <SnippetCard
              key={s.share_id}
              snippet={s}
              folders={allFolders}
              editingDesc={editingDesc}
              savingDesc={savingDesc}
              deletingId={deletingId}
              togglingId={togglingId}
              copiedEmbedId={copiedEmbedId}
              onDescChange={onDescChange}
              onSaveDesc={onSaveDesc}
              onTogglePublic={onTogglePublic}
              onDelete={onDeleteSnippet}
              onCopyEmbed={onCopyEmbed}
              onMoveToFolder={onMoveToFolder}
              dragging={draggingSnippetId === s.share_id}
              onDragStart={onDragStartSnippet}
              onDragEnd={onDragEndSnippet}
            />
          ))}

          {children.length === 0 && folderSnippets.length === 0 && (
            <div className="text-xs text-slate-400 text-center py-3 border border-dashed border-slate-200 rounded-lg">
              Drop links here
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SharedLinksManager() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [folders, setFolders] = useState<SharedLinkFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingDesc, setEditingDesc] = useState<Record<string, string>>({});
  const [savingDesc, setSavingDesc] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copiedEmbedId, setCopiedEmbedId] = useState<string | null>(null);
  const [draggingSnippetId, setDraggingSnippetId] = useState<string | null>(null);
  const [rootDragOver, setRootDragOver] = useState(false);
  // unfiled reorder: tracks the live-preview order while dragging
  const [unfiledOrder, setUnfiledOrder] = useState<string[]>([]);
  // tracks which card the dragged item is hovering over (for insertion)
  const dragOverUnfiledId = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [data, foldersData] = await Promise.all([getAllSnippets(), getAllFolders()]);
    setSnippets(data);
    setFolders(foldersData);
    const descs: Record<string, string> = {};
    data.forEach((s) => { descs[s.share_id] = s.description || ''; });
    setEditingDesc(descs);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Keep unfiledOrder in sync when snippets change (initial load or after moves)
  useEffect(() => {
    const unfiled = snippets
      .filter((s) => !s.folder_id)
      .sort((a, b) => {
        if (a.position != null && b.position != null) return a.position - b.position;
        if (a.position != null) return -1;
        if (b.position != null) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    setUnfiledOrder(unfiled.map((s) => s.share_id));
  }, [snippets]);

  const isSearching = search.trim().length > 0;
  const filtered = isSearching
    ? snippets.filter((s) => {
        const q = search.toLowerCase();
        return (
          s.share_id.includes(q) ||
          (s.created_by || '').toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q) ||
          Object.keys(s.files).some((f) => f.toLowerCase().includes(q))
        );
      })
    : snippets;

  const snippetMap = Object.fromEntries(snippets.map((s) => [s.share_id, s]));
  const unfiledSnippets = unfiledOrder
    .map((id) => snippetMap[id])
    .filter(Boolean) as CodeSnippet[];

  const topLevelFolders = folders.filter((f) => f.parent_id === null);

  async function handleTogglePublic(snippet: CodeSnippet) {
    setTogglingId(snippet.share_id);
    await adminUpdateSnippet(snippet.share_id, { is_public: !snippet.is_public });
    setSnippets((prev) =>
      prev.map((s) => s.share_id === snippet.share_id ? { ...s, is_public: !s.is_public } : s)
    );
    setTogglingId(null);
  }

  async function handleSaveDesc(shareId: string) {
    setSavingDesc((prev) => ({ ...prev, [shareId]: true }));
    await adminUpdateSnippet(shareId, { description: editingDesc[shareId] ?? '' });
    setSnippets((prev) =>
      prev.map((s) => s.share_id === shareId ? { ...s, description: editingDesc[shareId] ?? '' } : s)
    );
    setSavingDesc((prev) => ({ ...prev, [shareId]: false }));
  }

  async function handleDelete(shareId: string) {
    if (!confirm('Permanently delete this shared link? This cannot be undone.')) return;
    setDeletingId(shareId);
    await adminDeleteSnippet(shareId);
    setSnippets((prev) => prev.filter((s) => s.share_id !== shareId));
    setDeletingId(null);
  }

  function copyEmbed(shareId: string) {
    const embedCode = `<iframe src="${window.location.origin}/embed/${shareId}" width="100%" height="500" frameborder="0" style="border:1px solid #e2e8f0;border-radius:8px;" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(embedCode).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = embedCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
    setCopiedEmbedId(shareId);
    setTimeout(() => setCopiedEmbedId(null), 2000);
  }

  async function handleMoveToFolder(shareId: string, folderId: string | null) {
    await adminMoveSnippetToFolder(shareId, folderId);
    setSnippets((prev) =>
      prev.map((s) => s.share_id === shareId ? { ...s, folder_id: folderId } : s)
    );
  }

  async function handleFolderRenamed(id: string, name: string) {
    await updateFolder(id, { name });
    setFolders((prev) => prev.map((f) => f.id === id ? { ...f, name } : f));
  }

  async function handleFolderDeleted(id: string) {
    if (!confirm('Delete this folder? Links inside will be moved to the unfoldered area.')) return;
    await deleteFolder(id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setSnippets((prev) => prev.map((s) => s.folder_id === id ? { ...s, folder_id: null } : s));
  }

  async function handleSubfolderCreated(parentId: string) {
    const siblings = folders.filter((f) => f.parent_id === parentId);
    const pos = siblings.length;
    const created = await createFolder('New Folder', parentId, pos);
    if (created) setFolders((prev) => [...prev, created]);
  }

  async function handleCreateTopFolder() {
    const pos = topLevelFolders.length;
    const created = await createFolder('New Subject', null, pos);
    if (created) setFolders((prev) => [...prev, created]);
  }

  // Unfiled drag-to-reorder handlers
  function handleUnfiledDragEnterCard(targetShareId: string) {
    if (!draggingSnippetId || draggingSnippetId === targetShareId) return;
    if (!unfiledOrder.includes(draggingSnippetId)) return; // dragging from folder into unfiled zone — ignore reorder
    dragOverUnfiledId.current = targetShareId;
    setUnfiledOrder((prev) => {
      const from = prev.indexOf(draggingSnippetId);
      const to = prev.indexOf(targetShareId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, draggingSnippetId);
      return next;
    });
  }

  async function handleUnfiledDragEnd() {
    setDraggingSnippetId(null);
    dragOverUnfiledId.current = null;
    // Persist new order
    const updates = unfiledOrder.map((shareId, idx) => ({ share_id: shareId, position: idx }));
    await updateSnippetPositions(updates);
    setSnippets((prev) =>
      prev.map((s) => {
        const idx = unfiledOrder.indexOf(s.share_id);
        return idx !== -1 ? { ...s, position: idx } : s;
      })
    );
  }

  const sharedProps = {
    editingDesc,
    savingDesc,
    deletingId,
    togglingId,
    copiedEmbedId,
    draggingSnippetId,
    onDescChange: (id: string, val: string) =>
      setEditingDesc((prev) => ({ ...prev, [id]: val })),
    onSaveDesc: handleSaveDesc,
    onTogglePublic: handleTogglePublic,
    onDeleteSnippet: handleDelete,
    onCopyEmbed: copyEmbed,
    onMoveToFolder: handleMoveToFolder,
    onDragStartSnippet: (id: string) => setDraggingSnippetId(id),
    onDragEndSnippet: () => setDraggingSnippetId(null),
    onFolderRenamed: handleFolderRenamed,
    onFolderDeleted: handleFolderDeleted,
    onSubfolderCreated: handleSubfolderCreated,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Shared Links</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage all shared code snippets — add descriptions, disable or delete links.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateTopFolder}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 hover:bg-sky-50 border border-sky-200 rounded-lg transition-colors"
          >
            <FolderPlus size={13} />
            New Folder
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by user, share code, file name or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <RefreshCw size={18} className="animate-spin mr-2" />
          <span className="text-sm">Loading shared links…</span>
        </div>
      ) : isSearching ? (
        /* Search results — flat list ignoring folders */
        <div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Link2 size={32} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">No shared links found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((snippet) => (
                <SnippetCard
                  key={snippet.share_id}
                  snippet={snippet}
                  folders={folders}
                  {...sharedProps}
                  dragging={draggingSnippetId === snippet.share_id}
                  onDragStart={sharedProps.onDragStartSnippet}
                  onDragEnd={sharedProps.onDragEndSnippet}
                  onDelete={sharedProps.onDeleteSnippet}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Normal folder view */
        <div className="space-y-3">
          {/* Top-level folders */}
          {topLevelFolders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              allFolders={folders}
              snippets={snippets}
              depth={0}
              {...sharedProps}
            />
          ))}

          {/* Unfiled snippets drop zone + list */}
          <div
            className={`rounded-xl border transition-all ${
              rootDragOver ? 'border-sky-400 bg-sky-50/60' : 'border-dashed border-slate-200'
            }`}
            onDragOver={(e) => { e.preventDefault(); setRootDragOver(true); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setRootDragOver(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setRootDragOver(false);
              const shareId = e.dataTransfer.getData('snippet_share_id');
              if (shareId) handleMoveToFolder(shareId, null);
            }}
          >
            {unfiledSnippets.length === 0 && topLevelFolders.length > 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">
                Drag links here to remove from folders
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {unfiledSnippets.length > 0 && (
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">
                    Unfiled
                  </p>
                )}
                {unfiledSnippets.map((snippet) => (
                  <SnippetCard
                    key={snippet.share_id}
                    snippet={snippet}
                    folders={folders}
                    {...sharedProps}
                    dragging={draggingSnippetId === snippet.share_id}
                    onDragStart={sharedProps.onDragStartSnippet}
                    onDragEnd={handleUnfiledDragEnd}
                    onDelete={sharedProps.onDeleteSnippet}
                    onDragEnterCard={handleUnfiledDragEnterCard}
                  />
                ))}
              </div>
            )}
          </div>

          {topLevelFolders.length === 0 && snippets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Link2 size={32} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">No shared links yet</p>
            </div>
          )}
        </div>
      )}

      {!loading && (
        <p className="text-xs text-slate-400 mt-4 text-right">
          {snippets.length} link{snippets.length !== 1 ? 's' : ''}
          {topLevelFolders.length > 0 ? `, ${topLevelFolders.length} folder${topLevelFolders.length !== 1 ? 's' : ''}` : ''}
        </p>
      )}
    </div>
  );
}
