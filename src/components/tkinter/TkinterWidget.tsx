import { useState, useContext } from 'react';
import type { TkWidgetNode } from '../../hooks/usePyodide';
import { TkinterLayout, ThemeContext } from './TkinterWindow';
import TkinterCanvas from './TkinterCanvas';

interface WidgetProps {
  node: TkWidgetNode;
  onEvent: (widgetId: string, eventType: string, eventData?: Record<string, unknown>) => void;
}

function getWidgetStyle(config: Record<string, unknown>): React.CSSProperties {
  const s: React.CSSProperties = {};
  if (config.bg) s.backgroundColor = config.bg as string;
  if (config.fg) s.color = config.fg as string;
  if (config.width && typeof config.width === 'number') s.width = config.width;
  if (config.height && typeof config.height === 'number') s.height = config.height;
  if (config.font) {
    const f = config.font;
    if (typeof f === 'string') {
      s.fontFamily = f;
    } else if (Array.isArray(f)) {
      if (f[0]) s.fontFamily = f[0] as string;
      if (f[1]) s.fontSize = `${f[1]}px`;
      if (f[2]) {
        const style = f[2] as string;
        if (style.includes('bold')) s.fontWeight = 'bold';
        if (style.includes('italic')) s.fontStyle = 'italic';
      }
    }
  }
  if (config.relief) {
    const relief = config.relief as string;
    switch (relief) {
      case 'raised': s.border = '2px outset #c0c0c0'; break;
      case 'sunken': s.border = '2px inset #c0c0c0'; break;
      case 'groove': s.border = '2px groove #c0c0c0'; break;
      case 'ridge': s.border = '2px ridge #c0c0c0'; break;
      case 'solid': s.border = '1px solid #333'; break;
      case 'flat': s.border = '1px solid transparent'; break;
    }
  }
  if (config.borderwidth || config.bd) {
    const bw = parseInt(String(config.borderwidth || config.bd)) || 0;
    if (bw > 0 && !config.relief) {
      s.border = `${bw}px solid #c0c0c0`;
    }
  }
  return s;
}

function getDisplayText(config: Record<string, unknown>): string {
  if (config.text !== undefined) {
    return String(config.text);
  }
  if (config._textvar_value !== undefined && config._textvar_value !== '') {
    return String(config._textvar_value);
  }
  if (config._var_value !== undefined) {
    return String(config._var_value);
  }
  return '';
}

export default function TkinterWidget({ node, onEvent }: WidgetProps) {
  const t = node.type;

  if (t === 'Frame' || t === 'ttk.Frame') return <TkFrame node={node} onEvent={onEvent} />;
  if (t === 'LabelFrame' || t === 'ttk.LabelFrame') return <TkLabelFrame node={node} onEvent={onEvent} />;
  if (t === 'Label' || t === 'ttk.Label') return <TkLabel node={node} onEvent={onEvent} />;
  if (t === 'Button' || t === 'ttk.Button') return <TkButton node={node} onEvent={onEvent} />;
  if (t === 'Entry' || t === 'ttk.Entry') return <TkEntry node={node} onEvent={onEvent} />;
  if (t === 'Text') return <TkText node={node} onEvent={onEvent} />;
  if (t === 'Canvas') return <TkinterCanvas node={node} />;
  if (t === 'Checkbutton' || t === 'ttk.Checkbutton') return <TkCheckbutton node={node} onEvent={onEvent} />;
  if (t === 'Radiobutton' || t === 'ttk.Radiobutton') return <TkRadiobutton node={node} onEvent={onEvent} />;
  if (t === 'Scale' || t === 'ttk.Scale') return <TkScale node={node} onEvent={onEvent} />;
  if (t === 'Listbox') return <TkListbox node={node} onEvent={onEvent} />;
  if (t === 'ttk.Combobox') return <TkCombobox node={node} onEvent={onEvent} />;
  if (t === 'OptionMenu') return <TkOptionMenu node={node} onEvent={onEvent} />;
  if (t === 'ttk.Progressbar') return <TkProgressbar node={node} />;
  if (t === 'ttk.Separator') return <TkSeparator node={node} />;
  if (t === 'ttk.Notebook') return <TkNotebook node={node} onEvent={onEvent} />;
  if (t === 'ttk.Treeview') return <TkTreeview node={node} />;
  if (t === 'Spinbox' || t === 'ttk.Spinbox') return <TkSpinbox node={node} onEvent={onEvent} />;
  if (t === 'Message') return <TkLabel node={node} onEvent={onEvent} />;
  if (t === 'PanedWindow') return <TkFrame node={node} onEvent={onEvent} />;
  if (t === 'Scrollbar' || t === 'ttk.Scrollbar') return null;
  if (t === 'ttk.Sizegrip') return null;
  if (t === 'Menu') return null;

  return <TkFrame node={node} onEvent={onEvent} />;
}

function TkFrame({ node, onEvent }: WidgetProps) {
  const style = getWidgetStyle(node.config);
  return (
    <div style={style}>
      <TkinterLayout node={node} onEvent={onEvent} />
    </div>
  );
}

function TkLabelFrame({ node, onEvent }: WidgetProps) {
  const style = getWidgetStyle(node.config);
  const text = getDisplayText(node.config);
  return (
    <fieldset style={{ ...style, border: '1px solid #999', borderRadius: 3, padding: '6px 8px' }}>
      {text && (
        <legend className="text-[11px] text-[#333] px-1">{text}</legend>
      )}
      <TkinterLayout node={node} onEvent={onEvent} />
    </fieldset>
  );
}

function TkLabel({ node }: WidgetProps) {
  const theme = useContext(ThemeContext);
  const style = getWidgetStyle(node.config);
  const text = getDisplayText(node.config);
  const anchor = node.config.anchor as string;
  const isTtk = node.type === 'ttk.Label';

  let textAlign: React.CSSProperties['textAlign'] = 'center';
  if (anchor === 'w' || anchor === 'nw' || anchor === 'sw') textAlign = 'left';
  if (anchor === 'e' || anchor === 'ne' || anchor === 'se') textAlign = 'right';

  return (
    <div
      className="tk-label"
      style={{
        padding: '2px 4px',
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        fontSize: '12px',
        color: style.color || (isTtk ? theme.fg : '#1a1a1a'),
        textAlign,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        ...style,
      }}
    >
      {text}
    </div>
  );
}

function TkButton({ node, onEvent }: WidgetProps) {
  const [pressed, setPressed] = useState(false);
  const [hover, setHover] = useState(false);
  const theme = useContext(ThemeContext);
  const style = getWidgetStyle(node.config);
  const text = getDisplayText(node.config);
  const disabled = node.config.state === 'disabled';
  const isTtk = node.type === 'ttk.Button';

  // Detect if theme is dark
  const isDarkTheme = theme.bg && parseInt(theme.bg.replace('#', ''), 16) < 0x808080;
  const hoverAdjust = isDarkTheme ? 0.12 : -0.08;
  const pressedAdjust = isDarkTheme ? 0.18 : -0.15;

  // For ttk buttons, use theme colors
  const getBgColor = () => {
    if (style.backgroundColor) return style.backgroundColor;
    if (!isTtk) return '#e1e1e1';
    if (pressed) return adjustBrightness(theme.primary, pressedAdjust);
    if (hover) return adjustBrightness(theme.primary, hoverAdjust);
    return theme.primary;
  };

  const getFgColor = () => {
    if (style.color) return style.color;
    if (!isTtk) return '#1a1a1a';
    return '#ffffff';
  };

  return (
    <button
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setPressed(false); setHover(false); }}
      onClick={() => {
        if (!disabled && node.hasCommand) {
          onEvent(node.id, 'command');
        }
      }}
      className={`tk-button transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        fontSize: '12px',
        color: getFgColor(),
        backgroundColor: getBgColor(),
        padding: isTtk ? '4px 16px' : '3px 12px',
        border: isTtk ? `1px solid ${theme.border}` : (pressed ? '2px inset #b0b0b0' : '2px outset #d8d8d8'),
        borderRadius: isTtk ? 4 : 3,
        outline: 'none',
        minWidth: 60,
        fontWeight: isTtk ? 500 : 400,
        ...style,
      }}
    >
      {text}
    </button>
  );
}

function adjustBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) * (1 + percent)));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) * (1 + percent)));
  const b = Math.max(0, Math.min(255, (num & 0xff) * (1 + percent)));
  return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
}

function TkEntry({ node, onEvent }: WidgetProps) {
  const theme = useContext(ThemeContext);
  const style = getWidgetStyle(node.config);
  const value = (node.config._textvar_value as string) ?? (node.config._entry_value as string) ?? '';
  const disabled = node.config.state === 'disabled' || node.config.state === 'readonly';
  const showText = node.config.show as string;
  const isTtk = node.type === 'ttk.Entry';

  return (
    <input
      type={showText === '*' ? 'password' : 'text'}
      value={String(value)}
      readOnly={disabled}
      onChange={(e) => {
        onEvent(node.id, 'entry_change', { value: e.target.value });
      }}
      className="tk-entry"
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        fontSize: '12px',
        color: style.color || (isTtk ? theme.inputfg : '#1a1a1a'),
        backgroundColor: style.backgroundColor || (isTtk ? theme.inputbg : '#fff'),
        padding: '3px 4px',
        border: isTtk ? `1px solid ${theme.border}` : '2px inset #c0c0c0',
        borderRadius: isTtk ? 4 : 1,
        outline: 'none',
        width: node.config.width ? `${(node.config.width as number) * 8}px` : '150px',
      }}
    />
  );
}

function TkSpinbox({ node, onEvent }: WidgetProps) {
  const theme = useContext(ThemeContext);
  const style = getWidgetStyle(node.config);
  const value = (node.config._textvar_value as string) ?? (node.config._entry_value as string) ?? '';
  const disabled = node.config.state === 'disabled' || node.config.state === 'readonly';
  const isTtk = node.type === 'ttk.Spinbox';

  const from = parseFloat(String(node.config.from_ ?? node.config.from ?? 0));
  const to = parseFloat(String(node.config.to ?? 100));
  const increment = parseFloat(String(node.config.increment ?? 1));

  const handleIncrement = () => {
    const currentVal = parseFloat(String(value)) || from;
    const newVal = Math.min(to, currentVal + increment);
    onEvent(node.id, 'entry_change', { value: String(newVal) });
  };

  const handleDecrement = () => {
    const currentVal = parseFloat(String(value)) || from;
    const newVal = Math.max(from, currentVal - increment);
    onEvent(node.id, 'entry_change', { value: String(newVal) });
  };

  return (
    <div className="flex items-stretch" style={{ width: node.config.width ? `${(node.config.width as number) * 8}px` : '150px' }}>
      <input
        type="text"
        value={String(value)}
        readOnly={disabled}
        onChange={(e) => {
          onEvent(node.id, 'entry_change', { value: e.target.value });
        }}
        className="tk-spinbox flex-1"
        style={{
          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          fontSize: '12px',
          color: style.color || (isTtk ? theme.inputfg : '#1a1a1a'),
          backgroundColor: style.backgroundColor || (isTtk ? theme.inputbg : '#fff'),
          padding: '3px 4px',
          border: isTtk ? `1px solid ${theme.border}` : '2px inset #c0c0c0',
          borderRight: 'none',
          borderRadius: isTtk ? '4px 0 0 4px' : '1px 0 0 1px',
          outline: 'none',
        }}
      />
      <div className="flex flex-col" style={{ width: '16px' }}>
        <button
          onClick={handleIncrement}
          disabled={disabled}
          className="flex items-center justify-center flex-1 hover:bg-[#e1e1e1] transition-colors"
          style={{
            border: isTtk ? `1px solid ${theme.border}` : '1px solid #c0c0c0',
            borderBottom: '0.5px solid #c0c0c0',
            borderRadius: isTtk ? '0 4px 0 0' : '0 1px 0 0',
            backgroundColor: '#f0f0f0',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <svg width="8" height="6" viewBox="0 0 8 6" fill="currentColor">
            <path d="M 4 0 L 8 6 L 0 6 Z" />
          </svg>
        </button>
        <button
          onClick={handleDecrement}
          disabled={disabled}
          className="flex items-center justify-center flex-1 hover:bg-[#e1e1e1] transition-colors"
          style={{
            border: isTtk ? `1px solid ${theme.border}` : '1px solid #c0c0c0',
            borderTop: '0.5px solid #c0c0c0',
            borderRadius: isTtk ? '0 0 4px 0' : '0 0 1px 0',
            backgroundColor: '#f0f0f0',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <svg width="8" height="6" viewBox="0 0 8 6" fill="currentColor">
            <path d="M 4 6 L 8 0 L 0 0 Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function TkText({ node, onEvent }: WidgetProps) {
  const style = getWidgetStyle(node.config);
  const value = typeof node.config._text_value === 'string' ? node.config._text_value : '';
  const w = (node.config.width as number) || 40;
  const h = (node.config.height as number) || 10;
  const isDisabled = node.config.state === 'disabled';
  const bgColor = style.backgroundColor || (node.config.bg as string) || '#fff';

  return (
    <textarea
      value={value}
      readOnly={isDisabled}
      onChange={isDisabled ? undefined : (e) => onEvent(node.id, 'text_change', { value: e.target.value })}
      className="tk-text"
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize: '12px',
        color: style.color || (node.config.fg as string) || '#1a1a1a',
        backgroundColor: bgColor,
        padding: '4px 6px',
        border: '2px inset #c0c0c0',
        borderRadius: 1,
        outline: 'none',
        width: `${w * 8}px`,
        height: `${h * 16}px`,
        resize: 'both',
        whiteSpace: 'pre',
        overflowY: 'auto',
        overflowX: 'auto',
        overflowWrap: 'normal',
        cursor: isDisabled ? 'default' : 'text',
      }}
    />
  );
}

function TkCheckbutton({ node, onEvent }: WidgetProps) {
  const theme = useContext(ThemeContext);
  const text = getDisplayText(node.config);
  const checked = node.config._check_selected as boolean ??
    (node.config._var_value !== undefined ? Boolean(node.config._var_value) : false);
  const isTtk = node.type === 'ttk.Checkbutton';

  return (
    <label className="flex items-center gap-1.5 cursor-pointer px-1 py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onEvent(node.id, 'check_toggle')}
        className="tk-checkbox"
        style={{
          width: 14,
          height: 14,
          accentColor: isTtk ? theme.primary : '#0060c0'
        }}
      />
      <span style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: '12px',
        color: isTtk ? theme.fg : '#1a1a1a'
      }}>
        {text}
      </span>
    </label>
  );
}

function TkRadiobutton({ node, onEvent }: WidgetProps) {
  const theme = useContext(ThemeContext);
  const text = getDisplayText(node.config);
  const value = node.config.value;
  const varValue = node.config._var_value;
  const checked = value !== undefined && varValue !== undefined && String(value) === String(varValue);
  const isTtk = node.type === 'ttk.Radiobutton';

  return (
    <label className="flex items-center gap-1.5 cursor-pointer px-1 py-0.5">
      <input
        type="radio"
        checked={checked}
        onChange={() => onEvent(node.id, 'radio_select')}
        className="tk-radio"
        style={{
          width: 14,
          height: 14,
          accentColor: isTtk ? theme.primary : '#0060c0'
        }}
      />
      <span style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: '12px',
        color: isTtk ? theme.fg : '#1a1a1a'
      }}>
        {text}
      </span>
    </label>
  );
}

function TkScale({ node, onEvent }: WidgetProps) {
  const theme = useContext(ThemeContext);
  const orient = (node.config.orient as string) || 'horizontal';
  const from = parseFloat(String(node.config.from_ ?? node.config.from ?? 0));
  const to = parseFloat(String(node.config.to ?? 100));
  const value = (node.config._scale_value as number) ?? from;
  const label = node.config.label as string;
  const isTtk = node.type === 'ttk.Scale';

  return (
    <div className={`flex ${orient === 'vertical' ? 'flex-col items-center' : 'items-center gap-2'} px-1 py-0.5`}>
      {label && (
        <span style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '11px', color: isTtk ? theme.fg : '#333' }}>{label}</span>
      )}
      <input
        type="range"
        min={from}
        max={to}
        value={value}
        onChange={(e) => onEvent(node.id, 'scale_change', { value: parseFloat(e.target.value) })}
        className="tk-scale"
        style={{
          width: orient === 'vertical' ? undefined : (node.config.length ? `${node.config.length}px` : '150px'),
          writingMode: orient === 'vertical' ? 'vertical-lr' : undefined,
          direction: orient === 'vertical' ? 'rtl' : undefined,
          accentColor: isTtk ? theme.primary : '#0060c0',
        } as React.CSSProperties}
      />
      <span style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '10px', color: isTtk ? theme.fg : '#666', minWidth: 30, textAlign: 'right' }}>
        {typeof value === 'number' ? value.toFixed(Number.isInteger(value) ? 0 : 1) : value}
      </span>
    </div>
  );
}

function TkListbox({ node, onEvent }: WidgetProps) {
  const items = (node.config._listbox_items as string[]) || [];
  const w = (node.config.width as number) || 20;
  const h = (node.config.height as number) || 10;
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  return (
    <div
      className="tk-listbox"
      style={{
        border: '2px inset #c0c0c0',
        backgroundColor: '#fff',
        width: `${w * 8}px`,
        height: `${h * 18}px`,
        overflow: 'auto',
        borderRadius: 1,
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          onClick={() => {
            setSelectedIdx(i);
            onEvent(node.id, 'listbox_select', { index: i });
          }}
          className="cursor-pointer transition-colors"
          style={{
            padding: '1px 4px',
            fontSize: '12px',
            fontFamily: "'Segoe UI', Arial, sans-serif",
            backgroundColor: selectedIdx === i ? '#0060c0' : 'transparent',
            color: selectedIdx === i ? '#fff' : '#1a1a1a',
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function TkCombobox({ node, onEvent }: WidgetProps) {
  const value = (node.config._textvar_value as string) ?? (node.config._entry_value as string) ?? '';
  const options = (node.config._options as string[]) || [];

  return (
    <select
      value={String(value)}
      onChange={(e) => onEvent(node.id, 'entry_change', { value: e.target.value })}
      className="tk-combobox"
      style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: '12px',
        padding: '3px 4px',
        border: '2px inset #c0c0c0',
        borderRadius: 1,
        backgroundColor: '#fff',
        outline: 'none',
        minWidth: 100,
      }}
    >
      {value && !options.includes(String(value)) && <option value={String(value)}>{String(value)}</option>}
      {options.map((opt, i) => (
        <option key={i} value={String(opt)}>{String(opt)}</option>
      ))}
    </select>
  );
}

function TkOptionMenu({ node, onEvent }: WidgetProps) {
  const options = (node.config._options as string[]) || [];
  const value = (node.config._textvar_value as string) ?? (node.config._var_value as string) ?? (options[0] || '');

  return (
    <select
      value={String(value)}
      onChange={(e) => onEvent(node.id, 'option_select', { value: e.target.value })}
      className="tk-optionmenu"
      style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: '12px',
        padding: '3px 8px',
        border: '2px outset #d8d8d8',
        borderRadius: 3,
        backgroundColor: '#e1e1e1',
        outline: 'none',
        cursor: 'pointer',
        minWidth: 80,
      }}
    >
      {options.map((opt, i) => (
        <option key={i} value={String(opt)}>{String(opt)}</option>
      ))}
    </select>
  );
}

function TkProgressbar({ node }: { node: TkWidgetNode }) {
  const theme = useContext(ThemeContext);
  const value = (node.config.value as number) || 0;
  const maximum = (node.config.maximum as number) || 100;
  const orient = (node.config.orient as string) || 'horizontal';
  const pct = Math.min(100, Math.max(0, (value / maximum) * 100));

  if (orient === 'vertical') {
    return (
      <div style={{ width: 20, height: node.config.length ? `${node.config.length}px` : '100px', backgroundColor: theme.light, border: `1px solid ${theme.border}`, borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${pct}%`, backgroundColor: theme.primary, transition: 'height 0.2s' }} />
      </div>
    );
  }

  return (
    <div style={{ width: node.config.length ? `${node.config.length}px` : '150px', height: 20, backgroundColor: theme.light, border: `1px solid ${theme.border}`, borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: theme.primary, transition: 'width 0.2s' }} />
    </div>
  );
}

function TkSeparator({ node }: { node: TkWidgetNode }) {
  const orient = (node.config.orient as string) || 'horizontal';
  if (orient === 'vertical') {
    return <div style={{ width: 2, backgroundColor: '#c0c0c0', alignSelf: 'stretch', margin: '2px 4px' }} />;
  }
  return <div style={{ height: 2, backgroundColor: '#c0c0c0', width: '100%', margin: '4px 0' }} />;
}

function TkNotebook({ node, onEvent }: WidgetProps) {
  const theme = useContext(ThemeContext);
  const rawTabs = node.config._tabs;
  const tabs = Array.isArray(rawTabs) ? rawTabs as Array<{ widget_id: string; text: string }> : [];
  const [activeTab, setActiveTab] = useState(0);
  const children = node.children || [];

  return (
    <div className="tk-notebook">
      <div className="flex border-b" style={{ borderColor: theme.border, backgroundColor: theme.light }}>
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className="transition-colors"
            style={{
              padding: '4px 12px',
              fontSize: '11px',
              fontFamily: "'Segoe UI', Arial, sans-serif",
              backgroundColor: activeTab === i ? theme.bg : 'transparent',
              color: activeTab === i ? theme.primary : theme.secondary,
              fontWeight: activeTab === i ? 600 : 400,
              cursor: 'pointer',
              borderTop: `1px solid ${activeTab === i ? theme.border : 'transparent'}`,
              borderLeft: `1px solid ${activeTab === i ? theme.border : 'transparent'}`,
              borderRight: `1px solid ${activeTab === i ? theme.border : 'transparent'}`,
              borderBottom: `1px solid ${activeTab === i ? theme.bg : theme.border}`,
              borderRadius: '3px 3px 0 0',
              marginBottom: -1,
            }}
          >
            {tab.text}
          </button>
        ))}
      </div>
      <div style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderTop: 0, padding: '8px' }}>
        {children[activeTab] && (
          <TkinterWidget node={children[activeTab]} onEvent={onEvent} />
        )}
      </div>
    </div>
  );
}

function TkTreeview({ node }: { node: TkWidgetNode }) {
  const columns = (node.config.columns as string[]) || [];
  const headings = (node.config._headings as Record<string, { text?: string }>) || {};
  const treeData = (node.config._tree_data as Record<string, { parent: string; text: string; values: string[] }>) || {};

  const rootItems = Object.entries(treeData).filter(([, v]) => !v.parent || v.parent === '');

  return (
    <div className="tk-treeview" style={{ border: '1px solid #b0b0b0', borderRadius: 1, overflow: 'hidden', minWidth: 200 }}>
      <div className="flex bg-[#e8e8e8] border-b border-[#b0b0b0]">
        <div className="px-3 py-1 text-[11px] font-medium text-[#333] border-r border-[#c0c0c0]" style={{ minWidth: 100 }}>
          {headings['#0']?.text || ''}
        </div>
        {columns.map((col, i) => (
          <div key={i} className="px-3 py-1 text-[11px] font-medium text-[#333] border-r border-[#c0c0c0]" style={{ minWidth: 80 }}>
            {headings[col]?.text || col}
          </div>
        ))}
      </div>
      <div className="bg-white">
        {rootItems.map(([id, item], i) => (
          <div
            key={id}
            className={`flex ${i % 2 === 0 ? 'bg-white' : 'bg-[#f8f8f8]'}`}
          >
            <div className="px-3 py-0.5 text-[11px] text-[#333] border-r border-[#e0e0e0]" style={{ minWidth: 100 }}>
              {item.text}
            </div>
            {(item.values || []).map((val: string, j: number) => (
              <div key={j} className="px-3 py-0.5 text-[11px] text-[#333] border-r border-[#e0e0e0]" style={{ minWidth: 80 }}>
                {String(val)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
