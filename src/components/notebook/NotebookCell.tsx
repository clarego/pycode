import { useState } from 'react';
import { Play, Trash2, ChevronUp, ChevronDown, Plus, Code2, Type } from 'lucide-react';
import CellCodeEditor from './CellCodeEditor';
import type { NotebookCell as CellType } from '../../lib/notebook';
import type { OutputLine, PlotData } from '../../hooks/usePyodide';

export interface CellOutput {
  lines: OutputLine[];
  plots: PlotData[];
}

interface NotebookCellProps {
  cell: CellType;
  index: number;
  total: number;
  isRunning: boolean;
  cellOutput: CellOutput | null;
  onSourceChange: (source: string) => void;
  onRun: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onChangeType: (type: 'code' | 'markdown') => void;
  onAddBelow: (type: 'code' | 'markdown') => void;
}

function simpleMarkdown(src: string): string {
  let html = src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-3 mb-1">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-3 mb-2">$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-[12px] font-mono">$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_: string, text: string, url: string) => {
    if (url.trim().toLowerCase().startsWith('javascript:')) return text;
    return `<a href="${url}" class="text-sky-600 underline" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
  html = html.replace(/(<li.*<\/li>\n?)+/g, (match) => `<ul class="my-1">${match}</ul>`);
  html = html.replace(/\n\n/g, '</p><p class="my-1.5">');
  html = html.replace(/\n/g, '<br/>');

  return `<p class="my-1.5">${html}</p>`;
}

function AddCellButton({ onAdd }: { onAdd: (type: 'code' | 'markdown') => void }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative flex justify-center h-0 z-10">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          onBlur={() => setTimeout(() => setShowMenu(false), 150)}
          className="p-0.5 text-slate-300 hover:text-slate-500 bg-white border border-slate-200 rounded-full shadow-sm"
          title="Add cell below"
        >
          <Plus size={12} />
        </button>
        {showMenu && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-32">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onAdd('code'); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Code2 size={12} /> Code
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onAdd('markdown'); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Type size={12} /> Markdown
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CellOutputDisplay({ cellOutput }: { cellOutput: CellOutput }) {
  if (cellOutput.lines.length === 0 && cellOutput.plots.length === 0) return null;

  return (
    <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 font-mono text-[12px] leading-relaxed max-h-72 overflow-auto">
      {cellOutput.lines.map((line, i) => {
        let cls = 'whitespace-pre-wrap break-all';
        if (line.type === 'stderr') cls += ' text-amber-600';
        else if (line.type === 'error') cls += ' text-red-600';
        else if (line.type === 'status') cls += ' text-sky-600 italic';
        else if (line.type === 'info') cls += ' text-slate-500 italic';
        else cls += ' text-slate-700';
        return <div key={i} className={cls}>{line.text}</div>;
      })}
      {cellOutput.plots.map((plot, i) => (
        <div key={`p${i}`} className="mt-2 rounded overflow-hidden border border-slate-200 bg-white inline-block">
          <img src={`data:image/png;base64,${plot.data}`} alt={`Plot ${i + 1}`} className="max-w-full h-auto" />
        </div>
      ))}
    </div>
  );
}

export default function NotebookCellComponent({
  cell,
  index,
  total,
  isRunning,
  cellOutput,
  onSourceChange,
  onRun,
  onDelete,
  onMoveUp,
  onMoveDown,
  onChangeType,
  onAddBelow,
}: NotebookCellProps) {
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false);

  if (cell.cell_type === 'markdown') {
    return (
      <div className="group relative mb-2">
        <div className="border border-slate-200 rounded-lg bg-white hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between px-3 py-1 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Type size={12} className="text-slate-400" />
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Markdown</span>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onMoveUp} disabled={index === 0} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded" title="Move up">
                <ChevronUp size={13} />
              </button>
              <button onClick={onMoveDown} disabled={index === total - 1} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded" title="Move down">
                <ChevronDown size={13} />
              </button>
              <button onClick={() => onChangeType('code')} className="p-1 text-slate-400 hover:text-slate-600 rounded" title="Convert to code">
                <Code2 size={12} />
              </button>
              <button onClick={onDelete} disabled={total <= 1} className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 rounded" title="Delete cell">
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {isEditingMarkdown ? (
            <textarea
              value={cell.source}
              onChange={(e) => onSourceChange(e.target.value)}
              onBlur={() => { if (cell.source.trim()) setIsEditingMarkdown(false); }}
              className="w-full p-3 text-sm font-mono bg-transparent border-none outline-none resize-none min-h-[60px]"
              placeholder="Enter markdown..."
              autoFocus
              rows={Math.max(3, cell.source.split('\n').length)}
            />
          ) : (
            <div
              onClick={() => setIsEditingMarkdown(true)}
              className="px-4 py-3 text-sm text-slate-700 cursor-text min-h-[40px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: cell.source.trim() ? simpleMarkdown(cell.source) : '<span class="text-slate-400 italic">Click to edit markdown...</span>' }}
            />
          )}
        </div>
        <AddCellButton onAdd={onAddBelow} />
      </div>
    );
  }

  return (
    <div className="group relative mb-2">
      <div className={`border rounded-lg bg-white transition-colors ${
        isRunning ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'
      }`}>
        <div className="flex items-center justify-between px-3 py-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={onRun}
              disabled={isRunning}
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 rounded transition-colors"
              title="Run cell (Shift+Enter)"
            >
              {isRunning ? (
                <span className="w-2.5 h-2.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play size={11} fill="currentColor" />
              )}
              Run
            </button>
            <span className="text-[10px] font-mono text-slate-400">
              [{cell.execution_count ?? ' '}]
            </span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onMoveUp} disabled={index === 0} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded" title="Move up">
              <ChevronUp size={13} />
            </button>
            <button onClick={onMoveDown} disabled={index === total - 1} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded" title="Move down">
              <ChevronDown size={13} />
            </button>
            <button onClick={() => onChangeType('markdown')} className="p-1 text-slate-400 hover:text-slate-600 rounded" title="Convert to markdown">
              <Type size={12} />
            </button>
            <button onClick={onDelete} disabled={total <= 1} className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 rounded" title="Delete cell">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        <CellCodeEditor
          value={cell.source}
          onChange={onSourceChange}
          onRun={onRun}
        />

        {cellOutput && <CellOutputDisplay cellOutput={cellOutput} />}
      </div>
      <AddCellButton onAdd={onAddBelow} />
    </div>
  );
}
