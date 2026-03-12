interface NotebookCell {
  cell_type: 'code' | 'markdown' | 'raw';
  source: string | string[];
  outputs?: NotebookOutput[];
  execution_count?: number | null;
  metadata?: Record<string, unknown>;
}

interface NotebookOutput {
  output_type: string;
  text?: string | string[];
  data?: Record<string, string | string[]>;
  traceback?: string[];
  ename?: string;
  evalue?: string;
}

interface NotebookData {
  cells: NotebookCell[];
  metadata?: {
    kernelspec?: { display_name?: string };
    language_info?: { name?: string };
  };
  nbformat?: number;
}

function cellSource(source: string | string[]): string {
  if (Array.isArray(source)) return source.join('');
  return source ?? '';
}

function outputText(output: NotebookOutput): string {
  if (output.text) {
    return Array.isArray(output.text) ? output.text.join('') : output.text;
  }
  if (output.data?.['text/plain']) {
    const t = output.data['text/plain'];
    return Array.isArray(t) ? t.join('') : t;
  }
  return '';
}

function MarkdownCell({ source }: { source: string }) {
  const lines = source.split('\n');
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-xl font-bold text-slate-800 mt-4 mb-1">{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-lg font-semibold text-slate-800 mt-3 mb-1">{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-base font-semibold text-slate-700 mt-2 mb-0.5">{line.slice(4)}</h3>);
    } else if (line.startsWith('#### ')) {
      elements.push(<h4 key={i} className="text-sm font-semibold text-slate-700 mt-2">{line.slice(5)}</h4>);
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} className="border-slate-200 my-2" />);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = [];
      let j = i;
      while (j < lines.length && (lines[j].startsWith('- ') || lines[j].startsWith('* '))) {
        items.push(lines[j].slice(2));
        j++;
      }
      elements.push(
        <ul key={i} className="list-disc list-inside space-y-0.5 text-sm text-slate-700 my-1 pl-2">
          {items.map((item, k) => <li key={k}>{renderInline(item)}</li>)}
        </ul>
      );
      i = j;
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      let j = i;
      while (j < lines.length && /^\d+\. /.test(lines[j])) {
        items.push(lines[j].replace(/^\d+\. /, ''));
        j++;
      }
      elements.push(
        <ol key={i} className="list-decimal list-inside space-y-0.5 text-sm text-slate-700 my-1 pl-2">
          {items.map((item, k) => <li key={k}>{renderInline(item)}</li>)}
        </ol>
      );
      i = j;
      continue;
    } else if (line.startsWith('>')) {
      const items: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].startsWith('>')) {
        items.push(lines[j].slice(1).trimStart());
        j++;
      }
      elements.push(
        <blockquote key={i} className="border-l-4 border-amber-400 bg-amber-50 px-3 py-2 my-1 rounded-r text-sm text-slate-700">
          {items.map((item, k) => <p key={k} className="leading-relaxed">{renderInline(item)}</p>)}
        </blockquote>
      );
      i = j;
      continue;
    } else if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith('|') && lines[j].trim().endsWith('|')) {
        tableLines.push(lines[j]);
        j++;
      }
      const headerRow = tableLines[0];
      const headers = headerRow.split('|').slice(1, -1).map(h => h.trim());
      const isSeparator = (row: string) => /^\|[\s|:-]+\|$/.test(row.trim());
      const dataRows = tableLines.slice(1).filter(row => !isSeparator(row));
      elements.push(
        <div key={i} className="overflow-x-auto my-2">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                {headers.map((h, k) => (
                  <th key={k} className="border border-slate-300 px-3 py-1.5 text-left font-semibold text-slate-700 text-xs">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rk) => {
                const cells = row.split('|').slice(1, -1).map(c => c.trim());
                return (
                  <tr key={rk} className={rk % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    {cells.map((cell, ck) => (
                      <td key={ck} className="border border-slate-200 px-3 py-1.5 text-xs text-slate-700">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      i = j;
      continue;
    } else if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith('```')) {
        codeLines.push(lines[j]);
        j++;
      }
      elements.push(
        <pre key={i} className="bg-slate-900 text-slate-100 text-xs font-mono rounded p-3 my-2 overflow-x-auto whitespace-pre">
          {lang && <span className="text-slate-500 text-[10px] block mb-1">{lang}</span>}
          {codeLines.join('\n')}
        </pre>
      );
      i = j + 1;
      continue;
    } else if (line.trim() === '') {
      if (elements.length > 0) {
        elements.push(<div key={i} className="h-1" />);
      }
    } else {
      elements.push(
        <p key={i} className="text-sm text-slate-700 leading-relaxed">{renderInline(line)}</p>
      );
    }
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={key++} className="font-semibold">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={key++} className="italic">{match[3]}</em>);
    } else if (match[4]) {
      parts.push(<code key={key++} className="bg-slate-100 text-rose-600 text-xs px-1 py-0.5 rounded font-mono">{match[4]}</code>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}

function CellOutput({ outputs }: { outputs: NotebookOutput[] }) {
  if (!outputs || outputs.length === 0) return null;
  return (
    <div className="mt-1 space-y-1">
      {outputs.map((out, i) => {
        if (out.output_type === 'error') {
          return (
            <div key={i} className="bg-red-50 border border-red-200 rounded p-2 text-xs font-mono text-red-700">
              <div className="font-semibold">{out.ename}: {out.evalue}</div>
              {out.traceback && (
                <pre className="mt-1 text-[10px] text-red-500 whitespace-pre-wrap">{out.traceback.join('\n').replace(/\x1b\[[0-9;]*m/g, '')}</pre>
              )}
            </div>
          );
        }
        const text = outputText(out);
        if (!text) return null;
        return (
          <div key={i} className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-mono text-slate-700 whitespace-pre-wrap">
            {text}
          </div>
        );
      })}
    </div>
  );
}

interface NotebookRendererProps {
  content: string;
}

export default function NotebookRenderer({ content }: NotebookRendererProps) {
  let notebook: NotebookData | null = null;
  let parseError = false;

  try {
    notebook = JSON.parse(content) as NotebookData;
    if (!notebook.cells || !Array.isArray(notebook.cells)) {
      parseError = true;
    }
  } catch {
    parseError = true;
  }

  if (parseError || !notebook) {
    return (
      <pre className="text-xs text-slate-700 font-mono leading-relaxed p-4 whitespace-pre-wrap break-words">
        {content}
      </pre>
    );
  }

  const lang = notebook.metadata?.language_info?.name || notebook.metadata?.kernelspec?.display_name || 'python';

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Jupyter Notebook</span>
        <span className="text-[10px] text-slate-300">·</span>
        <span className="text-[10px] text-slate-400 capitalize">{lang}</span>
        <span className="text-[10px] text-slate-300">·</span>
        <span className="text-[10px] text-slate-400">{notebook.cells.length} cell{notebook.cells.length !== 1 ? 's' : ''}</span>
      </div>

      {notebook.cells.map((cell, idx) => {
        const src = cellSource(cell.source);
        const cellNum = idx + 1;

        if (cell.cell_type === 'markdown') {
          return (
            <div key={idx} className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border-b border-amber-100">
                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500">Markdown</span>
                <span className="text-[9px] text-slate-300 ml-auto">In [{cellNum}]</span>
              </div>
              <div className="px-4 py-3 bg-white">
                {src.trim() ? <MarkdownCell source={src} /> : <span className="text-xs text-slate-300 italic">Empty cell</span>}
              </div>
            </div>
          );
        }

        if (cell.cell_type === 'code') {
          const hasOutputs = cell.outputs && cell.outputs.length > 0;
          return (
            <div key={idx} className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 border-b border-sky-100">
                <span className="text-[9px] font-bold uppercase tracking-widest text-sky-500">Code</span>
                <span className="text-[9px] text-slate-300 ml-auto">
                  {cell.execution_count != null ? `In [${cell.execution_count}]` : `In [${cellNum}]`}
                </span>
              </div>
              <div className="bg-slate-900 px-3 py-2.5">
                {src.trim() ? (
                  <pre className="text-xs font-mono text-slate-100 whitespace-pre-wrap leading-5">{src}</pre>
                ) : (
                  <span className="text-xs text-slate-500 italic font-mono">Empty cell</span>
                )}
              </div>
              {hasOutputs && (
                <div className="px-3 py-2 bg-white border-t border-slate-200">
                  <CellOutput outputs={cell.outputs!} />
                </div>
              )}
            </div>
          );
        }

        if (cell.cell_type === 'raw') {
          return (
            <div key={idx} className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border-b border-slate-200">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Raw</span>
              </div>
              <pre className="px-3 py-2 text-xs font-mono text-slate-600 whitespace-pre-wrap bg-white">
                {src}
              </pre>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
