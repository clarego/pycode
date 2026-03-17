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

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineMarkdown(text: string): string {
  let s = escapeHtml(text);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-[12px] font-mono">$1</code>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_: string, t: string, url: string) => {
    if (url.trim().toLowerCase().startsWith('javascript:')) return t;
    return `<a href="${url}" class="text-sky-600 underline" target="_blank" rel="noopener noreferrer">${t}</a>`;
  });
  return s;
}

function parseTableRow(line: string): string[] {
  return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|?[\s-:]+(\|[\s-:]+)+\|?$/.test(line.trim());
}

function simpleMarkdown(src: string): string {
  const lines = src.split('\n');
  const parts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = parseTableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        rows.push(parseTableRow(lines[i].trim()));
        i++;
      }
      let table = '<table class="border-collapse my-2 text-sm w-auto">';
      table += '<thead><tr>';
      for (const h of headers) {
        table += `<th class="border border-slate-300 px-3 py-1.5 bg-slate-100 font-semibold text-left">${inlineMarkdown(h)}</th>`;
      }
      table += '</tr></thead><tbody>';
      for (const row of rows) {
        table += '<tr>';
        for (let c = 0; c < headers.length; c++) {
          table += `<td class="border border-slate-300 px-3 py-1.5">${inlineMarkdown(row[c] || '')}</td>`;
        }
        table += '</tr>';
      }
      table += '</tbody></table>';
      parts.push(table);
      continue;
    }

    if (trimmed.startsWith('### ')) {
      parts.push(`<h3 class="text-base font-semibold mt-3 mb-1">${inlineMarkdown(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith('## ')) {
      parts.push(`<h2 class="text-lg font-semibold mt-3 mb-1">${inlineMarkdown(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith('# ')) {
      parts.push(`<h1 class="text-xl font-bold mt-3 mb-2">${inlineMarkdown(trimmed.slice(2))}</h1>`);
    } else if (trimmed.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(`<li class="ml-4 list-disc">${inlineMarkdown(lines[i].trim().slice(2))}</li>`);
        i++;
      }
      parts.push(`<ul class="my-1">${items.join('')}</ul>`);
      continue;
    } else if (/^\d+\. /.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        items.push(`<li class="ml-4 list-decimal">${inlineMarkdown(lines[i].trim().replace(/^\d+\. /, ''))}</li>`);
        i++;
      }
      parts.push(`<ol class="my-1">${items.join('')}</ol>`);
      continue;
    } else if (trimmed.startsWith('---')) {
      parts.push('<hr class="border-slate-200 my-2" />');
    } else if (trimmed.startsWith('&gt;') || trimmed.startsWith('>')) {
      const raw = trimmed.startsWith('&gt;') ? trimmed.slice(4).trim() : trimmed.slice(1).trim();
      parts.push(`<blockquote class="border-l-4 border-slate-300 pl-3 my-1 text-slate-600 italic">${inlineMarkdown(raw)}</blockquote>`);
    } else if (trimmed === '') {
      parts.push('<div class="h-2"></div>');
    } else {
      parts.push(`<p class="my-1.5">${inlineMarkdown(trimmed)}</p>`);
    }
    i++;
  }

  return parts.join('');
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
