import { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  FileText,
  File,
  FolderOpen,
  Folder,
  Plus,
  FolderPlus,
  PanelLeftClose,
  Pencil,
  X,
  Trash2,
  BookOpen,
  Image as ImageIcon,
} from 'lucide-react';

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'bmp', 'webp', 'ico']);

interface ContextMenuState {
  x: number;
  y: number;
  targetPath: string;
  isFolder: boolean;
}

interface FileManagerProps {
  files: Record<string, string>;
  activeFile: string;
  onSelectFile: (filepath: string) => void;
  onAddFile: (filepath: string) => void;
  onRemoveFile: (filepath: string) => void;
  onRenameFile: (oldName: string, newName: string) => void;
  onToggleCollapse: () => void;
  binaryFiles?: Record<string, string>;
  previewFile?: string | null;
  onPreviewFile?: (filepath: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  isBinary: boolean;
  children: TreeNode[];
}

function buildTree(files: Record<string, string>, binaryFilenames: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  const binarySet = new Set(binaryFilenames);
  const allKeys = [...new Set([...Object.keys(files), ...binaryFilenames])];
  const keys = allKeys.sort((a, b) => {
    const aParts = a.split('/');
    const bParts = b.split('/');
    if (aParts.length !== bParts.length) return bParts.length - aParts.length;
    return a.localeCompare(b);
  });

  for (const filepath of keys) {
    const parts = filepath.split('/');
    let current = root;
    let pathSoFar = '';

    for (let i = 0; i < parts.length; i++) {
      pathSoFar = pathSoFar ? pathSoFar + '/' + parts[i] : parts[i];
      const isLast = i === parts.length - 1;

      let existing = current.find(
        (n) => n.name === parts[i] && n.isFolder === !isLast
      );
      if (!existing) {
        existing = {
          name: parts[i],
          path: pathSoFar,
          isFolder: !isLast,
          isBinary: isLast && binarySet.has(filepath),
          children: [],
        };
        current.push(existing);
      }
      current = existing.children;
    }
  }

  function sortNodes(nodes: TreeNode[]): TreeNode[] {
    return nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    }).map(n => ({ ...n, children: sortNodes(n.children) }));
  }

  return sortNodes(root);
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (name.endsWith('.py')) return <FileCode size={14} className="text-sky-400 flex-shrink-0" />;
  if (name.endsWith('.ipynb')) return <BookOpen size={14} className="text-orange-500 flex-shrink-0" />;
  if (name.endsWith('.html')) return <FileText size={14} className="text-orange-400 flex-shrink-0" />;
  if (name.endsWith('.css')) return <FileText size={14} className="text-blue-400 flex-shrink-0" />;
  if (name.endsWith('.js')) return <FileText size={14} className="text-yellow-400 flex-shrink-0" />;
  if (name.endsWith('.json')) return <FileText size={14} className="text-green-400 flex-shrink-0" />;
  if (name.endsWith('.csv')) return <FileText size={14} className="text-emerald-500 flex-shrink-0" />;
  if (name.endsWith('.md')) return <FileText size={14} className="text-slate-500 flex-shrink-0" />;
  if (name.endsWith('.txt')) return <FileText size={14} className="text-slate-400 flex-shrink-0" />;
  if (IMAGE_EXT.has(ext)) return <ImageIcon size={14} className="text-teal-400 flex-shrink-0" />;
  if (ext === 'pdf') return <FileText size={14} className="text-red-400 flex-shrink-0" />;
  if (ext === 'doc' || ext === 'docx') return <FileText size={14} className="text-blue-500 flex-shrink-0" />;
  if (ext === 'xls' || ext === 'xlsx') return <FileText size={14} className="text-green-600 flex-shrink-0" />;
  if (ext === 'ppt' || ext === 'pptx') return <FileText size={14} className="text-orange-600 flex-shrink-0" />;
  return <File size={14} className="text-slate-400 flex-shrink-0" />;
}

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  activeFile: string;
  previewFile: string | null;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onSelectFile: (path: string) => void;
  onPreviewFile: (path: string) => void;
  onRemoveFile: (path: string) => void;
  onRenameFile: (oldName: string, newName: string) => void;
  renamingPath: string | null;
  onStartRename: (path: string) => void;
  onCancelRename: () => void;
  fileCount: number;
  onContextMenu: (e: React.MouseEvent, path: string, isFolder: boolean) => void;
}

function RenameInput({
  initialValue,
  onCommit,
  onCancel,
}: {
  initialValue: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    input.focus();
    const dotIndex = initialValue.lastIndexOf('.');
    input.setSelectionRange(0, dotIndex > 0 ? dotIndex : initialValue.length);
  }, [initialValue]);

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onCommit(value.trim());
        if (e.key === 'Escape') onCancel();
      }}
      onBlur={() => onCommit(value.trim())}
      className="flex-1 min-w-0 px-1 py-0 text-[11px] border border-sky-400 rounded bg-white outline-none"
    />
  );
}

function TreeItem({
  node,
  depth,
  activeFile,
  previewFile,
  expandedFolders,
  onToggleFolder,
  onSelectFile,
  onPreviewFile,
  onRemoveFile,
  onRenameFile,
  renamingPath,
  onStartRename,
  onCancelRename,
  fileCount,
  onContextMenu,
}: TreeItemProps) {
  const isExpanded = expandedFolders.has(node.path);
  const isCodeActive = !node.isFolder && !node.isBinary && node.path === activeFile;
  const isPreviewActive = !node.isFolder && node.isBinary && node.path === previewFile;
  const isRenaming = renamingPath === node.path;

  if (node.isFolder) {
    return (
      <div>
        <button
          onClick={() => onToggleFolder(node.path)}
          onContextMenu={(e) => onContextMenu(e, node.path, true)}
          className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {isExpanded ? (
            <ChevronDown size={12} className="flex-shrink-0 text-slate-400" />
          ) : (
            <ChevronRight size={12} className="flex-shrink-0 text-slate-400" />
          )}
          {isExpanded ? (
            <FolderOpen size={14} className="text-amber-500 flex-shrink-0" />
          ) : (
            <Folder size={14} className="text-amber-500 flex-shrink-0" />
          )}
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {isExpanded && node.children.map((child) => (
          <TreeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            activeFile={activeFile}
            previewFile={previewFile}
            expandedFolders={expandedFolders}
            onToggleFolder={onToggleFolder}
            onSelectFile={onSelectFile}
            onPreviewFile={onPreviewFile}
            onRemoveFile={onRemoveFile}
            onRenameFile={onRenameFile}
            renamingPath={renamingPath}
            onStartRename={onStartRename}
            onCancelRename={onCancelRename}
            fileCount={fileCount}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>
    );
  }

  if (isRenaming && !node.isBinary) {
    const dir = node.path.includes('/') ? node.path.substring(0, node.path.lastIndexOf('/') + 1) : '';
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1"
        style={{ paddingLeft: `${depth * 12 + 20}px` }}
      >
        {getFileIcon(node.name)}
        <RenameInput
          initialValue={node.name}
          onCommit={(newName) => {
            if (newName && newName !== node.name) {
              onRenameFile(node.path, dir + newName);
            }
            onCancelRename();
          }}
          onCancel={onCancelRename}
        />
      </div>
    );
  }

  const handleClick = () => {
    if (node.isBinary) {
      onPreviewFile(node.path);
    } else {
      onSelectFile(node.path);
    }
  };

  return (
    <button
      onClick={handleClick}
      onDoubleClick={(e) => {
        if (node.isBinary) return;
        e.preventDefault();
        onStartRename(node.path);
      }}
      onContextMenu={(e) => {
        if (node.isBinary) return;
        onContextMenu(e, node.path, false);
      }}
      className={`group w-full flex items-center gap-1.5 px-2 py-1 text-xs transition-colors ${
        isPreviewActive
          ? 'bg-teal-50 text-teal-700 border-r-2 border-teal-500'
          : isCodeActive
            ? 'bg-sky-50 text-sky-700 border-r-2 border-sky-500'
            : 'text-slate-600 hover:bg-slate-100'
      }`}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
      {!node.isBinary && (
        <span className="ml-auto flex items-center gap-0.5 flex-shrink-0">
          <span
            onClick={(e) => {
              e.stopPropagation();
              onStartRename(node.path);
            }}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-200 transition-opacity"
            title="Rename"
          >
            <Pencil size={10} />
          </span>
          {fileCount > 1 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFile(node.path);
              }}
              className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-200 transition-opacity"
            >
              <X size={10} />
            </span>
          )}
        </span>
      )}
    </button>
  );
}

export default function FileManager({
  files,
  activeFile,
  onSelectFile,
  onAddFile,
  onRemoveFile,
  onRenameFile,
  onToggleCollapse,
  binaryFiles,
  previewFile = null,
  onPreviewFile,
}: FileManagerProps) {
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => {
      const folders = new Set<string>();
      const allKeys = [...Object.keys(files), ...Object.keys(binaryFiles || {})];
      for (const key of allKeys) {
        const parts = key.split('/');
        let path = '';
        for (let i = 0; i < parts.length - 1; i++) {
          path = path ? path + '/' + parts[i] : parts[i];
          folders.add(path);
        }
      }
      return folders;
    }
  );
  const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null);
  const [createPrefix, setCreatePrefix] = useState('');
  const [newName, setNewName] = useState('');
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const binaryFilenames = binaryFiles ? Object.keys(binaryFiles) : [];
  const tree = buildTree(files, binaryFilenames);
  const fileCount = Object.keys(files).length;

  function toggleFolder(path: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  useEffect(() => {
    if (!ctxMenu) return;
    function handleClick() { setCtxMenu(null); }
    window.addEventListener('click', handleClick);
    window.addEventListener('contextmenu', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('contextmenu', handleClick);
    };
  }, [ctxMenu]);

  function handleCtxMenu(e: React.MouseEvent, path: string, isFolder: boolean) {
    e.preventDefault();
    e.stopPropagation();
    const rect = panelRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : e.clientX;
    const y = rect ? e.clientY - rect.top : e.clientY;
    setCtxMenu({ x, y, targetPath: path, isFolder });
  }

  function startCreateInFolder(folderPath: string, type: 'file' | 'folder') {
    setCtxMenu(null);
    setCreatePrefix(folderPath + '/');
    setIsCreating(type);
    setNewName('');
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.add(folderPath);
      return next;
    });
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleCreate() {
    const name = newName.trim();
    if (!name) {
      setIsCreating(null);
      setNewName('');
      setCreatePrefix('');
      return;
    }

    const fullPath = createPrefix + name;

    if (isCreating === 'folder') {
      const folderPath = fullPath.replace(/\/+$/, '');
      const placeholder = folderPath + '/.gitkeep';
      if (!files[placeholder]) {
        onAddFile(placeholder);
      }
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        next.add(folderPath);
        return next;
      });
    } else {
      const hasExtension = /\.\w+$/.test(name);
      const finalName = hasExtension ? fullPath : fullPath + '.py';
      if (!files[finalName]) {
        onAddFile(finalName);
        onSelectFile(finalName);
      }
      const parts = finalName.split('/');
      if (parts.length > 1) {
        setExpandedFolders((prev) => {
          const next = new Set(prev);
          let path = '';
          for (let i = 0; i < parts.length - 1; i++) {
            path = path ? path + '/' + parts[i] : parts[i];
            next.add(path);
          }
          return next;
        });
      }
    }

    setIsCreating(null);
    setNewName('');
    setCreatePrefix('');
  }

  const handlePreviewFile = (path: string) => {
    onPreviewFile?.(path);
  };

  return (
    <div ref={panelRef} className="relative flex flex-col bg-slate-50 h-full overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-200 shrink-0">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Files</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => {
              setCreatePrefix('');
              setIsCreating('file');
              setNewName('');
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
            title="New file"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={() => {
              setCreatePrefix('');
              setIsCreating('folder');
              setNewName('');
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
            title="New folder"
          >
            <FolderPlus size={12} />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
            title="Collapse file manager"
          >
            <PanelLeftClose size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {tree.map((node) => (
          <TreeItem
            key={node.path}
            node={node}
            depth={0}
            activeFile={activeFile}
            previewFile={previewFile}
            expandedFolders={expandedFolders}
            onToggleFolder={toggleFolder}
            onSelectFile={onSelectFile}
            onPreviewFile={handlePreviewFile}
            onRemoveFile={onRemoveFile}
            onRenameFile={onRenameFile}
            renamingPath={renamingPath}
            onStartRename={setRenamingPath}
            onCancelRename={() => setRenamingPath(null)}
            fileCount={fileCount}
            onContextMenu={handleCtxMenu}
          />
        ))}

        {isCreating && (
          <div className="px-2 py-1">
            {createPrefix && (
              <div className="text-[10px] text-slate-400 mb-0.5 truncate">{createPrefix}</div>
            )}
            <input
              ref={inputRef}
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') {
                  setIsCreating(null);
                  setNewName('');
                  setCreatePrefix('');
                }
              }}
              onBlur={handleCreate}
              placeholder={
                isCreating === 'folder'
                  ? 'folder name'
                  : 'filename.py'
              }
              className="w-full px-1.5 py-0.5 text-[11px] border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-400 bg-white"
            />
          </div>
        )}
      </div>

      {ctxMenu && (
        <div
          className="absolute z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-40 text-xs"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
        >
          {ctxMenu.isFolder ? (
            <>
              <button
                onClick={() => startCreateInFolder(ctxMenu.targetPath, 'file')}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Plus size={12} />
                New File
              </button>
              <button
                onClick={() => startCreateInFolder(ctxMenu.targetPath, 'folder')}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <FolderPlus size={12} />
                New Folder
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setCtxMenu(null);
                  setRenamingPath(ctxMenu.targetPath);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Pencil size={12} />
                Rename
              </button>
              {fileCount > 1 && (
                <button
                  onClick={() => {
                    setCtxMenu(null);
                    onRemoveFile(ctxMenu.targetPath);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
