import { useState, useRef, useEffect } from 'react';
import { X, Zap, Code2 } from 'lucide-react';
import type { PlacedWidget } from './types';
import { WIDGET_CATALOG } from './types';

interface EventCodeDialogProps {
  widget: PlacedWidget;
  onSave: (widgetId: string, eventCode: Record<string, string>) => void;
  onClose: () => void;
}

export default function EventCodeDialog({ widget, onSave, onClose }: EventCodeDialogProps) {
  const def = WIDGET_CATALOG.find((w) => w.type === widget.type);
  const events = def?.events || [];
  const [activeEvent, setActiveEvent] = useState(events[0] || '');
  const [codeMap, setCodeMap] = useState<Record<string, string>>({ ...widget.eventCode });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [activeEvent]);

  const fnName = `${widget.id}_${activeEvent}`;
  const paramStr = getEventParamHint(widget.type, activeEvent);
  const contextHint = getContextHint(widget);

  const handleSave = () => {
    onSave(widget.id, codeMap);
    onClose();
  };

  if (events.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div
          className="bg-white rounded-xl shadow-2xl w-[500px] p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">
              {widget.type} - {widget.id}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-500">This control has no configurable events.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-700">
              {widget.type} Event Code
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {widget.id}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        {events.length > 1 && (
          <div className="flex border-b border-slate-200 px-4">
            {events.map((evt) => (
              <button
                key={evt}
                onClick={() => setActiveEvent(evt)}
                className={`px-3 py-2 text-xs font-medium transition-colors relative ${
                  activeEvent === evt
                    ? 'text-sky-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {evt}
                {activeEvent === evt && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
                )}
                {codeMap[evt]?.trim() && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 space-y-3">
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50">
              <Code2 size={12} className="text-sky-400" />
              <span className="text-[11px] font-mono text-slate-400">
                def {fnName}({paramStr}):
              </span>
            </div>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-slate-900/30 flex flex-col items-end pr-1 pt-1.5">
                {(codeMap[activeEvent] || '').split('\n').map((_, i) => (
                  <span key={i} className="text-[10px] text-slate-600 leading-5 font-mono">
                    {i + 1}
                  </span>
                ))}
                {!(codeMap[activeEvent] || '').length && (
                  <span className="text-[10px] text-slate-600 leading-5 font-mono">1</span>
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={codeMap[activeEvent] || ''}
                onChange={(e) => {
                  setCodeMap((prev) => ({ ...prev, [activeEvent]: e.target.value }));
                }}
                placeholder="# Write your event handler code here..."
                spellCheck={false}
                className="w-full bg-transparent text-slate-200 text-xs font-mono p-2 pl-10 min-h-[120px] resize-y outline-none placeholder-slate-600"
                style={{ lineHeight: '20px', tabSize: 4 }}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = e.currentTarget.selectionStart;
                    const end = e.currentTarget.selectionEnd;
                    const val = e.currentTarget.value;
                    const newVal = val.substring(0, start) + '    ' + val.substring(end);
                    setCodeMap((prev) => ({ ...prev, [activeEvent]: newVal }));
                    requestAnimationFrame(() => {
                      if (textareaRef.current) {
                        textareaRef.current.selectionStart = start + 4;
                        textareaRef.current.selectionEnd = start + 4;
                      }
                    });
                  }
                }}
              />
            </div>
          </div>

          {contextHint && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <div className="text-[10px] font-semibold text-amber-700 mb-1">Available context:</div>
              <pre className="text-[10px] text-amber-800 font-mono whitespace-pre-wrap">{contextHint}</pre>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Save Event Code
          </button>
        </div>
      </div>
    </div>
  );
}

function getEventParamHint(widgetType: string, event: string): string {
  if (event === 'on_select' || event === 'on_click' || event === 'on_change') return 'event';
  if (event === 'command' && widgetType === 'Scale') return 'value';
  return '';
}

function getContextHint(widget: PlacedWidget): string {
  switch (widget.type) {
    case 'Button':
      return `# This function runs when the button is clicked.\n# Example:\n#   print("${widget.props.text} was clicked!")`;
    case 'Entry':
      return `# Access the text field value:\n#   text = ${widget.id}_var.get()\n#   print(f"Value: {text}")`;
    case 'Checkbutton': {
      const varName = (widget.props.variable as string) || `${widget.id}_var`;
      return `# Access checkbox state:\n#   checked = ${varName}.get()\n#   print(f"Checked: {checked}")`;
    }
    case 'Radiobutton': {
      const varName = (widget.props.variable as string) || `${widget.id}_var`;
      return `# Access selected radio value:\n#   selected = ${varName}.get()\n#   print(f"Selected: {selected}")`;
    }
    case 'Listbox':
      return `# Access selected item:\n#   selection = ${widget.id}.curselection()\n#   if selection:\n#       item = ${widget.id}.get(selection[0])`;
    case 'Scale':
      return `# 'value' parameter contains the current slider value.\n# Example:\n#   print(f"Slider value: {value}")`;
    case 'Combobox':
      return `# Access selected value:\n#   selected = ${widget.id}.get()\n#   print(f"Selected: {selected}")`;
    case 'Canvas':
      return `# 'event' contains click coordinates:\n#   x, y = event.x, event.y\n#   ${widget.id}.create_oval(x-5, y-5, x+5, y+5, fill="red")`;
    default:
      return '';
  }
}
