import { useState } from 'react';
import { ChevronRight, ChevronDown, Tag, FileText, MessageSquare, Hash, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import type { XmlNode } from './xmlParser';

interface XmlTreeNodeProps {
  node: XmlNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onAddChild: (path: string, tagName: string) => void;
  onRemove: (path: string) => void;
  onRename: (path: string, newName: string) => void;
}

export default function XmlTreeNode({
  node,
  depth,
  selectedPath,
  onSelect,
  onAddChild,
  onRemove,
  onRename,
}: XmlTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 3);
  const [addingChild, setAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name || '');

  const isSelected = selectedPath === node.path;
  const hasChildren = node.children && node.children.length > 0;
  const pad = depth * 16;

  if (node.type === 'text') {
    return (
      <div
        className={`flex items-start gap-1.5 px-2 py-0.5 text-xs cursor-pointer select-none transition-colors rounded mx-1 ${
          isSelected ? 'bg-sky-100 text-sky-800' : 'text-slate-500 hover:bg-slate-100'
        }`}
        style={{ paddingLeft: `${pad + 8}px` }}
        onClick={() => onSelect(node.path)}
      >
        <FileText size={12} className="mt-0.5 flex-shrink-0 text-slate-400" />
        <span className="font-mono truncate italic">{node.value}</span>
      </div>
    );
  }

  if (node.type === 'comment') {
    return (
      <div
        className={`flex items-start gap-1.5 px-2 py-0.5 text-xs cursor-pointer select-none transition-colors rounded mx-1 ${
          isSelected ? 'bg-sky-100 text-sky-800' : 'text-slate-400 hover:bg-slate-100'
        }`}
        style={{ paddingLeft: `${pad + 8}px` }}
        onClick={() => onSelect(node.path)}
      >
        <MessageSquare size={12} className="mt-0.5 flex-shrink-0" />
        <span className="font-mono truncate italic">{`<!-- ${node.value} -->`}</span>
      </div>
    );
  }

  if (node.type === 'cdata') {
    return (
      <div
        className={`flex items-start gap-1.5 px-2 py-0.5 text-xs cursor-pointer select-none transition-colors rounded mx-1 ${
          isSelected ? 'bg-sky-100 text-sky-800' : 'text-slate-400 hover:bg-slate-100'
        }`}
        style={{ paddingLeft: `${pad + 8}px` }}
        onClick={() => onSelect(node.path)}
      >
        <Hash size={12} className="mt-0.5 flex-shrink-0" />
        <span className="font-mono truncate">{`CDATA[${node.value}]`}</span>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`group flex items-center gap-1 px-1 py-0.5 text-xs cursor-pointer select-none transition-colors rounded mx-1 ${
          isSelected
            ? 'bg-sky-100 text-sky-800'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
        style={{ paddingLeft: `${pad + 4}px` }}
        onClick={() => {
          onSelect(node.path);
          if (hasChildren) setExpanded(e => !e);
        }}
      >
        <span
          className="w-4 h-4 flex items-center justify-center flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setExpanded(v => !v);
          }}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown size={12} className="text-slate-400" />
            ) : (
              <ChevronRight size={12} className="text-slate-400" />
            )
          ) : null}
        </span>

        <Tag size={12} className={`flex-shrink-0 ${isSelected ? 'text-sky-600' : 'text-emerald-500'}`} />

        {renaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (renameValue.trim() && renameValue !== node.name) {
                  onRename(node.path, renameValue.trim());
                }
                setRenaming(false);
              }
              if (e.key === 'Escape') setRenaming(false);
            }}
            onBlur={() => setRenaming(false)}
            onClick={e => e.stopPropagation()}
            className="flex-1 min-w-0 px-1 py-0 border border-sky-400 rounded bg-white outline-none text-xs font-mono font-semibold"
          />
        ) : (
          <span className="font-mono font-semibold truncate flex-1">{node.name}</span>
        )}

        {node.attributes && Object.keys(node.attributes).length > 0 && !renaming && (
          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
            {Object.entries(node.attributes)
              .slice(0, 2)
              .map(([k, v]) => `${k}="${v}"`)
              .join(' ')}
            {Object.keys(node.attributes).length > 2 && '...'}
          </span>
        )}

        <span className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
          {!renaming && (
            <>
              <button
                title="Rename element"
                onClick={e => {
                  e.stopPropagation();
                  setRenameValue(node.name || '');
                  setRenaming(true);
                }}
                className="p-0.5 rounded hover:bg-slate-200 transition-colors"
              >
                <Pencil size={10} />
              </button>
              <button
                title="Add child element"
                onClick={e => {
                  e.stopPropagation();
                  setAddingChild(true);
                  setExpanded(true);
                  setNewChildName('');
                }}
                className="p-0.5 rounded hover:bg-emerald-100 text-emerald-600 transition-colors"
              >
                <Plus size={10} />
              </button>
              {depth > 0 && (
                <button
                  title="Remove element"
                  onClick={e => {
                    e.stopPropagation();
                    onRemove(node.path);
                  }}
                  className="p-0.5 rounded hover:bg-red-100 text-red-500 transition-colors"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </>
          )}
          {renaming && (
            <>
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (renameValue.trim() && renameValue !== node.name) {
                    onRename(node.path, renameValue.trim());
                  }
                  setRenaming(false);
                }}
                className="p-0.5 rounded hover:bg-emerald-100 text-emerald-600"
              >
                <Check size={10} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setRenaming(false); }}
                className="p-0.5 rounded hover:bg-red-100 text-red-500"
              >
                <X size={10} />
              </button>
            </>
          )}
        </span>
      </div>

      {expanded && (
        <>
          {node.children?.map((child) => (
            <XmlTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onRemove={onRemove}
              onRename={onRename}
            />
          ))}

          {addingChild && (
            <div
              className="flex items-center gap-1 px-2 py-1 mx-1"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              <Tag size={12} className="text-emerald-400 flex-shrink-0" />
              <input
                autoFocus
                value={newChildName}
                onChange={e => setNewChildName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newChildName.trim()) {
                    onAddChild(node.path, newChildName.trim());
                    setAddingChild(false);
                    setNewChildName('');
                  }
                  if (e.key === 'Escape') {
                    setAddingChild(false);
                    setNewChildName('');
                  }
                }}
                onBlur={() => {
                  if (newChildName.trim()) {
                    onAddChild(node.path, newChildName.trim());
                  }
                  setAddingChild(false);
                  setNewChildName('');
                }}
                placeholder="element name"
                className="flex-1 px-1.5 py-0.5 text-[11px] border border-emerald-400 rounded bg-white outline-none font-mono"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
