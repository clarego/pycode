import type { PlacedWidget } from './types';

interface WidgetPreviewProps {
  widget: PlacedWidget;
}

export default function WidgetPreview({ widget }: WidgetPreviewProps) {
  const { type, props, width, height } = widget;
  const fontSize = (props.font_size as number) || 10;

  switch (type) {
    case 'Button':
      return (
        <div
          className="w-full h-full flex items-center justify-center rounded border select-none"
          style={{
            backgroundColor: (props.bg as string) || '#0ea5e9',
            color: (props.fg as string) || '#ffffff',
            fontSize,
            borderColor: 'rgba(0,0,0,0.2)',
          }}
        >
          {props.text as string}
        </div>
      );

    case 'Label':
      return (
        <div
          className="w-full h-full flex items-center select-none"
          style={{
            color: (props.fg as string) || '#000000',
            fontSize,
          }}
        >
          {props.text as string}
        </div>
      );

    case 'Entry':
      return (
        <div
          className="w-full h-full flex items-center bg-white border border-slate-300 rounded px-2"
          style={{ fontSize }}
        >
          <span className="text-slate-400 truncate">
            {(props.placeholder as string) || 'Text field...'}
          </span>
        </div>
      );

    case 'Text':
      return (
        <div
          className="w-full h-full bg-white border border-slate-300 rounded p-1.5 overflow-hidden"
          style={{ fontSize }}
        >
          <span className="text-slate-400">Text area...</span>
        </div>
      );

    case 'Checkbutton':
      return (
        <div className="w-full h-full flex items-center gap-1.5 select-none" style={{ fontSize }}>
          <div className="w-3.5 h-3.5 border border-slate-400 rounded bg-white flex-shrink-0" />
          <span>{props.text as string}</span>
        </div>
      );

    case 'Radiobutton':
      return (
        <div className="w-full h-full flex items-center gap-1.5 select-none" style={{ fontSize }}>
          <div className="w-3.5 h-3.5 border border-slate-400 rounded-full bg-white flex-shrink-0" />
          <span>{props.text as string}</span>
        </div>
      );

    case 'Listbox': {
      const items = ((props.items as string) || '').split(',').filter(Boolean);
      return (
        <div
          className="w-full h-full bg-white border border-slate-300 rounded overflow-hidden"
          style={{ fontSize }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className={`px-2 py-0.5 truncate ${i === 0 ? 'bg-sky-100 text-sky-800' : 'text-slate-700'}`}
            >
              {item.trim()}
            </div>
          ))}
        </div>
      );
    }

    case 'Scale':
      return (
        <div className="w-full h-full flex items-center px-1">
          <div className="w-full bg-slate-300 rounded-full h-1.5 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-sky-500 rounded-full border-2 border-white shadow" />
          </div>
        </div>
      );

    case 'Combobox': {
      const vals = ((props.values as string) || '').split(',');
      return (
        <div
          className="w-full h-full flex items-center bg-white border border-slate-300 rounded px-2 justify-between"
          style={{ fontSize }}
        >
          <span className="text-slate-600 truncate">{vals[0]?.trim() || 'Select...'}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" className="text-slate-400 flex-shrink-0 ml-1">
            <path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      );
    }

    case 'LabelFrame':
      return (
        <div className="w-full h-full relative">
          <fieldset
            className="w-full h-full border border-slate-400 rounded"
            style={{ fontSize }}
          >
            <legend className="ml-2 px-1 text-slate-600">{props.text as string}</legend>
          </fieldset>
        </div>
      );

    case 'Canvas':
      return (
        <div
          className="w-full h-full border border-slate-300"
          style={{ backgroundColor: (props.bg as string) || '#ffffff' }}
        >
          <svg width={width} height={height} className="opacity-20">
            <line x1="0" y1="0" x2={width} y2={height} stroke="#999" strokeWidth="0.5" />
            <line x1={width} y1="0" x2="0" y2={height} stroke="#999" strokeWidth="0.5" />
          </svg>
        </div>
      );

    case 'Progressbar': {
      const val = (props.value as number) || 0;
      const max = (props.maximum as number) || 100;
      const pct = Math.min(100, (val / max) * 100);
      return (
        <div className="w-full h-full flex items-center">
          <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
            <div
              className="h-full bg-sky-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-100 border border-dashed border-slate-300 text-[10px] text-slate-400">
          {type}
        </div>
      );
  }
}
