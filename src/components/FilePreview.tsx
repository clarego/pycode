import { Download, Eye, File, FileText, Table, Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface FilePreviewProps {
  filename: string | null;
  url: string | null;
}

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'bmp', 'webp', 'ico']);
const DOC_EXT = new Set(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp']);

function getPreviewType(filename: string): 'image' | 'pdf' | 'csv' | 'text' | 'document' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (IMAGE_EXT.has(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'csv') return 'csv';
  if (ext === 'txt' || ext === 'md') return 'text';
  if (DOC_EXT.has(ext)) return 'document';
  return 'other';
}

function parseCSV(text: string): string[][] {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map(line => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

export default function FilePreview({ filename, url }: FilePreviewProps) {
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    setZoom(100);
  }, [filename, url]);

  useEffect(() => {
    if (!filename || !url) return;

    const type = getPreviewType(filename);
    if (type === 'csv' || type === 'text') {
      if (url.startsWith('data:')) {
        const base64Data = url.split(',')[1];
        const decodedText = atob(base64Data);

        if (type === 'csv') {
          setCsvData(parseCSV(decodedText));
        } else if (type === 'text') {
          setTextContent(decodedText);
        }
      } else {
        fetch(url)
          .then(res => res.text())
          .then(text => {
            if (type === 'csv') {
              setCsvData(parseCSV(text));
            } else if (type === 'text') {
              setTextContent(text);
            }
          })
          .catch(() => {
            setCsvData(null);
            setTextContent(null);
          });
      }
    }
  }, [filename, url]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 400));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  if (!filename || !url) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50/50">
        <div className="text-center px-4">
          <Eye size={20} className="mx-auto mb-2 text-slate-300" />
          <p className="text-[10px] text-slate-400">Select a file to preview</p>
        </div>
      </div>
    );
  }

  const type = getPreviewType(filename);
  const canZoom = type === 'image' || type === 'pdf' || type === 'csv' || type === 'text';

  const previewContent = (
    <div className="flex-1 min-h-0 overflow-auto flex flex-col">
        {type === 'image' ? (
          <div className="w-full h-full flex items-center justify-center p-2 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#fff_0%_50%)] bg-[length:12px_12px]">
            <img
              key={`img-${containerSize.width}-${containerSize.height}`}
              src={url}
              alt={filename}
              className="max-w-full max-h-full object-contain rounded"
              style={{ transform: `scale(${zoom / 100})` }}
            />
          </div>
        ) : type === 'pdf' ? (
          <div className="w-full h-full" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
            <object
              key={`pdf-${containerSize.width}-${containerSize.height}`}
              data={url}
              type="application/pdf"
              className="w-full h-full flex-1"
              style={{ width: `${100 / (zoom / 100)}%`, height: `${100 / (zoom / 100)}%` }}
            >
              <div className="w-full h-full flex items-center justify-center p-4 text-center bg-slate-50">
                <div>
                  <File size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-xs text-slate-600 mb-2">PDF preview unavailable</p>
                  <p className="text-[10px] text-slate-400 mb-4">Your browser cannot display PDFs inline</p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors text-xs font-medium"
                  >
                    <Download size={12} />
                    Open PDF
                  </a>
                </div>
              </div>
            </object>
          </div>
        ) : type === 'csv' && csvData ? (
          <div className="w-full h-full p-2 overflow-auto">
            <div className="inline-block min-w-full" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
              <table className="min-w-full border border-slate-200 text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    {csvData[0]?.map((header, i) => (
                      <th key={i} className="px-2 py-1 border border-slate-200 text-left font-semibold text-slate-700">
                        {header || `Column ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(1).map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-50">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-2 py-1 border border-slate-200 text-slate-600">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : type === 'text' && textContent ? (
          <div className="w-full h-full p-3 overflow-auto">
            <pre
              className="text-xs text-slate-700 whitespace-pre-wrap font-mono"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
            >
              {textContent}
            </pre>
          </div>
        ) : type === 'document' ? (
          <div className="w-full h-full flex items-center justify-center p-4 text-center">
            <div>
              <FileText size={32} className="mx-auto mb-3 text-blue-400" />
              <p className="text-xs text-slate-700 font-medium mb-1">{filename}</p>
              <p className="text-[10px] text-slate-500 mb-4">Document files cannot be previewed in the browser</p>
              <a
                href={url}
                download={filename}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors text-xs font-medium"
              >
                <Download size={12} />
                Download Document
              </a>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-center">
            <div>
              <File size={24} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs text-slate-500 mb-3">{filename}</p>
              <a
                href={url}
                download={filename}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors text-xs"
              >
                <Download size={12} />
                Download
              </a>
            </div>
          </div>
        )}
    </div>
  );

  return (
    <>
      <div ref={containerRef} className="h-full flex flex-col bg-white">
        <div className="flex items-center justify-between px-2 py-1 border-b border-slate-200 bg-slate-50 shrink-0">
          <span className="text-[10px] font-medium text-slate-600 truncate">{filename}</span>
          <div className="flex items-center gap-1">
            {canZoom && (
              <>
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 25}
                  className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Zoom out"
                >
                  <ZoomOut size={11} />
                </button>
                <span className="text-[9px] text-slate-500 font-medium min-w-[28px] text-center">{zoom}%</span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 400}
                  className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Zoom in"
                >
                  <ZoomIn size={11} />
                </button>
                <div className="w-px h-3 bg-slate-300 mx-0.5" />
              </>
            )}
            <button
              onClick={() => setIsExpanded(true)}
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
              title="Enlarge preview"
            >
              <Maximize2 size={11} />
            </button>
            <a
              href={url}
              download={filename}
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
              title="Download file"
            >
              <Download size={11} />
            </a>
          </div>
        </div>
        {previewContent}
      </div>

      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-8" onClick={() => setIsExpanded(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-6xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
              <span className="text-sm font-medium text-slate-700 truncate">{filename}</span>
              <div className="flex items-center gap-2">
                {canZoom && (
                  <>
                    <button
                      onClick={handleZoomOut}
                      disabled={zoom <= 25}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Zoom out"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <span className="text-xs text-slate-500 font-medium min-w-[36px] text-center">{zoom}%</span>
                    <button
                      onClick={handleZoomIn}
                      disabled={zoom >= 400}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Zoom in"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <div className="w-px h-4 bg-slate-300 mx-1" />
                  </>
                )}
                <a
                  href={url}
                  download={filename}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title="Download file"
                >
                  <Download size={16} />
                </a>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            {previewContent}
          </div>
        </div>
      )}
    </>
  );
}
