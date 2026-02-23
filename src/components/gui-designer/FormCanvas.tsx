import { useRef, useState, useCallback } from 'react';
import { Minus, Square, X } from 'lucide-react';
import type { PlacedWidget, FormState, WidgetDef } from './types';
import { WIDGET_CATALOG, generateWidgetId } from './types';
import WidgetPreview from './WidgetPreview';

const SNAP_THRESHOLD = 6;

interface GuideLines {
  x: number[];
  y: number[];
}

interface FormCanvasProps {
  form: FormState;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateWidget: (id: string, updates: Partial<PlacedWidget>) => void;
  onAddWidget: (widget: PlacedWidget) => void;
  onDeleteWidget: (id: string) => void;
  onDoubleClick: (id: string) => void;
}

function computeAlignmentSnap(
  draggedId: string,
  rawX: number,
  rawY: number,
  draggedW: number,
  draggedH: number,
  widgets: PlacedWidget[]
): { snappedX: number; snappedY: number; guides: GuideLines } {
  const others = widgets.filter((w) => w.id !== draggedId);

  const guideX: number[] = [];
  const guideY: number[] = [];

  let snappedX = rawX;
  let snappedY = rawY;

  let bestDX = SNAP_THRESHOLD + 1;
  let bestDY = SNAP_THRESHOLD + 1;

  const dragEdges = {
    left: rawX,
    right: rawX + draggedW,
    centerX: rawX + draggedW / 2,
    top: rawY,
    bottom: rawY + draggedH,
    centerY: rawY + draggedH / 2,
  };

  for (const other of others) {
    const otherEdges = {
      left: other.x,
      right: other.x + other.width,
      centerX: other.x + other.width / 2,
      top: other.y,
      bottom: other.y + other.height,
      centerY: other.y + other.height / 2,
    };

    const xCandidates: { drag: number; target: number; snapTo: number }[] = [
      { drag: dragEdges.left, target: otherEdges.left, snapTo: otherEdges.left },
      { drag: dragEdges.right, target: otherEdges.right, snapTo: otherEdges.right - draggedW },
      { drag: dragEdges.centerX, target: otherEdges.centerX, snapTo: otherEdges.centerX - draggedW / 2 },
      { drag: dragEdges.left, target: otherEdges.right, snapTo: otherEdges.right },
      { drag: dragEdges.right, target: otherEdges.left, snapTo: otherEdges.left - draggedW },
    ];

    const yCandidates: { drag: number; target: number; snapTo: number }[] = [
      { drag: dragEdges.top, target: otherEdges.top, snapTo: otherEdges.top },
      { drag: dragEdges.bottom, target: otherEdges.bottom, snapTo: otherEdges.bottom - draggedH },
      { drag: dragEdges.centerY, target: otherEdges.centerY, snapTo: otherEdges.centerY - draggedH / 2 },
      { drag: dragEdges.top, target: otherEdges.bottom, snapTo: otherEdges.bottom },
      { drag: dragEdges.bottom, target: otherEdges.top, snapTo: otherEdges.top - draggedH },
    ];

    for (const c of xCandidates) {
      const d = Math.abs(c.drag - c.target);
      if (d < SNAP_THRESHOLD && d < bestDX) {
        bestDX = d;
        snappedX = c.snapTo;
      }
    }

    for (const c of yCandidates) {
      const d = Math.abs(c.drag - c.target);
      if (d < SNAP_THRESHOLD && d < bestDY) {
        bestDY = d;
        snappedY = c.snapTo;
      }
    }
  }

  const finalLeft = snappedX;
  const finalRight = snappedX + draggedW;
  const finalCX = snappedX + draggedW / 2;
  const finalTop = snappedY;
  const finalBottom = snappedY + draggedH;
  const finalCY = snappedY + draggedH / 2;

  for (const other of others) {
    const otherEdges = {
      left: other.x,
      right: other.x + other.width,
      centerX: other.x + other.width / 2,
      top: other.y,
      bottom: other.y + other.height,
      centerY: other.y + other.height / 2,
    };

    if (
      Math.abs(finalLeft - otherEdges.left) < 1 ||
      Math.abs(finalRight - otherEdges.right) < 1 ||
      Math.abs(finalCX - otherEdges.centerX) < 1 ||
      Math.abs(finalLeft - otherEdges.right) < 1 ||
      Math.abs(finalRight - otherEdges.left) < 1
    ) {
      if (Math.abs(finalLeft - otherEdges.left) < 1) guideX.push(otherEdges.left);
      if (Math.abs(finalRight - otherEdges.right) < 1) guideX.push(otherEdges.right);
      if (Math.abs(finalCX - otherEdges.centerX) < 1) guideX.push(otherEdges.centerX);
      if (Math.abs(finalLeft - otherEdges.right) < 1) guideX.push(otherEdges.right);
      if (Math.abs(finalRight - otherEdges.left) < 1) guideX.push(otherEdges.left);
    }

    if (
      Math.abs(finalTop - otherEdges.top) < 1 ||
      Math.abs(finalBottom - otherEdges.bottom) < 1 ||
      Math.abs(finalCY - otherEdges.centerY) < 1 ||
      Math.abs(finalTop - otherEdges.bottom) < 1 ||
      Math.abs(finalBottom - otherEdges.top) < 1
    ) {
      if (Math.abs(finalTop - otherEdges.top) < 1) guideY.push(otherEdges.top);
      if (Math.abs(finalBottom - otherEdges.bottom) < 1) guideY.push(otherEdges.bottom);
      if (Math.abs(finalCY - otherEdges.centerY) < 1) guideY.push(otherEdges.centerY);
      if (Math.abs(finalTop - otherEdges.bottom) < 1) guideY.push(otherEdges.bottom);
      if (Math.abs(finalBottom - otherEdges.top) < 1) guideY.push(otherEdges.top);
    }
  }

  return {
    snappedX: Math.round(snappedX / 4) * 4,
    snappedY: Math.round(snappedY / 4) * 4,
    guides: { x: [...new Set(guideX)], y: [...new Set(guideY)] },
  };
}

export default function FormCanvas({
  form,
  selectedId,
  onSelect,
  onUpdateWidget,
  onAddWidget,
  onDeleteWidget,
  onDoubleClick,
}: FormCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    widgetId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [resizeState, setResizeState] = useState<{
    widgetId: string;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);
  const [guides, setGuides] = useState<GuideLines>({ x: [], y: [] });

  const getCanvasPos = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: Math.round(clientX - rect.left),
      y: Math.round(clientY - rect.top),
    };
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const typeName = e.dataTransfer.getData('widget-type');
      if (!typeName) return;

      const def = WIDGET_CATALOG.find((w) => w.type === typeName) as WidgetDef;
      if (!def) return;

      const pos = getCanvasPos(e.clientX, e.clientY);
      const x = Math.max(0, Math.min(pos.x - def.defaultSize.width / 2, form.width - def.defaultSize.width));
      const y = Math.max(0, Math.min(pos.y - def.defaultSize.height / 2, form.height - def.defaultSize.height));

      const newWidget: PlacedWidget = {
        id: generateWidgetId(def.type),
        type: def.type,
        x: Math.round(x / 4) * 4,
        y: Math.round(y / 4) * 4,
        width: def.defaultSize.width,
        height: def.defaultSize.height,
        props: { ...def.defaultProps },
        eventCode: {},
      };

      onAddWidget(newWidget);
      onSelect(newWidget.id);
    },
    [form.width, form.height, getCanvasPos, onAddWidget, onSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        onSelect(null);
      }
    },
    [onSelect]
  );

  const handleWidgetMouseDown = useCallback(
    (e: React.MouseEvent, widgetId: string) => {
      e.stopPropagation();
      onSelect(widgetId);
      const widget = form.widgets.find((w) => w.id === widgetId);
      if (!widget) return;
      const pos = getCanvasPos(e.clientX, e.clientY);
      setDragState({
        widgetId,
        offsetX: pos.x - widget.x,
        offsetY: pos.y - widget.y,
      });
    },
    [form.widgets, getCanvasPos, onSelect]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, widgetId: string) => {
      e.stopPropagation();
      e.preventDefault();
      const widget = form.widgets.find((w) => w.id === widgetId);
      if (!widget) return;
      setResizeState({
        widgetId,
        startX: e.clientX,
        startY: e.clientY,
        startW: widget.width,
        startH: widget.height,
      });
    },
    [form.widgets]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragState) {
        const pos = getCanvasPos(e.clientX, e.clientY);
        const widget = form.widgets.find((w) => w.id === dragState.widgetId);
        if (!widget) return;

        const rawX = pos.x - dragState.offsetX;
        const rawY = pos.y - dragState.offsetY;

        const titleBarOffset = 28;
        const rawYWithoutTitle = rawY - titleBarOffset;

        const { snappedX, snappedY, guides: newGuides } = computeAlignmentSnap(
          dragState.widgetId,
          rawX,
          rawYWithoutTitle,
          widget.width,
          widget.height,
          form.widgets
        );

        const clampedX = Math.max(0, Math.min(snappedX, form.width - widget.width));
        const clampedY = Math.max(0, Math.min(snappedY, form.height - widget.height));

        setGuides(newGuides);
        onUpdateWidget(dragState.widgetId, { x: clampedX, y: clampedY });
      } else if (resizeState) {
        const dx = e.clientX - resizeState.startX;
        const dy = e.clientY - resizeState.startY;
        const newW = Math.max(40, Math.round((resizeState.startW + dx) / 4) * 4);
        const newH = Math.max(20, Math.round((resizeState.startH + dy) / 4) * 4);
        onUpdateWidget(resizeState.widgetId, { width: newW, height: newH });
      }
    },
    [dragState, resizeState, form.widgets, form.width, form.height, getCanvasPos, onUpdateWidget]
  );

  const handleMouseUp = useCallback(() => {
    setDragState(null);
    setResizeState(null);
    setGuides({ x: [], y: [] });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (selectedId && (e.key === 'Delete' || e.key === 'Backspace')) {
        onDeleteWidget(selectedId);
        onSelect(null);
      }
    },
    [selectedId, onDeleteWidget, onSelect]
  );

  const isDragging = dragState !== null;

  return (
    <div className="flex-1 overflow-auto bg-slate-200/50 p-6 flex items-start justify-center">
      <div className="relative">
        <div className="text-[10px] text-slate-400 mb-1 font-mono text-center">
          {form.title} ({form.width} x {form.height})
        </div>
        <div
          ref={canvasRef}
          tabIndex={0}
          className="relative border border-slate-300 shadow-lg outline-none"
          style={{
            width: form.width,
            height: form.height,
            backgroundColor: form.bg || '#f0f0f0',
            backgroundImage: form.backgroundImage ? `url(${form.backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onKeyDown={handleKeyDown}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="absolute top-0 left-0 right-0 h-7 bg-gradient-to-b from-[#ececec] to-[#d6d6d6] border-b border-[#a0a0a0] flex items-center select-none">
            <div className="w-4 h-4 ml-1.5 flex items-center justify-center">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-sky-400 to-sky-600" />
            </div>
            <span className="flex-1 text-[11px] text-[#333] font-normal ml-1 truncate">{form.title}</span>
            <div className="flex items-stretch h-full">
              <div className="flex items-center justify-center w-[28px] hover:bg-[#c8c8c8] transition-colors">
                <Minus size={12} className="text-[#333]" strokeWidth={1.5} />
              </div>
              <div className="flex items-center justify-center w-[28px] hover:bg-[#c8c8c8] transition-colors">
                <Square size={9} className="text-[#333]" strokeWidth={1.5} />
              </div>
              <div className="flex items-center justify-center w-[28px] hover:bg-[#e81123] transition-colors group">
                <X size={13} className="text-[#333] group-hover:text-white" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {isDragging && guides.x.map((gx, i) => (
            <div
              key={`gx-${i}`}
              className="absolute top-0 bottom-0 pointer-events-none z-50"
              style={{
                left: gx,
                width: 1,
                backgroundColor: '#e83030',
                opacity: 0.85,
              }}
            />
          ))}
          {isDragging && guides.y.map((gy, i) => (
            <div
              key={`gy-${i}`}
              className="absolute left-0 right-0 pointer-events-none z-50"
              style={{
                top: gy + 28,
                height: 1,
                backgroundColor: '#e83030',
                opacity: 0.85,
              }}
            />
          ))}

          {form.widgets.map((w) => (
            <div
              key={w.id}
              className={`absolute group ${
                selectedId === w.id
                  ? 'ring-2 ring-sky-500 ring-offset-1'
                  : 'hover:ring-1 hover:ring-sky-300'
              }`}
              style={{
                left: w.x,
                top: w.y + 28,
                width: w.width,
                height: w.height,
                cursor: dragState?.widgetId === w.id ? 'grabbing' : 'grab',
              }}
              onMouseDown={(e) => handleWidgetMouseDown(e, w.id)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onDoubleClick(w.id);
              }}
            >
              <WidgetPreview widget={w} />

              {selectedId === w.id && (
                <>
                  <div className="absolute -top-5 left-0 text-[9px] font-mono text-sky-600 bg-sky-50 px-1 rounded border border-sky-200 whitespace-nowrap">
                    {w.id}
                  </div>
                  <div
                    className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-sky-500 border border-white rounded-sm cursor-se-resize"
                    onMouseDown={(e) => handleResizeMouseDown(e, w.id)}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
