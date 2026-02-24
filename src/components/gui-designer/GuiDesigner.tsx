import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Code2, Play, RotateCcw, Eye, Code, Undo2, Redo2 } from 'lucide-react';
import type { PlacedWidget, FormState, WidgetDef } from './types';
import { generateWidgetId, resetIdCounter } from './types';
import WidgetToolbox from './WidgetToolbox';
import FormCanvas from './FormCanvas';
import PropertiesPanel from './PropertiesPanel';
import EventCodeDialog from './EventCodeDialog';
import CodeView from './CodeView';
import { generateTkinterCode } from './codeGenerator';

type ViewMode = 'design' | 'code';

interface GuiDesignerProps {
  form: FormState;
  onFormChange: (form: FormState) => void;
  onGenerateCode: (files: Record<string, string>) => void;
  onClose: () => void;
}

const MAX_HISTORY = 100;

export default function GuiDesigner({ form, onFormChange, onGenerateCode, onClose }: GuiDesignerProps) {
  const [history, setHistory] = useState<FormState[]>([form]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const suppressPush = useRef(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingWidget, setEditingWidget] = useState<PlacedWidget | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('design');
  const [editedCode, setEditedCode] = useState<string>('');

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const pushHistory = useCallback((newForm: FormState) => {
    if (suppressPush.current) return;
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      const next = [...sliced, newForm];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const setForm = useCallback((newForm: FormState) => {
    pushHistory(newForm);
    onFormChange(newForm);
  }, [pushHistory, onFormChange]);

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const newIndex = historyIndex - 1;
    suppressPush.current = true;
    setHistoryIndex(newIndex);
    onFormChange(history[newIndex]);
    suppressPush.current = false;
  }, [canUndo, historyIndex, history, onFormChange]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const newIndex = historyIndex + 1;
    suppressPush.current = true;
    setHistoryIndex(newIndex);
    onFormChange(history[newIndex]);
    suppressPush.current = false;
  }, [canRedo, historyIndex, history, onFormChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo, handleRedo]);

  const selectedWidget = form.widgets.find((w) => w.id === selectedId) || null;

  const generatedCode = useMemo(() => generateTkinterCode(form), [form]);

  const handleAddWidget = useCallback((widget: PlacedWidget) => {
    setForm({
      ...form,
      widgets: [...form.widgets, widget],
    });
  }, [form, setForm]);

  const handleUpdateWidget = useCallback((id: string, updates: Partial<PlacedWidget>) => {
    setForm({
      ...form,
      widgets: form.widgets.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    });
  }, [form, setForm]);

  const handleDeleteWidget = useCallback(
    (id: string) => {
      setForm({
        ...form,
        widgets: form.widgets.filter((w) => w.id !== id),
      });
      if (selectedId === id) setSelectedId(null);
    },
    [form, setForm, selectedId]
  );

  const handleUpdateForm = useCallback((updates: Partial<FormState>) => {
    setForm({ ...form, ...updates });
  }, [form, setForm]);

  const handleDoubleClick = useCallback(
    (id: string) => {
      const widget = form.widgets.find((w) => w.id === id);
      if (widget) setEditingWidget(widget);
    },
    [form.widgets]
  );

  const handleSaveEventCode = useCallback(
    (widgetId: string, eventCode: Record<string, string>) => {
      handleUpdateWidget(widgetId, { eventCode });
    },
    [handleUpdateWidget]
  );

  const handleDragStart = useCallback((_def: WidgetDef) => {}, []);

  const handleToolboxAdd = useCallback(
    (def: WidgetDef) => {
      const TITLE_BAR = 28;
      const PADDING = 20;
      const CASCADE_STEP = 24;

      const existing = form.widgets.length;
      const baseX = PADDING + (existing * CASCADE_STEP) % (form.width - def.defaultSize.width - PADDING * 2);
      const baseY = TITLE_BAR + PADDING + (existing * CASCADE_STEP) % (form.height - TITLE_BAR - def.defaultSize.height - PADDING * 2);

      const x = Math.round(Math.max(0, Math.min(baseX, form.width - def.defaultSize.width)) / 4) * 4;
      const y = Math.round(Math.max(0, Math.min(baseY, form.height - TITLE_BAR - def.defaultSize.height)) / 4) * 4;

      const newWidget: PlacedWidget = {
        id: generateWidgetId(def.type),
        type: def.type,
        x,
        y,
        width: def.defaultSize.width,
        height: def.defaultSize.height,
        props: { ...def.defaultProps },
        eventCode: {},
      };

      handleAddWidget(newWidget);
      setSelectedId(newWidget.id);
    },
    [form, handleAddWidget]
  );

  const handleGenerate = useCallback(() => {
    const code = editedCode || generateTkinterCode(form);
    onGenerateCode({ 'main.py': code });
  }, [form, onGenerateCode, editedCode]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    if (mode === 'code' && !editedCode) {
      setEditedCode(generatedCode);
    }
    setViewMode(mode);
  }, [generatedCode, editedCode]);

  const handleCodeChange = useCallback((code: string) => {
    setEditedCode(code);
  }, []);

  const handleReset = useCallback(() => {
    resetIdCounter();
    const blank: FormState = {
      title: 'My Application',
      width: 500,
      height: 400,
      bg: '#f0f0f0',
      backgroundImage: '',
      widgets: [],
    };
    setHistory([blank]);
    setHistoryIndex(0);
    onFormChange(blank);
    setSelectedId(null);
  }, [onFormChange]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-sky-400 to-teal-400 flex items-center justify-center">
            <Code2 size={12} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-white">GUI Designer</span>
          <span className="text-[10px] text-slate-400">
            {form.widgets.length} control{form.widgets.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="flex items-center gap-1 px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 size={13} />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="flex items-center gap-1 px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Redo2 size={13} />
          </button>
          <div className="w-px h-4 bg-slate-600" />
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors"
            title="Clear all"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition-colors"
          >
            <Play size={12} fill="currentColor" />
            Generate & Run
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors"
          >
            Back to Editor
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 border-b border-slate-600">
        <button
          onClick={() => handleViewModeChange('design')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            viewMode === 'design'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-600'
          }`}
        >
          <Eye size={13} />
          Design View
        </button>
        <button
          onClick={() => handleViewModeChange('code')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            viewMode === 'code'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-600'
          }`}
        >
          <Code size={13} />
          Code View
        </button>
        {viewMode === 'code' && editedCode && editedCode !== generatedCode && (
          <span className="ml-2 text-[10px] text-amber-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Modified
          </span>
        )}
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {viewMode === 'design' ? (
          <>
            <WidgetToolbox onDragStart={handleDragStart} onAdd={handleToolboxAdd} />

            <FormCanvas
              form={form}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onUpdateWidget={handleUpdateWidget}
              onAddWidget={handleAddWidget}
              onDeleteWidget={handleDeleteWidget}
              onDoubleClick={handleDoubleClick}
              onUpdateForm={handleUpdateForm}
            />

            <PropertiesPanel
              form={form}
              selectedWidget={selectedWidget}
              onUpdateWidget={handleUpdateWidget}
              onUpdateForm={handleUpdateForm}
              onDeleteWidget={handleDeleteWidget}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-hidden">
              <CodeView
                code={editedCode || generatedCode}
                onChange={handleCodeChange}
              />
            </div>
            <div className="px-4 py-2 bg-slate-800 border-t border-slate-700 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Edit the generated Python code directly. Changes will be used when you click "Generate & Run".</span>
                <button
                  onClick={() => setEditedCode(generatedCode)}
                  className="text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Reset to Design
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {editingWidget && (
        <EventCodeDialog
          widget={editingWidget}
          onSave={handleSaveEventCode}
          onClose={() => setEditingWidget(null)}
        />
      )}
    </div>
  );
}
