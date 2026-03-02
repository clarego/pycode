import { useState, useRef, useCallback, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import {
  Pencil,
  Type,
  Image as ImageIcon,
  Download,
  Save,
  Trash2,
  MousePointer,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  Eraser,
} from 'lucide-react';
import type {
  AnnotationState,
  TextBox,
  DrawingPath,
} from '../../lib/pdfAnnotations';

type Tool = 'select' | 'draw' | 'text' | 'image' | 'eraser';

interface PdfAnnotatorProps {
  pdfUrl: string;
  filename: string;
  username?: string;
  initialState?: AnnotationState;
  onSave?: (state: AnnotationState, exportDataUrl: string) => void;
  saving?: boolean;
  savedOk?: boolean;
}

const EMPTY_STATE: AnnotationState = { textBoxes: [], images: [], drawings: [] };

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function PdfAnnotator({
  pdfUrl,
  filename,
  initialState,
  onSave,
  saving = false,
  savedOk = false,
}: PdfAnnotatorProps) {
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState('#e11d48');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(14);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1);

  const [state, setState] = useState<AnnotationState>(initialState ?? EMPTY_STATE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

  const overlayRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragState = useRef<{
    id: string;
    type: 'textbox' | 'image';
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const resizeState = useRef<{
    id: string;
    type: 'textbox' | 'image';
    startX: number;
    startY: number;
    origW: number;
    origH: number;
  } | null>(null);

  useEffect(() => {
    if (initialState) setState(initialState);
  }, [initialState]);

  const pageAnnotations = {
    textBoxes: state.textBoxes.filter((t) => t.page === currentPage),
    images: state.images.filter((i) => i.page === currentPage),
    drawings: state.drawings.filter((d) => d.page === currentPage),
  };

  function getOverlayPos(e: React.MouseEvent | MouseEvent): { x: number; y: number } {
    const rect = overlayRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * 100) / zoom,
      y: ((e.clientY - rect.top) * 100) / zoom,
    };
  }

  function handleOverlayMouseDown(e: React.MouseEvent) {
    if (tool === 'draw' || tool === 'eraser') {
      setIsDrawing(true);
      const pos = getOverlayPos(e);
      setCurrentPath([pos]);
      return;
    }
    if (tool === 'text') {
      const pos = getOverlayPos(e);
      const id = genId();
      const newBox: TextBox = {
        id,
        x: pos.x,
        y: pos.y,
        width: 200,
        height: 80,
        text: '',
        fontSize,
        color,
        page: currentPage,
      };
      setState((prev) => ({ ...prev, textBoxes: [...prev.textBoxes, newBox] }));
      setSelectedId(id);
      setEditingTextId(id);
      setTool('select');
      return;
    }
    if (tool === 'select') {
      setSelectedId(null);
      setEditingTextId(null);
    }
  }

  function handleOverlayMouseMove(e: React.MouseEvent | MouseEvent) {
    if (isDrawing) {
      const pos = getOverlayPos(e as React.MouseEvent);
      setCurrentPath((prev) => [...prev, pos]);
    }
    if (dragState.current) {
      const { id, type, startX, startY, origX, origY } = dragState.current;
      const dx = ((e.clientX - startX) * 100) / zoom;
      const dy = ((e.clientY - startY) * 100) / zoom;
      if (type === 'textbox') {
        setState((prev) => ({
          ...prev,
          textBoxes: prev.textBoxes.map((t) =>
            t.id === id ? { ...t, x: origX + dx, y: origY + dy } : t
          ),
        }));
      } else {
        setState((prev) => ({
          ...prev,
          images: prev.images.map((img) =>
            img.id === id ? { ...img, x: origX + dx, y: origY + dy } : img
          ),
        }));
      }
    }
    if (resizeState.current) {
      const { id, type, startX, startY, origW, origH } = resizeState.current;
      const dx = ((e.clientX - startX) * 100) / zoom;
      const dy = ((e.clientY - startY) * 100) / zoom;
      const newW = Math.max(60, origW + dx);
      const newH = Math.max(30, origH + dy);
      if (type === 'textbox') {
        setState((prev) => ({
          ...prev,
          textBoxes: prev.textBoxes.map((t) =>
            t.id === id ? { ...t, width: newW, height: newH } : t
          ),
        }));
      } else {
        setState((prev) => ({
          ...prev,
          images: prev.images.map((img) =>
            img.id === id ? { ...img, width: newW, height: newH } : img
          ),
        }));
      }
    }
  }

  function handleOverlayMouseUp(_e: React.MouseEvent | MouseEvent) {
    if (isDrawing && currentPath.length > 1) {
      const newPath: DrawingPath = {
        id: genId(),
        points: currentPath,
        color: tool === 'eraser' ? '#ffffff' : color,
        strokeWidth: tool === 'eraser' ? strokeWidth * 4 : strokeWidth,
        page: currentPage,
      };
      setState((prev) => ({ ...prev, drawings: [...prev.drawings, newPath] }));
    }
    setIsDrawing(false);
    setCurrentPath([]);
    dragState.current = null;
    resizeState.current = null;
  }

  useEffect(() => {
    window.addEventListener('mousemove', handleOverlayMouseMove as unknown as EventListener);
    window.addEventListener('mouseup', handleOverlayMouseUp as unknown as EventListener);
    return () => {
      window.removeEventListener('mousemove', handleOverlayMouseMove as unknown as EventListener);
      window.removeEventListener('mouseup', handleOverlayMouseUp as unknown as EventListener);
    };
  });

  function handlePaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData.items);
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (!blob) continue;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const src = ev.target?.result as string;
          const id = genId();
          setState((prev) => ({
            ...prev,
            images: [
              ...prev.images,
              { id, x: 40, y: 40, width: 300, height: 200, src, page: currentPage },
            ],
          }));
          setSelectedId(id);
        };
        reader.readAsDataURL(blob);
        e.preventDefault();
        return;
      }
    }
    const text = e.clipboardData.getData('text/plain');
    if (text && tool === 'select') {
      const id = genId();
      const newBox: TextBox = {
        id,
        x: 40,
        y: 40,
        width: 300,
        height: 120,
        text,
        fontSize,
        color,
        page: currentPage,
      };
      setState((prev) => ({ ...prev, textBoxes: [...prev.textBoxes, newBox] }));
      setSelectedId(id);
      e.preventDefault();
    }
  }

  function handleImageFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const id = genId();
      setState((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          { id, x: 40, y: 40, width: 300, height: 200, src, page: currentPage },
        ],
      }));
      setSelectedId(id);
      setTool('select');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function deleteSelected() {
    if (!selectedId) return;
    setState((prev) => ({
      textBoxes: prev.textBoxes.filter((t) => t.id !== selectedId),
      images: prev.images.filter((i) => i.id !== selectedId),
      drawings: prev.drawings.filter((d) => d.id !== selectedId),
    }));
    setSelectedId(null);
    setEditingTextId(null);
  }

  function pathToSvgD(points: { x: number; y: number }[]): string {
    if (points.length < 2) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
  }

  const handleSave = useCallback(async () => {
    onSave?.(state, '');
  }, [state, onSave]);

  const handleDownloadSvg = useCallback(() => {
    const svgEl = document.getElementById('pdf-annotation-svg') as SVGSVGElement | null;
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename.replace('.pdf', '-annotated.svg');
    a.click();
  }, [filename]);

  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPdf = useCallback(async () => {
    const iframeEl = iframeRef.current;
    if (!iframeEl) return;

    setIsExporting(true);

    try {
      const iframeRect = iframeEl.getBoundingClientRect();
      const W = iframeRect.width;
      const H = iframeRect.height;

      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, W, H);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = pdfUrl;
      });

      const pageDrawings = state.drawings.filter((d) => d.page === currentPage);
      for (const path of pageDrawings) {
        if (path.points.length < 2) continue;
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
      }

      const pageImages = state.images.filter((i) => i.page === currentPage);
      for (const ann of pageImages) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, ann.x, ann.y, ann.width, ann.height);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = ann.src;
        });
      }

      const pageTextBoxes = state.textBoxes.filter((t) => t.page === currentPage);
      for (const tb of pageTextBoxes) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(tb.x, tb.y, tb.width, tb.height);
        ctx.fillStyle = tb.color;
        ctx.font = `${tb.fontSize}px monospace`;
        const lines = tb.text.split('\n');
        const lineH = tb.fontSize * 1.4;
        lines.forEach((line, li) => {
          const maxW = tb.width - 4;
          let x = tb.x + 2;
          let y = tb.y + 2 + tb.fontSize + li * lineH;
          const words = line.split('');
          let row = '';
          for (const ch of words) {
            const test = row + ch;
            if (ctx.measureText(test).width > maxW && row.length > 0) {
              ctx.fillText(row, x, y);
              row = ch;
              y += lineH;
            } else {
              row = test;
            }
          }
          if (row) ctx.fillText(row, x, y);
        });
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const orientation = W > H ? 'landscape' : 'portrait';
      const pdf = new jsPDF({
        orientation,
        unit: 'px',
        format: [W, H],
        hotfixes: ['px_scaling'],
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, W, H);
      pdf.save(filename.replace(/\.pdf$/i, '') + '-annotated.pdf');
    } finally {
      setIsExporting(false);
    }
  }, [state, currentPage, pdfUrl, filename]);

  const zoomIn = () => setZoom((z) => Math.min(z + 25, 300));
  const zoomOut = () => setZoom((z) => Math.max(z - 25, 50));

  const pdfPageUrl = totalPages > 1
    ? `${pdfUrl}#page=${currentPage}`
    : pdfUrl;

  const overlayStyle: React.CSSProperties = {
    transform: `scale(${zoom / 100})`,
    transformOrigin: 'top left',
    cursor:
      tool === 'draw' || tool === 'eraser'
        ? 'crosshair'
        : tool === 'text'
        ? 'text'
        : tool === 'image'
        ? 'copy'
        : 'default',
  };

  return (
    <div
      className="flex flex-col h-full bg-slate-100 outline-none"
      tabIndex={0}
      onPaste={handlePaste}
      onKeyDown={(e) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && editingTextId === null) {
          deleteSelected();
        }
      }}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-b border-slate-200 shrink-0 flex-wrap">
        <span className="text-xs font-medium text-slate-600 mr-1 truncate max-w-[140px]">{filename}</span>
        <div className="w-px h-4 bg-slate-200 mx-1" />

        <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
          {(
            [
              { t: 'select' as Tool, icon: <MousePointer size={13} />, title: 'Select / Move' },
              { t: 'draw' as Tool, icon: <Pencil size={13} />, title: 'Draw' },
              { t: 'eraser' as Tool, icon: <Eraser size={13} />, title: 'Eraser' },
              { t: 'text' as Tool, icon: <Type size={13} />, title: 'Add Text' },
              { t: 'image' as Tool, icon: <ImageIcon size={13} />, title: 'Add Image' },
            ] as { t: Tool; icon: React.ReactNode; title: string }[]
          ).map(({ t, icon, title }) => (
            <button
              key={t}
              title={title}
              onClick={() => {
                setTool(t);
                if (t === 'image') fileInputRef.current?.click();
              }}
              className={`p-1.5 rounded-md transition-colors ${
                tool === t
                  ? 'bg-white shadow text-sky-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>

        {(tool === 'draw' || tool === 'eraser' || tool === 'text') && (
          <>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            {tool !== 'eraser' && (
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-slate-300"
                title="Color"
              />
            )}
            {(tool === 'draw' || tool === 'eraser') && (
              <select
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white"
              >
                <option value={1}>Thin</option>
                <option value={3}>Normal</option>
                <option value={6}>Thick</option>
                <option value={10}>Very Thick</option>
              </select>
            )}
            {tool === 'text' && (
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white"
              >
                <option value={10}>10px</option>
                <option value={12}>12px</option>
                <option value={14}>14px</option>
                <option value={16}>16px</option>
                <option value={18}>18px</option>
                <option value={20}>20px</option>
                <option value={24}>24px</option>
              </select>
            )}
          </>
        )}

        {selectedId && (
          <>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              title="Delete selected"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button onClick={zoomOut} disabled={zoom <= 50} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded transition-colors" title="Zoom out">
            <Minus size={13} />
          </button>
          <span className="text-xs text-slate-500 font-medium w-10 text-center">{zoom}%</span>
          <button onClick={zoomIn} disabled={zoom >= 300} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded transition-colors" title="Zoom in">
            <Plus size={13} />
          </button>
        </div>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded">
              <ChevronLeft size={13} />
            </button>
            <span className="text-xs text-slate-600 font-medium">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded">
              <ChevronRight size={13} />
            </button>
          </div>
        )}

        <div className="w-px h-4 bg-slate-200 mx-1" />

        {onSave && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              savedOk
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-sky-600 text-white hover:bg-sky-500'
            }`}
            title="Save annotations to cloud"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : savedOk ? <Check size={12} /> : <Save size={12} />}
            {saving ? 'Saving…' : savedOk ? 'Saved' : 'Save'}
          </button>
        )}

        <button
          onClick={handleDownloadPdf}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-white hover:bg-slate-600 transition-colors disabled:opacity-60"
          title="Export as PDF with annotations embedded"
        >
          {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          {isExporting ? 'Exporting…' : 'Export PDF'}
        </button>
        <button
          onClick={handleDownloadSvg}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200"
          title="Export annotation layer as SVG"
        >
          <Download size={12} />
          SVG
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto bg-slate-200 p-4 relative">
        <div
          className="relative shadow-xl mx-auto bg-white"
          style={{
            width: `${zoom}%`,
            minWidth: 400,
            maxWidth: '100%',
          }}
        >
          <iframe
            ref={iframeRef}
            src={pdfPageUrl}
            title={filename}
            className="w-full border-0 block"
            style={{ height: `calc(${zoom / 100} * 80vh)`, minHeight: 500 }}
            onLoad={() => {}}
          />

          <div
            ref={overlayRef}
            className="absolute inset-0 pointer-events-auto"
            style={overlayStyle}
            onMouseDown={handleOverlayMouseDown}
          >
            <svg
              id="pdf-annotation-svg"
              className="absolute inset-0 w-full h-full overflow-visible"
              style={{ width: '100%', height: '100%' }}
            >
              {pageAnnotations.drawings.map((path) => (
                <path
                  key={path.id}
                  d={pathToSvgD(path.points)}
                  stroke={path.color}
                  strokeWidth={path.strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`cursor-pointer ${selectedId === path.id ? 'opacity-80' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tool === 'select') setSelectedId(path.id);
                  }}
                />
              ))}

              {isDrawing && currentPath.length > 1 && (
                <path
                  d={pathToSvgD(currentPath)}
                  stroke={tool === 'eraser' ? '#ffffff' : color}
                  strokeWidth={tool === 'eraser' ? strokeWidth * 4 : strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pointerEvents="none"
                />
              )}
            </svg>

            {pageAnnotations.images.map((img) => (
              <div
                key={img.id}
                className={`absolute group ${selectedId === img.id ? 'ring-2 ring-sky-400' : ''}`}
                style={{ left: img.x, top: img.y, width: img.width, height: img.height }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (tool === 'select') {
                    setSelectedId(img.id);
                    dragState.current = {
                      id: img.id,
                      type: 'image',
                      startX: e.clientX,
                      startY: e.clientY,
                      origX: img.x,
                      origY: img.y,
                    };
                  }
                }}
              >
                <img
                  src={img.src}
                  alt="annotation"
                  className="w-full h-full object-contain pointer-events-none select-none"
                  draggable={false}
                />
                {selectedId === img.id && (
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 bg-sky-500 cursor-se-resize rounded-tl"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      resizeState.current = {
                        id: img.id,
                        type: 'image',
                        startX: e.clientX,
                        startY: e.clientY,
                        origW: img.width,
                        origH: img.height,
                      };
                    }}
                  />
                )}
              </div>
            ))}

            {pageAnnotations.textBoxes.map((tb) => (
              <div
                key={tb.id}
                className={`absolute group ${selectedId === tb.id ? 'ring-2 ring-sky-400' : 'ring-1 ring-dashed ring-slate-300'}`}
                style={{ left: tb.x, top: tb.y, width: tb.width, height: tb.height }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (tool === 'select') {
                    setSelectedId(tb.id);
                    if (editingTextId !== tb.id) {
                      dragState.current = {
                        id: tb.id,
                        type: 'textbox',
                        startX: e.clientX,
                        startY: e.clientY,
                        origX: tb.x,
                        origY: tb.y,
                      };
                    }
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingTextId(tb.id);
                  setSelectedId(tb.id);
                }}
              >
                {editingTextId === tb.id ? (
                  <textarea
                    autoFocus
                    value={tb.text}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        textBoxes: prev.textBoxes.map((t) =>
                          t.id === tb.id ? { ...t, text: e.target.value } : t
                        ),
                      }))
                    }
                    onBlur={() => setEditingTextId(null)}
                    className="w-full h-full resize-none bg-white/90 border-0 outline-none p-1 font-mono"
                    style={{ fontSize: tb.fontSize, color: tb.color }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div
                    className="w-full h-full p-1 font-mono whitespace-pre-wrap break-words overflow-hidden bg-white/80"
                    style={{ fontSize: tb.fontSize, color: tb.color }}
                  >
                    {tb.text || <span className="text-slate-300 italic text-xs">Double-click to edit</span>}
                  </div>
                )}
                {selectedId === tb.id && (
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 bg-sky-500 cursor-se-resize rounded-tl"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      resizeState.current = {
                        id: tb.id,
                        type: 'textbox',
                        startX: e.clientX,
                        startY: e.clientY,
                        origW: tb.width,
                        origH: tb.height,
                      };
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileInput}
      />

      <canvas ref={exportCanvasRef} className="hidden" />
    </div>
  );
}

