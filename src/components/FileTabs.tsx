import { useState, useRef, useEffect } from 'react';
import { X, Plus, FileCode, BookOpen } from 'lucide-react';

interface FileTabsProps {
  files: Record<string, string>;
  activeFile: string;
  onSelectFile: (filename: string) => void;
  onAddFile: (filename: string) => void;
  onRemoveFile: (filename: string) => void;
  onRenameFile: (oldName: string, newName: string) => void;
}

function TabRenameInput({
  initialValue,
  onCommit,
  onCancel,
}: {
  initialValue: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const display = initialValue.includes('/') ? initialValue.split('/').pop()! : initialValue;
  const [value, setValue] = useState(display);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    input.focus();
    const dotIndex = display.lastIndexOf('.');
    input.setSelectionRange(0, dotIndex > 0 ? dotIndex : display.length);
  }, [display]);

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
      className="w-24 px-1 py-0 text-xs border border-sky-400 rounded bg-white outline-none"
    />
  );
}

export default function FileTabs({
  files,
  activeFile,
  onSelectFile,
  onAddFile,
  onRemoveFile,
  onRenameFile,
}: FileTabsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingTab, setRenamingTab] = useState<string | null>(null);

  const filenames = Object.keys(files);

  function handleAddFile() {
    const name = newFileName.trim();
    if (!name) {
      setIsAdding(false);
      return;
    }
    const hasExtension = /\.\w+$/.test(name);
    const finalName = hasExtension ? name : name + '.py';
    if (files[finalName]) {
      setIsAdding(false);
      setNewFileName('');
      return;
    }
    onAddFile(finalName);
    setIsAdding(false);
    setNewFileName('');
  }

  function handleTabRename(oldPath: string, newFileName: string) {
    if (!newFileName || newFileName === (oldPath.includes('/') ? oldPath.split('/').pop() : oldPath)) {
      setRenamingTab(null);
      return;
    }
    const dir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/') + 1) : '';
    onRenameFile(oldPath, dir + newFileName);
    setRenamingTab(null);
  }

  return (
    <div className="flex items-center bg-slate-50 border-b border-slate-200 overflow-x-auto">
      {filenames.map((name) => (
        <div
          key={name}
          onClick={() => { if (renamingTab !== name) onSelectFile(name); }}
          onDoubleClick={(e) => {
            e.preventDefault();
            setRenamingTab(name);
          }}
          className={`group flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-r border-slate-200 transition-colors whitespace-nowrap cursor-pointer ${
            name === activeFile
              ? 'bg-white text-slate-800 shadow-[inset_0_-2px_0_0_#0ea5e9]'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          {name.endsWith('.ipynb') ? (
            <BookOpen size={13} className="flex-shrink-0 text-orange-500" />
          ) : (
            <FileCode size={13} className="flex-shrink-0" />
          )}
          {renamingTab === name ? (
            <TabRenameInput
              initialValue={name}
              onCommit={(newName) => handleTabRename(name, newName)}
              onCancel={() => setRenamingTab(null)}
            />
          ) : (
            <span title={name}>{name.includes('/') ? name.split('/').pop() : name}</span>
          )}
          {filenames.length > 1 && renamingTab !== name && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFile(name);
              }}
              className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-200 transition-opacity"
            >
              <X size={11} />
            </span>
          )}
        </div>
      ))}

      {isAdding ? (
        <div className="flex items-center px-2">
          <input
            autoFocus
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddFile();
              if (e.key === 'Escape') {
                setIsAdding(false);
                setNewFileName('');
              }
            }}
            onBlur={handleAddFile}
            placeholder="path/filename.ext"
            className="w-28 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 px-2.5 py-2 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Add file"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );
}
