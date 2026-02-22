import { useState, createContext } from 'react';
import { Minus, Square, X } from 'lucide-react';
import type { TkWidgetNode } from '../../hooks/usePyodide';
import TkinterWidget from './TkinterWidget';
import TkinterMenuBar from './TkinterMenuBar';
import type { ThemeColors } from './themes';
import { getTheme } from './themes';

export const ThemeContext = createContext<ThemeColors>(getTheme('cosmo'));

interface TkinterWindowProps {
  tree: TkWidgetNode;
  onEvent: (widgetId: string, eventType: string, eventData?: Record<string, unknown>) => void;
}

function parseGeometry(geo: string): { width: number; height: number } {
  const match = geo.match(/(\d+)x(\d+)/);
  if (match) {
    return { width: parseInt(match[1]), height: parseInt(match[2]) };
  }
  return { width: 400, height: 300 };
}

export default function TkinterWindow({ tree, onEvent }: TkinterWindowProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  const title = (tree.config.title as string) || 'tk';
  const geometry = (tree.config.geometry as string) || '400x300';
  const { width, height } = parseGeometry(geometry);
  const menuBar = tree.menuBar as TkWidgetNode | undefined;

  // Extract theme name from config (set by ttkbootstrap Window)
  const themeName = (tree.config._themename as string) || 'cosmo';
  const theme = getTheme(themeName);

  return (
    <ThemeContext.Provider value={theme}>
      <div className="flex items-center justify-center p-4 h-full">
        <div
          className={`tk-window flex flex-col shadow-2xl rounded-lg overflow-hidden ${isMaximized ? 'w-full h-full' : ''}`}
          style={isMaximized ? undefined : { width: Math.min(width, 800), minHeight: Math.min(height, 600), maxHeight: '100%' }}
        >
          <div className="tk-titlebar flex items-center h-8 bg-gradient-to-b from-[#ececec] to-[#d6d6d6] border-b border-[#a0a0a0] select-none shrink-0">
            <div className="w-5 h-5 ml-2 flex items-center justify-center shrink-0">
              <div className="w-3.5 h-3.5 rounded-sm bg-gradient-to-br from-sky-400 to-sky-600" />
            </div>
            <div className="flex-1 text-[11px] text-[#333] font-normal ml-1.5 truncate">
              {title}
            </div>
            <div className="flex items-stretch h-full shrink-0">
              <button
                onClick={() => setIsMaximized(false)}
                className="flex items-center justify-center w-[34px] hover:bg-[#c8c8c8] transition-colors"
                title="Minimize"
              >
                <Minus size={13} className="text-[#333]" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="flex items-center justify-center w-[34px] hover:bg-[#c8c8c8] transition-colors"
                title={isMaximized ? 'Restore Down' : 'Maximize'}
              >
                {isMaximized ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" className="text-[#333]">
                    <rect x="2" y="0" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.2" rx="0.5" />
                    <rect x="0" y="2" width="8" height="8" fill="#d6d6d6" stroke="currentColor" strokeWidth="1.2" rx="0.5" />
                  </svg>
                ) : (
                  <Square size={10} className="text-[#333]" strokeWidth={1.5} />
                )}
              </button>
              <button
                className="flex items-center justify-center w-[34px] hover:bg-[#e81123] transition-colors group"
                title="Close"
              >
                <X size={14} className="text-[#333] group-hover:text-white" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {menuBar && (
            <TkinterMenuBar node={menuBar} onEvent={onEvent} />
          )}

          <div
            className="tk-content flex-1 overflow-auto"
            style={{ backgroundColor: tree.config.bg as string || theme.bg }}
          >
            <TkinterLayout node={tree} onEvent={onEvent} />
          </div>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

interface TkinterLayoutProps {
  node: TkWidgetNode;
  onEvent: (widgetId: string, eventType: string, eventData?: Record<string, unknown>) => void;
}

function TkinterLayout({ node, onEvent }: TkinterLayoutProps) {
  const children = node.children || [];

  if (children.length === 0) return null;

  const firstChild = children[0];
  const manager = firstChild?.layout?.manager as string || 'pack';

  if (manager === 'place') {
    return <PlaceLayout children={children} onEvent={onEvent} />;
  }

  if (manager === 'grid') {
    return <GridLayout children={children} onEvent={onEvent} />;
  }

  return <PackLayout children={children} onEvent={onEvent} />;
}

interface LayoutProps {
  children: TkWidgetNode[];
  onEvent: (widgetId: string, eventType: string, eventData?: Record<string, unknown>) => void;
}

function PlaceLayout({ children, onEvent }: LayoutProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {children.map(child => {
        const x = parseFloat(String(child.layout?.x ?? 0));
        const y = parseFloat(String(child.layout?.y ?? 0));
        const w = child.layout?.width != null ? parseFloat(String(child.layout.width)) : undefined;
        const h = child.layout?.height != null ? parseFloat(String(child.layout.height)) : undefined;

        const style: React.CSSProperties = {
          position: 'absolute',
          left: x,
          top: y,
        };
        if (w != null) style.width = w;
        if (h != null) style.height = h;

        return (
          <div key={child.id} style={style}>
            <TkinterWidget node={child} onEvent={onEvent} />
          </div>
        );
      })}
    </div>
  );
}

function PackLayout({ children, onEvent }: LayoutProps) {
  const topItems = children.filter(c => !c.layout?.side || c.layout.side === 'top');
  const bottomItems = children.filter(c => c.layout?.side === 'bottom');
  const leftItems = children.filter(c => c.layout?.side === 'left');
  const rightItems = children.filter(c => c.layout?.side === 'right');

  const hasVerticalOnly = leftItems.length === 0 && rightItems.length === 0;
  const hasHorizontalOnly = topItems.length === 0 && bottomItems.length === 0;

  if (hasVerticalOnly) {
    return (
      <div className="flex flex-col h-full">
        {topItems.map(child => (
          <PackItem key={child.id} node={child} onEvent={onEvent} />
        ))}
        <div className="flex-1" />
        {bottomItems.map(child => (
          <PackItem key={child.id} node={child} onEvent={onEvent} />
        ))}
      </div>
    );
  }

  if (hasHorizontalOnly) {
    return (
      <div className="flex h-full">
        {leftItems.map(child => (
          <PackItem key={child.id} node={child} onEvent={onEvent} />
        ))}
        <div className="flex-1" />
        {rightItems.map(child => (
          <PackItem key={child.id} node={child} onEvent={onEvent} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {children.map(child => {
        const side = child.layout?.side as string || 'top';
        if (side === 'left' || side === 'right') {
          return (
            <div key={child.id} className={`flex ${side === 'right' ? 'justify-end' : 'justify-start'}`}>
              <PackItem node={child} onEvent={onEvent} />
            </div>
          );
        }
        return <PackItem key={child.id} node={child} onEvent={onEvent} />;
      })}
    </div>
  );
}

function PackItem({ node, onEvent }: { node: TkWidgetNode; onEvent: LayoutProps['onEvent'] }) {
  const fill = node.layout?.fill as string;
  const expand = node.layout?.expand === 'True' || node.layout?.expand === '1' || node.layout?.expand === 'true';
  const padx = parseInt(node.layout?.padx as string || '0') || 0;
  const pady = parseInt(node.layout?.pady as string || '0') || 0;
  const ipadx = parseInt(node.layout?.ipadx as string || '0') || 0;
  const ipady = parseInt(node.layout?.ipady as string || '0') || 0;

  const style: React.CSSProperties = {
    padding: `${pady}px ${padx}px`,
  };

  if (fill === 'x' || fill === 'both') {
    style.width = '100%';
  }
  if (expand) {
    style.flex = '1';
  }
  if (fill === 'y' || fill === 'both') {
    if (expand) style.height = '100%';
  }

  return (
    <div style={style}>
      <div style={{ padding: `${ipady}px ${ipadx}px` }}>
        <TkinterWidget node={node} onEvent={onEvent} />
      </div>
    </div>
  );
}

function GridLayout({ children, onEvent }: LayoutProps) {
  let maxRow = 0;
  let maxCol = 0;
  for (const child of children) {
    const r = (child.layout?.row as number) || 0;
    const c = (child.layout?.column as number) || 0;
    const rs = (child.layout?.rowspan as number) || 1;
    const cs = (child.layout?.columnspan as number) || 1;
    maxRow = Math.max(maxRow, r + rs);
    maxCol = Math.max(maxCol, c + cs);
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateRows: `repeat(${maxRow}, auto)`,
    gridTemplateColumns: `repeat(${maxCol}, auto)`,
    gap: 0,
    width: '100%',
  };

  return (
    <div style={gridStyle}>
      {children.map(child => {
        const row = (child.layout?.row as number) || 0;
        const col = (child.layout?.column as number) || 0;
        const rowspan = (child.layout?.rowspan as number) || 1;
        const colspan = (child.layout?.columnspan as number) || 1;
        const sticky = (child.layout?.sticky as string) || '';
        const padx = parseInt(child.layout?.padx as string || '0') || 0;
        const pady = parseInt(child.layout?.pady as string || '0') || 0;

        const cellStyle: React.CSSProperties = {
          gridRow: `${row + 1} / span ${rowspan}`,
          gridColumn: `${col + 1} / span ${colspan}`,
          padding: `${pady}px ${padx}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        };

        if (sticky.includes('n') && sticky.includes('s')) {
          cellStyle.alignItems = 'stretch';
        } else if (sticky.includes('n')) {
          cellStyle.alignItems = 'flex-start';
        } else if (sticky.includes('s')) {
          cellStyle.alignItems = 'flex-end';
        }

        if (sticky.includes('w') && sticky.includes('e')) {
          cellStyle.justifyContent = 'stretch';
        } else if (sticky.includes('w')) {
          cellStyle.justifyContent = 'flex-start';
        } else if (sticky.includes('e')) {
          cellStyle.justifyContent = 'flex-end';
        }

        if (sticky.includes('e') && sticky.includes('w')) {
          cellStyle.width = '100%';
        }

        return (
          <div key={child.id} style={cellStyle}>
            <TkinterWidget node={child} onEvent={onEvent} />
          </div>
        );
      })}
    </div>
  );
}

export { TkinterLayout };
