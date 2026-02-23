import { useState, useRef, useEffect } from 'react';
import type { TkWidgetNode } from '../../hooks/usePyodide';

interface TkinterMenuBarProps {
  node: TkWidgetNode;
  onEvent: (widgetId: string, eventType: string, eventData?: Record<string, unknown>) => void;
}

interface MenuItem {
  type: string;
  label?: string;
  callback_id?: string;
  items?: MenuItem[];
}

export default function TkinterMenuBar({ node, onEvent }: TkinterMenuBarProps) {
  const items = (node.menuItems || []) as unknown as MenuItem[];
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={menuRef} className="flex items-center h-6 bg-[#f0f0f0] border-b border-[#c0c0c0] px-1 select-none shrink-0">
      {items.map((item, i) => {
        if (item.type === 'cascade') {
          return (
            <div key={i} className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === i ? null : i)}
                className={`px-2 py-0.5 text-[11px] text-[#333] hover:bg-[#0060c0] hover:text-white rounded-sm transition-colors ${openMenu === i ? 'bg-[#0060c0] text-white' : ''}`}
              >
                {item.label}
              </button>
              {openMenu === i && item.items && (
                <div className="absolute top-full left-0 z-50 min-w-[160px] bg-[#f5f5f5] border border-[#b0b0b0] shadow-lg rounded-sm py-0.5">
                  {item.items.map((sub, j) => {
                    if (sub.type === 'separator') {
                      return <div key={j} className="border-t border-[#d0d0d0] my-0.5" />;
                    }
                    return (
                      <button
                        key={j}
                        onClick={() => {
                          if (sub.callback_id) {
                            onEvent(node.id, 'menu_command', { callback_id: sub.callback_id });
                          }
                          setOpenMenu(null);
                        }}
                        className="w-full text-left px-4 py-1 text-[11px] text-[#333] hover:bg-[#0060c0] hover:text-white transition-colors"
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }
        if (item.type === 'command') {
          return (
            <button
              key={i}
              onClick={() => {
                if (item.callback_id) {
                  onEvent(node.id, 'menu_command', { callback_id: item.callback_id });
                }
              }}
              className="px-2 py-0.5 text-[11px] text-[#333] hover:bg-[#0060c0] hover:text-white rounded-sm transition-colors"
            >
              {item.label}
            </button>
          );
        }
        return null;
      })}
    </div>
  );
}
