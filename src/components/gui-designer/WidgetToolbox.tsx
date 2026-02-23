import { WIDGET_CATALOG, type WidgetDef } from './types';
import {
  RectangleHorizontal,
  Type,
  TextCursorInput,
  AlignLeft,
  CheckSquare,
  Circle,
  List,
  SlidersHorizontal,
  ChevronDown,
  Square,
  Paintbrush,
  Loader,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  'rect-btn': <RectangleHorizontal size={16} />,
  'text': <Type size={16} />,
  'input': <TextCursorInput size={16} />,
  'textarea': <AlignLeft size={16} />,
  'check': <CheckSquare size={16} />,
  'radio': <Circle size={16} />,
  'list': <List size={16} />,
  'slider': <SlidersHorizontal size={16} />,
  'dropdown': <ChevronDown size={16} />,
  'frame': <Square size={16} />,
  'canvas': <Paintbrush size={16} />,
  'progress': <Loader size={16} />,
};

const CATEGORIES = [
  { key: 'common' as const, label: 'Common' },
  { key: 'input' as const, label: 'Input' },
  { key: 'display' as const, label: 'Display' },
  { key: 'container' as const, label: 'Containers' },
];

interface WidgetToolboxProps {
  onDragStart: (def: WidgetDef) => void;
  onAdd: (def: WidgetDef) => void;
}

export default function WidgetToolbox({ onDragStart, onAdd }: WidgetToolboxProps) {
  return (
    <div className="w-48 flex-shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto">
      <div className="px-3 py-2 border-b border-slate-200 bg-white">
        <h3 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Toolbox</h3>
      </div>
      {CATEGORIES.map((cat) => {
        const widgets = WIDGET_CATALOG.filter((w) => w.category === cat.key);
        if (widgets.length === 0) return null;
        return (
          <div key={cat.key}>
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-100/50">
              {cat.label}
            </div>
            <div className="p-1">
              {widgets.map((w) => (
                <button
                  key={w.type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('widget-type', w.type);
                    onDragStart(w);
                  }}
                  onDoubleClick={() => onAdd(w)}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-slate-600 hover:bg-sky-50 hover:text-sky-700 rounded cursor-grab active:cursor-grabbing transition-colors"
                >
                  <span className="text-slate-400">{ICON_MAP[w.icon]}</span>
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
