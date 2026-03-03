import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Pencil,
  Type,
  Image as ImageIcon,
  Save,
  Trash2,
  MousePointer,
  Minus,
  Plus,
  Loader2,
  Check,
  Eraser,
  Highlighter,
} from 'lucide-react';
import type {
  AnnotationState,
  TextBox,
  DrawingPath,
} from '../../lib/pdfAnnotations';

type Tool = 'select' | 'draw' | 'text' | 'image' | 'eraser' | 'highlight';

interface PdfAnnotatorProps {
  pdfUrl: string;
  filename: string;
  username?: string;
  initialState?: AnnotationState;
  onSave?: (state: AnnotationState) => void;
  saving?: boolean;
  savedOk?: boolean;
  readOnly?: boolean;
}

const EMPTY_STATE: AnnotationState = { textBoxes: [], images: [], drawings: [] };

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

const PDF_BASE_WIDTH = 850;
const PDF_PAGE_HEIGHT = 1100;
const PDF_PAGES = 20;
const PDF_TOTAL_HEIGHT = PDF_PAGE_HEIGHT * PDF_PAGES;

export default function PdfAnnotator({
  pdfUrl,
  filename,
  initialState,
  onSave,
  saving = false,
  savedOk = false,
  readOnly = false,
}: PdfAnnotatorProps) {
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState('#e11d48');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(14);
  const [zoom, setZoom] = useState(100);

  const [state, setState] = useState<AnnotationState>(initialState ?? EMPTY_STATE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

  const contentRef = useRef<HTMLDivElement>(null);
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

  function getContentPos(e: React.MouseEvent | MouseEvent): { x: number; y: number } {
    const rect = contentRef.current!.getBoundingClientRect();
    const scale = zoom / 100;
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }

  function handleContentMouseDown(e: React.MouseEvent) {
    if (readOnly) return;
    if (tool === 'draw' || tool === 'eraser' || tool === 'highlight') {
      setIsDrawing(true);
      const pos = getContentPos(e);
      setCurrentPath([pos]);
      return;
    }
    if (tool === 'text') {
      const pos = getContentPos(e);
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
        page: 1,
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

  function handleMouseMove(e: MouseEvent) {
    if (isDrawing) {
      const pos = getContentPos(e as unknown as React.MouseEvent);
      setCurrentPath((prev) => [...prev, pos]);
    }
    if (dragState.current) {
      const { id, type, startX, startY, origX, origY } = dragState.current;
      const scale = zoom / 100;
      const dx = (e.clientX - startX) / scale;
      const dy = (e.clientY - startY) / scale;
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
      const scale = zoom / 100;
      const dx = (e.clientX - startX) / scale;
      const dy = (e.clientY - startY) / scale;
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

  function handleMouseUp() {
    if (isDrawing && currentPath.length > 1) {
      const isHighlight = tool === 'highlight';
      const newPath: DrawingPath = {
        id: genId(),
        points: currentPath,
        color: tool === 'eraser' ? '#ffffff' : isHighlight ? color + '66' : color,
        strokeWidth: tool === 'eraser' ? strokeWidth * 4 : isHighlight ? 20 : strokeWidth,
        page: 1,
      };
      setState((prev) => ({ ...prev, drawings: [...prev.drawings, newPath] }));
    }
    setIsDrawing(false);
    setCurrentPath([]);
    dragState.current = null;
    resizeState.current = null;
  }

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });

  function handlePaste(e: React.ClipboardEvent) {
    if (readOnly) return;
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
              { id, x: 40, y: 40, width: 300, height: 200, src, page: 1 },
            ],
          }));
          setSelectedId(id);
        };
        reader.readAsDataURL(blob);
        e.preventDefault();
        return;
      }
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
          { id, x: 40, y: 40, width: 300, height: 200, src, page: 1 },
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
    onSave?.(state);
  }, [state, onSave]);

  const zoomIn = () => setZoom((z) => Math.min(z + 25, 300));
  const zoomOut = () => setZoom((z) => Math.max(z - 25, 50));

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    setPdfLoadError(false);
    setBlobUrl(null);

    async function fetchPdf() {
      try {
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error('Failed to fetch PDF');
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch {
        setPdfLoadError(true);
      }
    }

    fetchPdf();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [pdfUrl]);

  const scale = zoom / 100;

  const cursorStyle =
    tool === 'draw' || tool === 'eraser' || tool === 'highlight'
      ? 'crosshair'
      : tool === 'text'
      ? 'text'
      : tool === 'image'
      ? 'copy'
      : 'default';

  return (
    <div
      className="flex flex-col h-full bg-slate-100 outline-none select-none"
      tabIndex={0}
      onPaste={handlePaste}
      onKeyDown={(e) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && editingTextId === null) {
          deleteSelected();
        }
      }}
    >
      {!readOnly && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-b border-slate-200 shrink-0 flex-wrap">
          <span className="text-xs font-medium text-slate-600 mr-1 truncate max-w-[140px]">{filename}</span>
          <div className="w-px h-4 bg-slate-200 mx-1" />

          <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
            {(
              [
                { t: 'select' as Tool, icon: <MousePointer size={13} />, title: 'Select / Move' },
                { t: 'draw' as Tool, icon: <Pencil size={13} />, title: 'Draw' },
                { t: 'highlight' as Tool, icon: <Highlighter size={13} />, title: 'Highlight' },
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

          {(tool === 'draw' || tool === 'eraser' || tool === 'text' || tool === 'highlight') && (
            <>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              {tool !== 'eraser' && (
                <input
                  type="color"
                  value={color.replace(/66$/, '')}
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

          {onSave && (
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                savedOk
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-sky-600 text-white hover:bg-sky-500'
              }`}
              title="Save annotations"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : savedOk ? <Check size={12} /> : <Save size={12} />}
              {saving ? 'Saving…' : savedOk ? 'Saved' : 'Save'}
            </button>
          )}
        </div>
      )}

      {readOnly && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200 shrink-0">
          <span className="text-xs font-medium text-amber-700">Viewing student annotations for: {filename}</span>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <button onClick={zoomOut} disabled={zoom <= 50} className="p-1 text-amber-500 hover:text-amber-700 disabled:opacity-30 rounded transition-colors">
              <Minus size={13} />
            </button>
            <span className="text-xs text-amber-600 font-medium w-10 text-center">{zoom}%</span>
            <button onClick={zoomIn} disabled={zoom >= 300} className="p-1 text-amber-500 hover:text-amber-700 disabled:opacity-30 rounded transition-colors">
              <Plus size={13} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto bg-slate-200">
        <div
          className="mx-auto"
          style={{
            width: PDF_BASE_WIDTH * scale,
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          {pdfLoadError ? (
            <div className="flex flex-col items-center justify-center bg-slate-100 text-center px-4 py-16 shadow-xl" style={{ width: PDF_BASE_WIDTH * scale }}>
              <p className="text-sm font-medium text-slate-600 mb-1">Could not load PDF</p>
              <p className="text-xs text-slate-400 mb-3">The file could not be fetched. Try downloading it instead.</p>
              <a
                href={pdfUrl}
                download={filename}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors text-xs font-medium"
              >
                Download PDF
              </a>
            </div>
          ) : !blobUrl ? (
            <div className="flex items-center justify-center bg-slate-100 shadow-xl" style={{ width: PDF_BASE_WIDTH * scale, height: PDF_PAGE_HEIGHT * scale }}>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
                Loading PDF…
              </div>
            </div>
          ) : (
            <div
              ref={contentRef}
              className="relative shadow-xl bg-white"
              style={{
                width: PDF_BASE_WIDTH * scale,
                height: PDF_TOTAL_HEIGHT * scale,
                cursor: readOnly ? 'default' : cursorStyle,
              }}
              onMouseDown={handleContentMouseDown}
            >
              <embed
                src={`${blobUrl}#toolbar=1&navpanes=1&scrollbar=0&view=FitH`}
                type="application/pdf"
                className="absolute inset-0 border-0 block"
                style={{
                  width: PDF_BASE_WIDTH,
                  height: PDF_TOTAL_HEIGHT,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  pointerEvents: readOnly || tool !== 'select' ? 'none' : 'auto',
                }}
              />

              <svg
                className="absolute inset-0 overflow-visible pointer-events-none"
                style={{
                  width: PDF_BASE_WIDTH,
                  height: PDF_TOTAL_HEIGHT,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                {state.drawings.map((path) => (
                  <path
                    key={path.id}
                    d={pathToSvgD(path.points)}
                    stroke={path.color}
                    strokeWidth={path.strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={selectedId === path.id ? 'opacity-80' : ''}
                    style={{ cursor: readOnly ? 'default' : 'pointer', pointerEvents: readOnly ? 'none' : 'auto' }}
                    onClick={(e) => {
                      if (readOnly) return;
                      e.stopPropagation();
                      if (tool === 'select') setSelectedId(path.id);
                    }}
                  />
                ))}

                {isDrawing && currentPath.length > 1 && (
                  <path
                    d={pathToSvgD(currentPath)}
                    stroke={tool === 'eraser' ? '#ffffff' : tool === 'highlight' ? color + '66' : color}
                    strokeWidth={tool === 'eraser' ? strokeWidth * 4 : tool === 'highlight' ? 20 : strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pointerEvents="none"
                  />
                )}
              </svg>

              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  width: PDF_BASE_WIDTH,
                  height: PDF_TOTAL_HEIGHT,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                {state.images.map((img) => (
                  <div
                    key={img.id}
                    className={`absolute group ${!readOnly && selectedId === img.id ? 'ring-2 ring-sky-400' : ''}`}
                    style={{ left: img.x, top: img.y, width: img.width, height: img.height, pointerEvents: readOnly ? 'none' : 'auto' }}
                    onMouseDown={(e) => {
                      if (readOnly) return;
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
                    {!readOnly && selectedId === img.id && (
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

                {state.textBoxes.map((tb) => (
                  <div
                    key={tb.id}
                    className={`absolute group ${
                      !readOnly && selectedId === tb.id
                        ? 'ring-2 ring-sky-400'
                        : readOnly
                        ? 'ring-1 ring-sky-200'
                        : 'ring-1 ring-dashed ring-slate-300'
                    }`}
                    style={{ left: tb.x, top: tb.y, width: tb.width, height: tb.height, pointerEvents: readOnly ? 'none' : 'auto' }}
                    onMouseDown={(e) => {
                      if (readOnly) return;
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
                      if (readOnly) return;
                      e.stopPropagation();
                      setEditingTextId(tb.id);
                      setSelectedId(tb.id);
                    }}
                  >
                    {!readOnly && editingTextId === tb.id ? (
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
                        className="w-full h-full p-1 font-mono whitespace-pre-wrap break-words overflow-hidden bg-white/90"
                        style={{ fontSize: tb.fontSize, color: tb.color }}
                      >
                        {tb.text || (!readOnly && <span className="text-slate-300 italic text-xs">Double-click to edit</span>)}
                      </div>
                    )}
                    {!readOnly && selectedId === tb.id && (
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
          )}
        </div>
      </div>

      {!readOnly && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileInput}
        />
      )}
    </div>
  );
}
