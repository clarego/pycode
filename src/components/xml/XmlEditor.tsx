import { useState, useEffect, useCallback } from 'react';
import { Code2, TreePine, AlertCircle, Wand2, Plus, Trash2, Check, X, ChevronRight } from 'lucide-react';
import CodeEditor from '../CodeEditor';
import XmlTreeNode from './XmlTreeNode';
import {
  parseXml,
  setAttributeAtPath,
  removeAttributeAtPath,
  addChildElementAtPath,
  removeNodeAtPath,
  renameElementAtPath,
  formatXml,
} from './xmlParser';
import type { XmlNode } from './xmlParser';

interface XmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  filename?: string;
  readOnly?: boolean;
  hackerMode?: boolean;
}

type ViewMode = 'split' | 'tree' | 'source';

interface AttributeEdit {
  key: string;
  value: string;
}

export default function XmlEditor({ value, onChange, filename, readOnly = false, hackerMode = false }: XmlEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<XmlNode | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedNodes, setParsedNodes] = useState<XmlNode[]>([]);
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');
  const [addingAttr, setAddingAttr] = useState(false);
  const [editingAttr, setEditingAttr] = useState<string | null>(null);
  const [attrEditValue, setAttrEditValue] = useState('');
  const [textEditValue, setTextEditValue] = useState('');
  const [editingText, setEditingText] = useState(false);

  useEffect(() => {
    if (!value.trim()) {
      setParsedNodes([]);
      setParseError(null);
      return;
    }
    const result = parseXml(value);
    setParsedNodes(result.nodes);
    setParseError(result.error);
  }, [value]);

  useEffect(() => {
    if (!selectedPath) { setSelectedNode(null); return; }
    const found = findNodeByPath(parsedNodes, selectedPath);
    setSelectedNode(found);
    if (found?.type === 'text') {
      setTextEditValue(found.value || '');
    }
  }, [selectedPath, parsedNodes]);

  function findNodeByPath(nodes: XmlNode[], path: string): XmlNode | null {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.children) {
        const found = findNodeByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  }

  const handleFormat = useCallback(() => {
    const formatted = formatXml(value);
    if (formatted !== value) onChange(formatted);
  }, [value, onChange]);

  const handleSetAttr = useCallback((attrName: string, attrValue: string) => {
    if (!selectedPath) return;
    const updated = setAttributeAtPath(value, selectedPath, attrName, attrValue);
    onChange(updated);
  }, [value, onChange, selectedPath]);

  const handleRemoveAttr = useCallback((attrName: string) => {
    if (!selectedPath) return;
    const updated = removeAttributeAtPath(value, selectedPath, attrName);
    onChange(updated);
  }, [value, onChange, selectedPath]);

  const handleAddChild = useCallback((path: string, tagName: string) => {
    const updated = addChildElementAtPath(value, path, tagName);
    onChange(updated);
  }, [value, onChange]);

  const handleRemoveNode = useCallback((path: string) => {
    const updated = removeNodeAtPath(value, path);
    onChange(updated);
    if (selectedPath === path || selectedPath?.startsWith(path + '.')) {
      setSelectedPath(null);
    }
  }, [value, onChange, selectedPath]);

  const handleRenameNode = useCallback((path: string, newName: string) => {
    const updated = renameElementAtPath(value, path, newName);
    onChange(updated);
  }, [value, onChange]);

  const handleSaveAttr = (key: string) => {
    handleSetAttr(key, attrEditValue);
    setEditingAttr(null);
  };

  const handleAddNewAttr = () => {
    if (!newAttrKey.trim()) return;
    handleSetAttr(newAttrKey.trim(), newAttrValue);
    setNewAttrKey('');
    setNewAttrValue('');
    setAddingAttr(false);
  };

  const handleSaveText = () => {
    if (!selectedPath || !selectedNode) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(value, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) return;

    const parts = selectedPath.split('.');
    let node: Node | null = doc.documentElement;
    for (let i = 1; i < parts.length; i++) {
      const idx = parseInt(parts[i], 10);
      if (!node) break;
      let count = 0;
      let found: Node | null = null;
      for (let j = 0; j < (node as Element).childNodes.length; j++) {
        const c = (node as Element).childNodes[j];
        const relevant =
          c.nodeType === Node.ELEMENT_NODE ||
          (c.nodeType === Node.TEXT_NODE && (c.textContent || '').trim()) ||
          c.nodeType === Node.COMMENT_NODE ||
          c.nodeType === Node.CDATA_SECTION_NODE;
        if (relevant) {
          if (count === idx) { found = c; break; }
          count++;
        }
      }
      node = found;
    }
    if (node) node.textContent = textEditValue;
    onChange(new XMLSerializer().serializeToString(doc));
    setEditingText(false);
  };

  const propertiesPanel = selectedNode ? (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Properties</span>
          {selectedNode.name && (
            <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {`<${selectedNode.name}>`}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {selectedNode.type === 'element' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Attributes</span>
              {!readOnly && (
                <button
                  onClick={() => setAddingAttr(true)}
                  className="flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 px-1.5 py-0.5 rounded hover:bg-emerald-50 transition-colors"
                >
                  <Plus size={10} />
                  Add
                </button>
              )}
            </div>

            {Object.entries(selectedNode.attributes || {}).length === 0 && !addingAttr && (
              <p className="text-[11px] text-slate-400 italic">No attributes</p>
            )}

            <div className="space-y-1.5">
              {Object.entries(selectedNode.attributes || {}).map(([key, val]) => (
                <div key={key} className="group">
                  {editingAttr === key ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono font-medium text-slate-600">{key}</span>
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          value={attrEditValue}
                          onChange={e => setAttrEditValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveAttr(key);
                            if (e.key === 'Escape') setEditingAttr(null);
                          }}
                          className="flex-1 px-2 py-1 text-xs border border-sky-400 rounded bg-white outline-none font-mono"
                        />
                        <button onClick={() => handleSaveAttr(key)} className="p-1 rounded hover:bg-emerald-100 text-emerald-600">
                          <Check size={12} />
                        </button>
                        <button onClick={() => setEditingAttr(null)} className="p-1 rounded hover:bg-red-100 text-red-500">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-1">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono text-sky-700 font-medium">{key}</span>
                        <span className="text-[10px] text-slate-400 mx-1">=</span>
                        <span className="text-[10px] font-mono text-amber-700 break-all">"{val}"</span>
                      </div>
                      {!readOnly && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                          <button
                            onClick={() => { setEditingAttr(key); setAttrEditValue(val); }}
                            className="p-0.5 rounded hover:bg-slate-200 text-slate-400"
                          >
                            <Pencil size={10} />
                          </button>
                          <button
                            onClick={() => handleRemoveAttr(key)}
                            className="p-0.5 rounded hover:bg-red-100 text-red-400"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {addingAttr && (
                <div className="flex flex-col gap-1 border border-emerald-200 rounded p-2 bg-emerald-50/50">
                  <input
                    autoFocus
                    value={newAttrKey}
                    onChange={e => setNewAttrKey(e.target.value)}
                    placeholder="attribute name"
                    onKeyDown={e => { if (e.key === 'Escape') setAddingAttr(false); }}
                    className="px-2 py-1 text-xs border border-slate-300 rounded bg-white outline-none font-mono focus:border-sky-400"
                  />
                  <input
                    value={newAttrValue}
                    onChange={e => setNewAttrValue(e.target.value)}
                    placeholder="value"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddNewAttr();
                      if (e.key === 'Escape') setAddingAttr(false);
                    }}
                    className="px-2 py-1 text-xs border border-slate-300 rounded bg-white outline-none font-mono focus:border-sky-400"
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={handleAddNewAttr}
                      className="flex-1 flex items-center justify-center gap-1 py-1 bg-emerald-500 text-white rounded text-xs hover:bg-emerald-600 transition-colors"
                    >
                      <Check size={11} /> Add
                    </button>
                    <button
                      onClick={() => setAddingAttr(false)}
                      className="flex items-center justify-center px-2 py-1 border border-slate-300 text-slate-600 rounded text-xs hover:bg-slate-100 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedNode.type === 'text' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Text Content</span>
              {!readOnly && !editingText && (
                <button
                  onClick={() => setEditingText(true)}
                  className="flex items-center gap-1 text-[10px] text-sky-600 hover:text-sky-700 px-1.5 py-0.5 rounded hover:bg-sky-50 transition-colors"
                >
                  <Pencil size={10} />
                  Edit
                </button>
              )}
            </div>
            {editingText ? (
              <div className="flex flex-col gap-1.5">
                <textarea
                  autoFocus
                  value={textEditValue}
                  onChange={e => setTextEditValue(e.target.value)}
                  rows={4}
                  className="w-full px-2 py-1.5 text-xs border border-sky-400 rounded bg-white outline-none font-mono resize-y"
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleSaveText}
                    className="flex-1 flex items-center justify-center gap-1 py-1 bg-sky-500 text-white rounded text-xs hover:bg-sky-600 transition-colors"
                  >
                    <Check size={11} /> Save
                  </button>
                  <button
                    onClick={() => setEditingText(false)}
                    className="flex items-center justify-center px-2 py-1 border border-slate-300 text-slate-600 rounded text-xs hover:bg-slate-100 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs font-mono text-slate-700 bg-slate-50 rounded p-2 border border-slate-200 whitespace-pre-wrap break-words">
                {selectedNode.value}
              </p>
            )}
          </div>
        )}

        {selectedNode.type === 'comment' && (
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Comment</span>
            <p className="text-xs font-mono text-slate-500 italic bg-slate-50 rounded p-2 border border-slate-200">
              {`<!-- ${selectedNode.value} -->`}
            </p>
          </div>
        )}

        {selectedNode.type === 'element' && selectedNode.children && (
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Children ({selectedNode.children.length})
            </span>
            <div className="space-y-0.5">
              {selectedNode.children.slice(0, 5).map(c => (
                <button
                  key={c.path}
                  onClick={() => setSelectedPath(c.path)}
                  className="w-full text-left flex items-center gap-1.5 px-2 py-1 text-[11px] rounded hover:bg-slate-100 transition-colors"
                >
                  <ChevronRight size={10} className="text-slate-400" />
                  <span className="font-mono text-emerald-700">
                    {c.type === 'element' ? `<${c.name}>` : c.type === 'text' ? `"${(c.value || '').slice(0, 20)}${(c.value || '').length > 20 ? '...' : ''}"` : c.type}
                  </span>
                </button>
              ))}
              {selectedNode.children.length > 5 && (
                <p className="text-[10px] text-slate-400 px-2">+{selectedNode.children.length - 5} more</p>
              )}
            </div>
          </div>
        )}

        {selectedNode.type === 'element' && !readOnly && selectedPath && selectedPath !== '0' && (
          <div className="pt-2 border-t border-slate-200">
            <button
              onClick={() => handleRemoveNode(selectedPath)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 size={12} />
              Remove Element
            </button>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="h-full flex items-center justify-center">
      <p className="text-[11px] text-slate-400 text-center px-4">Select an element in the tree to view and edit its properties</p>
    </div>
  );

  const treePanel = (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">
      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">XML Tree</span>
        {!readOnly && (
          <button
            onClick={handleFormat}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700 px-1.5 py-0.5 rounded hover:bg-slate-200 transition-colors"
            title="Format / Pretty-print XML"
          >
            <Wand2 size={10} />
            Format
          </button>
        )}
      </div>

      {parseError ? (
        <div className="p-3 flex-1">
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-0.5">Parse Error</p>
              <p className="text-[10px] font-mono leading-relaxed">{parseError}</p>
            </div>
          </div>
        </div>
      ) : !value.trim() ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[11px] text-slate-400 text-center px-4">Start typing XML to see the tree</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-1">
          {parsedNodes.map(node => (
            <XmlTreeNode
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
              onAddChild={!readOnly ? handleAddChild : () => {}}
              onRemove={!readOnly ? handleRemoveNode : () => {}}
              onRename={!readOnly ? handleRenameNode : () => {}}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{filename}</span>
          {parseError && (
            <div className="flex items-center gap-1 text-[10px] text-red-600">
              <AlertCircle size={10} />
              Invalid XML
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 bg-slate-200 rounded p-0.5">
          {(['tree', 'split', 'source'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1 px-2 py-0.5 text-[10px] rounded transition-colors font-medium ${
                viewMode === mode
                  ? 'bg-white text-slate-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {mode === 'tree' && <TreePine size={10} />}
              {mode === 'split' && <span className="font-mono">⊞</span>}
              {mode === 'source' && <Code2 size={10} />}
              <span className="capitalize">{mode}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {(viewMode === 'tree' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-64 flex-shrink-0' : 'w-56 flex-shrink-0'} border-r border-slate-200 overflow-hidden flex flex-col`}>
            {treePanel}
          </div>
        )}

        {viewMode === 'split' && (
          <div className="w-72 flex-shrink-0 border-r border-slate-200 overflow-hidden flex flex-col">
            {propertiesPanel}
          </div>
        )}

        {(viewMode === 'source' || viewMode === 'split') && (
          <div className="flex-1 min-w-0 overflow-hidden">
            <CodeEditor
              value={value}
              onChange={onChange}
              filename={filename}
              readOnly={readOnly}
              hackerMode={hackerMode}
            />
          </div>
        )}

        {viewMode === 'tree' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {propertiesPanel}
          </div>
        )}
      </div>
    </div>
  );
}

function Pencil({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    </svg>
  );
}
