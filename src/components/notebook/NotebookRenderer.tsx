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

type TokenType = 'keyword' | 'builtin' | 'string' | 'comment' | 'number' | 'decorator' | 'operator' | 'plain';

interface Token {
  type: TokenType;
  value: string;
}

const PYTHON_KEYWORDS = new Set([
  'False','None','True','and','as','assert','async','await',
  'break','class','continue','def','del','elif','else','except',
  'finally','for','from','global','if','import','in','is',
  'lambda','nonlocal','not','or','pass','raise','return',
  'try','while','with','yield',
]);

const PYTHON_BUILTINS = new Set([
  'print','input','len','range','int','float','str','bool','list',
  'dict','set','tuple','type','isinstance','hasattr','getattr','setattr',
  'enumerate','zip','map','filter','sorted','reversed','sum','min','max',
  'abs','round','open','super','object','property','staticmethod',
  'classmethod','repr','format','hash','id','iter','next','vars','dir',
]);

function tokenizePython(code: string): Token[][] {
  const lines = code.split('\n');
  return lines.map(line => {
    const tokens: Token[] = [];
    let i = 0;

    while (i < line.length) {
      if (line[i] === '#') {
        tokens.push({ type: 'comment', value: line.slice(i) });
        break;
      }

      if (line[i] === '@') {
        let j = i + 1;
        while (j < line.length && /[\w.]/.test(line[j])) j++;
        tokens.push({ type: 'decorator', value: line.slice(i, j) });
        i = j;
        continue;
      }

      if (line[i] === '"' || line[i] === "'") {
        const q = line[i];
        const triple = line.slice(i, i + 3) === q.repeat(3);
        let j = i + (triple ? 3 : 1);
        const end = triple ? q.repeat(3) : q;
        while (j < line.length) {
          if (line[j] === '\\') { j += 2; continue; }
          if (line.slice(j, j + end.length) === end) { j += end.length; break; }
          j++;
        }
        tokens.push({ type: 'string', value: line.slice(i, j) });
        i = j;
        continue;
      }

      if (/[0-9]/.test(line[i]) || (line[i] === '.' && /[0-9]/.test(line[i + 1] ?? ''))) {
        let j = i;
        while (j < line.length && /[0-9._xXbBoOeEjJ]/.test(line[j])) j++;
        tokens.push({ type: 'number', value: line.slice(i, j) });
        i = j;
        continue;
      }

      if (/[a-zA-Z_]/.test(line[i])) {
        let j = i;
        while (j < line.length && /[\w]/.test(line[j])) j++;
        const word = line.slice(i, j);
        if (PYTHON_KEYWORDS.has(word)) {
          tokens.push({ type: 'keyword', value: word });
        } else if (PYTHON_BUILTINS.has(word)) {
          tokens.push({ type: 'builtin', value: word });
        } else {
          tokens.push({ type: 'plain', value: word });
        }
        i = j;
        continue;
      }

      if (/[+\-*/%=<>!&|^~]/.test(line[i])) {
        let j = i;
        while (j < line.length && /[+\-*/%=<>!&|^~]/.test(line[j])) j++;
        tokens.push({ type: 'operator', value: line.slice(i, j) });
        i = j;
        continue;
      }

      tokens.push({ type: 'plain', value: line[i] });
      i++;
    }

    return tokens;
  });
}

const TOKEN_COLORS: Record<TokenType, string> = {
  keyword: '#569cd6',
  builtin: '#4ec9b0',
  string: '#ce9178',
  comment: '#6a9955',
  number: '#b5cea8',
  decorator: '#dcdcaa',
  operator: '#d4d4d4',
  plain: '#d4d4d4',
};

function VSCodeCodeBlock({ code }: { code: string }) {
  const tokenLines = tokenizePython(code);

  return (
    <div className="font-mono text-[13px] leading-[1.6] overflow-x-auto">
      <table className="w-full border-collapse">
        <tbody>
          {tokenLines.map((tokens, lineIdx) => (
            <tr key={lineIdx} className="hover:bg-white/5">
              <td
                className="select-none text-right pr-4 pl-3 text-[12px] w-10 align-top"
                style={{ color: '#858585', minWidth: '2.5rem' }}
              >
                {lineIdx + 1}
              </td>
              <td className="pr-4 align-top whitespace-pre-wrap break-all">
                {tokens.length === 0 ? (
                  <span>&nbsp;</span>
                ) : (
                  tokens.map((tok, ti) => (
                    <span key={ti} style={{ color: TOKEN_COLORS[tok.type] }}>
                      {tok.value}
                    </span>
                  ))
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MarkdownCell({ source }: { source: string }) {
  const lines = source.split('\n');
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-xl font-bold mt-4 mb-1" style={{ color: '#d4d4d4' }}>{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-lg font-semibold mt-3 mb-1" style={{ color: '#d4d4d4' }}>{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-base font-semibold mt-2 mb-0.5" style={{ color: '#d4d4d4' }}>{line.slice(4)}</h3>);
    } else if (line.startsWith('#### ')) {
      elements.push(<h4 key={i} className="text-sm font-semibold mt-2" style={{ color: '#c8c8c8' }}>{line.slice(5)}</h4>);
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} className="border-white/10 my-2" />);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = [];
      let j = i;
      while (j < lines.length && (lines[j].startsWith('- ') || lines[j].startsWith('* '))) {
        items.push(lines[j].slice(2));
        j++;
      }
      elements.push(
        <ul key={i} className="list-disc list-inside space-y-0.5 text-sm my-1 pl-2" style={{ color: '#d4d4d4' }}>
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
        <ol key={i} className="list-decimal list-inside space-y-0.5 text-sm my-1 pl-2" style={{ color: '#d4d4d4' }}>
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
        <blockquote key={i} className="border-l-4 border-yellow-500/60 bg-white/5 px-3 py-2 my-1 rounded-r text-sm" style={{ color: '#d4d4d4' }}>
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
              <tr style={{ backgroundColor: '#2d2d2d' }}>
                {headers.map((h, k) => (
                  <th key={k} className="border px-3 py-1.5 text-left font-semibold text-xs" style={{ borderColor: '#454545', color: '#d4d4d4' }}>
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rk) => {
                const cells = row.split('|').slice(1, -1).map(c => c.trim());
                return (
                  <tr key={rk} style={{ backgroundColor: rk % 2 === 0 ? '#1e1e1e' : '#252526' }}>
                    {cells.map((cell, ck) => (
                      <td key={ck} className="border px-3 py-1.5 text-xs" style={{ borderColor: '#454545', color: '#d4d4d4' }}>
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
        <div key={i} className="my-2 rounded overflow-hidden border" style={{ borderColor: '#454545', backgroundColor: '#1e1e1e' }}>
          {lang && <div className="px-3 py-1 text-[10px]" style={{ color: '#858585', borderBottom: '1px solid #454545' }}>{lang}</div>}
          <pre className="text-xs font-mono p-3 whitespace-pre overflow-x-auto" style={{ color: '#d4d4d4' }}>{codeLines.join('\n')}</pre>
        </div>
      );
      i = j + 1;
      continue;
    } else if (line.trim() === '') {
      if (elements.length > 0) {
        elements.push(<div key={i} className="h-1" />);
      }
    } else {
      elements.push(
        <p key={i} className="text-sm leading-relaxed" style={{ color: '#d4d4d4' }}>{renderInline(line)}</p>
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
      parts.push(<strong key={key++} className="font-semibold" style={{ color: '#d4d4d4' }}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={key++} className="italic" style={{ color: '#d4d4d4' }}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(<code key={key++} className="text-xs px-1 py-0.5 rounded font-mono" style={{ backgroundColor: '#2d2d2d', color: '#ce9178' }}>{match[4]}</code>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}

function CellOutput({ outputs }: { outputs: NotebookOutput[] }) {
  if (!outputs || outputs.length === 0) return null;
  return (
    <div className="mt-0 space-y-0">
      {outputs.map((out, i) => {
        if (out.output_type === 'error') {
          return (
            <div key={i} className="px-3 py-2 text-xs font-mono" style={{ backgroundColor: '#1a0000', borderTop: '1px solid #5a1a1a', color: '#f48771' }}>
              <div className="font-semibold">{out.ename}: {out.evalue}</div>
              {out.traceback && (
                <pre className="mt-1 text-[10px] whitespace-pre-wrap" style={{ color: '#d16969' }}>{out.traceback.join('\n').replace(/\x1b\[[0-9;]*m/g, '')}</pre>
              )}
            </div>
          );
        }
        const text = outputText(out);
        if (!text) return null;
        return (
          <div key={i} className="px-3 py-2 text-xs font-mono whitespace-pre-wrap" style={{ backgroundColor: '#1e1e1e', borderTop: '1px solid #3c3c3c', color: '#d4d4d4' }}>
            {text}
          </div>
        );
      })}
    </div>
  );
}

interface NotebookRendererProps {
  content: string;
  highlightNewContent?: string;
}

export default function NotebookRenderer({ content, highlightNewContent }: NotebookRendererProps) {
  let notebook: NotebookData | null = null;
  let prevNotebook: NotebookData | null = null;
  let parseError = false;

  try {
    notebook = JSON.parse(content) as NotebookData;
    if (!notebook.cells || !Array.isArray(notebook.cells)) {
      parseError = true;
    }
  } catch {
    parseError = true;
  }

  if (highlightNewContent) {
    try {
      prevNotebook = JSON.parse(highlightNewContent) as NotebookData;
      if (!prevNotebook.cells || !Array.isArray(prevNotebook.cells)) {
        prevNotebook = null;
      }
    } catch {
      prevNotebook = null;
    }
  }

  if (parseError || !notebook) {
    return (
      <div className="font-mono text-[13px] leading-[1.6]" style={{ backgroundColor: '#1e1e1e', minHeight: '100%' }}>
        {content.split('\n').map((line, i) => (
          <div key={i} className="flex hover:bg-white/5">
            <span
              className="select-none text-right pr-4 pl-3 text-[12px] w-10 shrink-0 leading-[1.6]"
              style={{ color: '#555' }}
            >
              {i + 1}
            </span>
            <pre className="flex-1 pr-4 whitespace-pre-wrap break-all" style={{ color: '#d4d4d4' }}>
              {line || ' '}
            </pre>
          </div>
        ))}
      </div>
    );
  }

  const lang = notebook.metadata?.language_info?.name || notebook.metadata?.kernelspec?.display_name || 'python';

  return (
    <div className="p-3 space-y-2" style={{ backgroundColor: '#1e1e1e', minHeight: '100%' }}>
      <div className="flex items-center gap-2 pb-2 mb-1" style={{ borderBottom: '1px solid #3c3c3c' }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#858585' }}>Jupyter Notebook</span>
        <span className="text-[10px]" style={{ color: '#555' }}>·</span>
        <span className="text-[10px] capitalize" style={{ color: '#858585' }}>{lang}</span>
        <span className="text-[10px]" style={{ color: '#555' }}>·</span>
        <span className="text-[10px]" style={{ color: '#858585' }}>{notebook.cells.length} cell{notebook.cells.length !== 1 ? 's' : ''}</span>
      </div>

      {notebook.cells.map((cell, idx) => {
        const src = cellSource(cell.source);
        const cellNum = cell.execution_count != null ? cell.execution_count : idx + 1;
        const prevSrc = prevNotebook ? cellSource(prevNotebook.cells[idx]?.source ?? '') : null;
        const isChanged = prevSrc !== null && src !== prevSrc;
        const isNew = prevNotebook !== null && idx >= prevNotebook.cells.length;

        if (cell.cell_type === 'markdown') {
          return (
            <div key={idx} className="rounded overflow-hidden" style={{
              border: isNew ? '1px solid #4ec9b0' : isChanged ? '1px solid #dcdcaa' : '1px solid #3c3c3c',
              backgroundColor: isNew ? '#0d1f1a' : isChanged ? '#1f1c0d' : '#252526',
            }}>
              <div className="flex items-center gap-1.5 px-3 py-1" style={{
                borderBottom: '1px solid #3c3c3c',
                backgroundColor: '#2d2d2d',
              }}>
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#dcdcaa' }}>Markdown</span>
                {(isNew || isChanged) && (
                  <span className="text-[9px] font-semibold px-1 rounded" style={{ color: isNew ? '#4ec9b0' : '#dcdcaa', backgroundColor: isNew ? '#0d2e25' : '#2a2408' }}>
                    {isNew ? 'NEW' : 'CHANGED'}
                  </span>
                )}
                <span className="text-[9px] ml-auto" style={{ color: '#555' }}>In [{cellNum}]</span>
              </div>
              <div className="px-4 py-3">
                {src.trim() ? <MarkdownCell source={src} /> : <span className="text-xs italic" style={{ color: '#555' }}>Empty cell</span>}
              </div>
            </div>
          );
        }

        if (cell.cell_type === 'code') {
          const hasOutputs = cell.outputs && cell.outputs.length > 0;
          return (
            <div key={idx} className="rounded overflow-hidden" style={{
              border: isNew ? '1px solid #4ec9b0' : isChanged ? '1px solid #569cd6' : '1px solid #3c3c3c',
              backgroundColor: '#1e1e1e',
            }}>
              <div className="flex items-center gap-1.5 px-3 py-1" style={{
                borderBottom: '1px solid #3c3c3c',
                backgroundColor: '#252526',
              }}>
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#569cd6' }}>Code</span>
                {(isNew || isChanged) && (
                  <span className="text-[9px] font-semibold px-1 rounded" style={{ color: isNew ? '#4ec9b0' : '#569cd6', backgroundColor: isNew ? '#0d2e25' : '#0d1a2e' }}>
                    {isNew ? 'NEW' : 'CHANGED'}
                  </span>
                )}
                <span className="text-[9px] ml-auto" style={{ color: '#555' }}>In [{cellNum}]</span>
              </div>
              <div className="py-2" style={{ backgroundColor: '#1e1e1e' }}>
                {src.trim() ? (
                  <VSCodeCodeBlock code={src} />
                ) : (
                  <span className="text-xs italic px-3" style={{ color: '#555' }}>Empty cell</span>
                )}
              </div>
              {hasOutputs && (
                <CellOutput outputs={cell.outputs!} />
              )}
            </div>
          );
        }

        if (cell.cell_type === 'raw') {
          return (
            <div key={idx} className="rounded overflow-hidden" style={{ border: '1px solid #3c3c3c' }}>
              <div className="flex items-center gap-1.5 px-3 py-1" style={{ borderBottom: '1px solid #3c3c3c', backgroundColor: '#252526' }}>
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#858585' }}>Raw</span>
              </div>
              <pre className="px-3 py-2 text-xs font-mono whitespace-pre-wrap" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}>
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
