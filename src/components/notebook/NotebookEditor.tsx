import { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Plus, Download, Code2, Type, RotateCcw, Cloud, CloudOff, Loader2 } from 'lucide-react';
import NotebookCellComponent from './NotebookCell';
import type { CellOutput } from './NotebookCell';
import {
  parseNotebook,
  serializeNotebook,
  generateCellId,
  extractCodeCells,
} from '../../lib/notebook';
import type { NotebookDocument, NotebookCell } from '../../lib/notebook';
import type { OutputLine, PlotData } from '../../hooks/usePyodide';

interface NotebookEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRunCode: (code: string) => void;
  isRunning: boolean;
  output: OutputLine[];
  plots: PlotData[];
  filename?: string;
  onSave?: () => Promise<void>;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'unsaved';
}

export default function NotebookEditor({
  value,
  onChange,
  onRunCode,
  isRunning,
  output,
  plots,
  filename,
  onSave,
  saveStatus = 'idle',
}: NotebookEditorProps) {
  const [notebook, setNotebook] = useState<NotebookDocument>(() => parseNotebook(value));
  const [cellOutputs, setCellOutputs] = useState<Record<string, CellOutput>>({});
  const [runningCellId, setRunningCellId] = useState<string | null>(null);
  const [executionCount, setExecutionCount] = useState(1);
  const prevIsRunning = useRef(isRunning);
  const lastExternalValue = useRef(value);

  useEffect(() => {
    if (value !== lastExternalValue.current) {
      lastExternalValue.current = value;
      setNotebook(parseNotebook(value));
    }
  }, [value]);

  const pushChanges = useCallback(
    (doc: NotebookDocument) => {
      const json = serializeNotebook(doc);
      lastExternalValue.current = json;
      onChange(json);
    },
    [onChange]
  );

  useEffect(() => {
    if (prevIsRunning.current && !isRunning && runningCellId) {
      if (runningCellId !== '__all__') {
        setCellOutputs((prev) => ({
          ...prev,
          [runningCellId]: { lines: [...output], plots: [...plots] },
        }));
        setNotebook((prev) => {
          const updated = {
            ...prev,
            cells: prev.cells.map((c) =>
              c.id === runningCellId ? { ...c, execution_count: executionCount } : c
            ),
          };
          pushChanges(updated);
          return updated;
        });
        setExecutionCount((c) => c + 1);
      }
      setRunningCellId(null);
    }
    prevIsRunning.current = isRunning;
  }, [isRunning, runningCellId, output, plots, executionCount, pushChanges]);

  const handleCellSourceChange = useCallback(
    (cellId: string, source: string) => {
      setNotebook((prev) => {
        const updated = {
          ...prev,
          cells: prev.cells.map((c) => (c.id === cellId ? { ...c, source } : c)),
        };
        pushChanges(updated);
        return updated;
      });
    },
    [pushChanges]
  );

  const handleRunCell = useCallback(
    (cellId: string) => {
      const cell = notebook.cells.find((c) => c.id === cellId);
      if (!cell || cell.cell_type !== 'code' || !cell.source.trim()) return;
      setRunningCellId(cellId);
      onRunCode(cell.source);
    },
    [notebook.cells, onRunCode]
  );

  const handleRunAll = useCallback(() => {
    const code = extractCodeCells(notebook);
    if (!code.trim()) return;
    setCellOutputs({});
    setRunningCellId('__all__');
    onRunCode(code);
  }, [notebook, onRunCode]);

  const handleDeleteCell = useCallback(
    (cellId: string) => {
      setNotebook((prev) => {
        if (prev.cells.length <= 1) return prev;
        const updated = { ...prev, cells: prev.cells.filter((c) => c.id !== cellId) };
        pushChanges(updated);
        return updated;
      });
      setCellOutputs((prev) => {
        const next = { ...prev };
        delete next[cellId];
        return next;
      });
    },
    [pushChanges]
  );

  const handleMoveCell = useCallback(
    (cellId: string, direction: 'up' | 'down') => {
      setNotebook((prev) => {
        const idx = prev.cells.findIndex((c) => c.id === cellId);
        if (idx < 0) return prev;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= prev.cells.length) return prev;
        const cells = [...prev.cells];
        [cells[idx], cells[targetIdx]] = [cells[targetIdx], cells[idx]];
        const updated = { ...prev, cells };
        pushChanges(updated);
        return updated;
      });
    },
    [pushChanges]
  );

  const handleChangeType = useCallback(
    (cellId: string, newType: 'code' | 'markdown') => {
      setNotebook((prev) => {
        const updated = {
          ...prev,
          cells: prev.cells.map((c) => {
            if (c.id !== cellId) return c;
            return {
              ...c,
              cell_type: newType,
              execution_count: newType === 'code' ? null : undefined,
              outputs: newType === 'code' ? [] : undefined,
            };
          }),
        };
        pushChanges(updated);
        return updated;
      });
    },
    [pushChanges]
  );

  const handleAddCell = useCallback(
    (afterCellId: string, type: 'code' | 'markdown') => {
      const newCell: NotebookCell = {
        id: generateCellId(),
        cell_type: type,
        source: '',
        metadata: {},
        execution_count: type === 'code' ? null : undefined,
        outputs: type === 'code' ? [] : undefined,
      };
      setNotebook((prev) => {
        const idx = prev.cells.findIndex((c) => c.id === afterCellId);
        const cells = [...prev.cells];
        cells.splice(idx + 1, 0, newCell);
        const updated = { ...prev, cells };
        pushChanges(updated);
        return updated;
      });
    },
    [pushChanges]
  );

  const addCellToEnd = useCallback(
    (type: 'code' | 'markdown') => {
      const newCell: NotebookCell = {
        id: generateCellId(),
        cell_type: type,
        source: '',
        metadata: {},
        execution_count: type === 'code' ? null : undefined,
        outputs: type === 'code' ? [] : undefined,
      };
      setNotebook((prev) => {
        const updated = { ...prev, cells: [...prev.cells, newCell] };
        pushChanges(updated);
        return updated;
      });
    },
    [pushChanges]
  );

  const handleClearOutputs = useCallback(() => {
    setCellOutputs({});
    setNotebook((prev) => {
      const updated = {
        ...prev,
        cells: prev.cells.map((c) =>
          c.cell_type === 'code' ? { ...c, execution_count: null, outputs: [] } : c
        ),
      };
      pushChanges(updated);
      return updated;
    });
    setExecutionCount(1);
  }, [pushChanges]);

  const handleDownload = useCallback(() => {
    const json = serializeNotebook(notebook);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'notebook.ipynb';
    a.click();
    URL.revokeObjectURL(url);
  }, [notebook, filename]);

  const displayName = filename
    ? filename.includes('/')
      ? filename.split('/').pop()
      : filename
    : 'Notebook';

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-slate-200 flex-shrink-0">
        <span className="text-xs font-semibold text-slate-600 mr-2">{displayName}</span>
        <div className="w-px h-4 bg-slate-200" />
        <button
          onClick={handleRunAll}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white text-xs font-medium rounded transition-colors"
        >
          <Play size={12} fill="currentColor" />
          Run All
        </button>
        <button
          onClick={() => addCellToEnd('code')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 text-xs font-medium rounded transition-colors"
        >
          <Plus size={13} />
          <Code2 size={12} />
        </button>
        <button
          onClick={() => addCellToEnd('markdown')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 text-xs font-medium rounded transition-colors"
        >
          <Plus size={13} />
          <Type size={12} />
        </button>
        <button
          onClick={handleClearOutputs}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 text-xs font-medium rounded transition-colors"
          title="Clear all outputs"
        >
          <RotateCcw size={12} />
          Clear
        </button>
        <div className="flex-1" />
        <span className="text-[10px] text-slate-400">
          {notebook.cells.length} cell{notebook.cells.length !== 1 ? 's' : ''}
        </span>
        {onSave && (
          <button
            onClick={onSave}
            disabled={saveStatus === 'saving'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${
              saveStatus === 'saved'
                ? 'text-emerald-600 hover:bg-slate-100'
                : saveStatus === 'unsaved'
                  ? 'text-amber-600 hover:bg-slate-100'
                  : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Save notebook to your account"
          >
            {saveStatus === 'saving' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : saveStatus === 'saved' ? (
              <Cloud size={13} />
            ) : saveStatus === 'unsaved' ? (
              <CloudOff size={13} />
            ) : (
              <Cloud size={13} />
            )}
            {saveStatus === 'saved' ? 'Saved' : saveStatus === 'unsaved' ? 'Save*' : 'Save'}
          </button>
        )}
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 text-xs font-medium rounded transition-colors"
        >
          <Download size={13} />
          .ipynb
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 sm:px-12 py-4">
        {notebook.cells.map((cell, index) => (
          <NotebookCellComponent
            key={cell.id}
            cell={cell}
            index={index}
            total={notebook.cells.length}
            isRunning={isRunning && runningCellId === cell.id}
            cellOutput={cellOutputs[cell.id] || null}
            onSourceChange={(s) => handleCellSourceChange(cell.id, s)}
            onRun={() => handleRunCell(cell.id)}
            onDelete={() => handleDeleteCell(cell.id)}
            onMoveUp={() => handleMoveCell(cell.id, 'up')}
            onMoveDown={() => handleMoveCell(cell.id, 'down')}
            onChangeType={(t) => handleChangeType(cell.id, t)}
            onAddBelow={(t) => handleAddCell(cell.id, t)}
          />
        ))}
      </div>
    </div>
  );
}
