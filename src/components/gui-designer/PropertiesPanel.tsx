import { useRef } from 'react';
import { WIDGET_CATALOG } from './types';
import type { PlacedWidget, FormState } from './types';
import { Settings, Move, Maximize2, Trash2, Image } from 'lucide-react';

interface PropertiesPanelProps {
  form: FormState;
  selectedWidget: PlacedWidget | null;
  onUpdateWidget: (id: string, updates: Partial<PlacedWidget>) => void;
  onUpdateForm: (updates: Partial<FormState>) => void;
  onDeleteWidget: (id: string) => void;
}

export default function PropertiesPanel({
  form,
  selectedWidget,
  onUpdateWidget,
  onUpdateForm,
  onDeleteWidget,
}: PropertiesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      onUpdateForm({ backgroundImage: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  if (!selectedWidget) {
    return (
      <div className="w-56 flex-shrink-0 bg-slate-50 border-l border-slate-200 overflow-y-auto">
        <div className="px-3 py-2 border-b border-slate-200 bg-white">
          <h3 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Settings size={12} /> Properties
          </h3>
        </div>
        <div className="p-3 space-y-3">
          <div className="text-[10px] font-semibold text-slate-400 uppercase">Form</div>
          <PropRow label="Title">
            <input
              type="text"
              value={form.title}
              onChange={(e) => onUpdateForm({ title: e.target.value })}
              className="prop-input"
            />
          </PropRow>
          <PropRow label="Width">
            <input
              type="number"
              value={form.width}
              onChange={(e) => onUpdateForm({ width: Math.max(0, parseInt(e.target.value) || 0) })}
              className="prop-input"
            />
          </PropRow>
          <PropRow label="Height">
            <input
              type="number"
              value={form.height}
              onChange={(e) => onUpdateForm({ height: Math.max(0, parseInt(e.target.value) || 0) })}
              className="prop-input"
            />
          </PropRow>

          <div className="text-[10px] font-semibold text-slate-400 uppercase flex items-center gap-1 pt-1">
            <Image size={10} /> Background
          </div>

          <PropRow label="BG Color">
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={form.bg || '#f0f0f0'}
                onChange={(e) => onUpdateForm({ bg: e.target.value })}
                className="w-6 h-6 rounded border border-slate-300 cursor-pointer flex-shrink-0"
              />
              <input
                type="text"
                value={form.bg || '#f0f0f0'}
                onChange={(e) => onUpdateForm({ bg: e.target.value })}
                className="prop-input flex-1"
              />
            </div>
          </PropRow>

          <PropRow label="Image URL">
            <input
              type="text"
              value={form.backgroundImage || ''}
              onChange={(e) => onUpdateForm({ backgroundImage: e.target.value })}
              placeholder="https://..."
              className="prop-input"
            />
          </PropRow>

          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">Upload Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-slate-600 hover:bg-slate-200 border border-slate-300 rounded w-full transition-colors"
            >
              <Image size={10} /> Choose file...
            </button>
          </div>

          {form.backgroundImage && (
            <div className="space-y-1">
              <div className="w-full h-16 rounded border border-slate-200 overflow-hidden bg-white">
                <img
                  src={form.backgroundImage}
                  alt="bg preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => onUpdateForm({ backgroundImage: '' })}
                className="text-[10px] text-red-500 hover:text-red-700 transition-colors"
              >
                Remove image
              </button>
            </div>
          )}

          <div className="text-[10px] text-slate-400 mt-2">
            Select a control to edit its properties
          </div>
        </div>
      </div>
    );
  }

  const def = WIDGET_CATALOG.find((w) => w.type === selectedWidget.type);

  const handlePropChange = (key: string, value: string | number | boolean) => {
    onUpdateWidget(selectedWidget.id, {
      props: { ...selectedWidget.props, [key]: value },
    });
  };

  return (
    <div className="w-56 flex-shrink-0 bg-slate-50 border-l border-slate-200 overflow-y-auto">
      <div className="px-3 py-2 border-b border-slate-200 bg-white">
        <h3 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Settings size={12} /> {selectedWidget.type}
        </h3>
        <div className="text-[10px] text-slate-400 font-mono">{selectedWidget.id}</div>
      </div>

      <div className="p-3 space-y-3">
        <div className="text-[10px] font-semibold text-slate-400 uppercase flex items-center gap-1">
          <Move size={10} /> Position
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PropRow label="X">
            <input
              type="number"
              value={selectedWidget.x}
              onChange={(e) => onUpdateWidget(selectedWidget.id, { x: parseInt(e.target.value) || 0 })}
              className="prop-input"
            />
          </PropRow>
          <PropRow label="Y">
            <input
              type="number"
              value={selectedWidget.y}
              onChange={(e) => onUpdateWidget(selectedWidget.id, { y: parseInt(e.target.value) || 0 })}
              className="prop-input"
            />
          </PropRow>
        </div>

        <div className="text-[10px] font-semibold text-slate-400 uppercase flex items-center gap-1">
          <Maximize2 size={10} /> Size
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PropRow label="W">
            <input
              type="number"
              value={selectedWidget.width}
              onChange={(e) =>
                onUpdateWidget(selectedWidget.id, {
                  width: Math.max(20, parseInt(e.target.value) || 40),
                })
              }
              className="prop-input"
            />
          </PropRow>
          <PropRow label="H">
            <input
              type="number"
              value={selectedWidget.height}
              onChange={(e) =>
                onUpdateWidget(selectedWidget.id, {
                  height: Math.max(10, parseInt(e.target.value) || 20),
                })
              }
              className="prop-input"
            />
          </PropRow>
        </div>

        {def && (
          <>
            <div className="text-[10px] font-semibold text-slate-400 uppercase mt-2">Properties</div>
            {Object.entries(def.defaultProps).map(([key, defaultVal]) => {
              const val = selectedWidget.props[key] ?? defaultVal;
              const isColor = key === 'bg' || key === 'fg';
              const isNumber = typeof defaultVal === 'number';

              return (
                <PropRow key={key} label={key.replace(/_/g, ' ')}>
                  {isColor ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={val as string}
                        onChange={(e) => handlePropChange(key, e.target.value)}
                        className="w-6 h-6 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={val as string}
                        onChange={(e) => handlePropChange(key, e.target.value)}
                        className="prop-input flex-1"
                      />
                    </div>
                  ) : isNumber ? (
                    <input
                      type="number"
                      value={val as number}
                      onChange={(e) => handlePropChange(key, parseFloat(e.target.value) || 0)}
                      className="prop-input"
                    />
                  ) : (
                    <input
                      type="text"
                      value={val as string}
                      onChange={(e) => handlePropChange(key, e.target.value)}
                      className="prop-input"
                    />
                  )}
                </PropRow>
              );
            })}
          </>
        )}

        {def && def.events.length > 0 && (
          <>
            <div className="text-[10px] font-semibold text-slate-400 uppercase mt-2">Events</div>
            {def.events.map((evt) => (
              <div key={evt} className="text-[10px] text-slate-500 flex items-center gap-1">
                <span className="text-amber-500">fn</span>
                <span className="font-mono">{selectedWidget.id}_{evt}</span>
              </div>
            ))}
            <div className="text-[9px] text-slate-400">Double-click control to edit event code</div>
          </>
        )}

        <div className="pt-3 border-t border-slate-200">
          <button
            onClick={() => onDeleteWidget(selectedWidget.id)}
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded w-full transition-colors"
          >
            <Trash2 size={12} /> Delete Control
          </button>
        </div>
      </div>
    </div>
  );
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-slate-500 capitalize block mb-0.5">{label}</label>
      {children}
    </div>
  );
}
