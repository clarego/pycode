export interface NotebookOutput {
  output_type: 'stream' | 'execute_result' | 'display_data' | 'error';
  name?: string;
  text?: string[];
  data?: Record<string, string[]>;
  ename?: string;
  evalue?: string;
  traceback?: string[];
  execution_count?: number | null;
  metadata?: Record<string, unknown>;
}

export interface NotebookCell {
  id: string;
  cell_type: 'code' | 'markdown' | 'raw';
  source: string;
  metadata: Record<string, unknown>;
  execution_count?: number | null;
  outputs?: NotebookOutput[];
}

export interface NotebookDocument {
  nbformat: number;
  nbformat_minor: number;
  metadata: Record<string, unknown>;
  cells: NotebookCell[];
}

let _cellIdCounter = 1;

export function generateCellId(): string {
  return `cell_${Date.now()}_${_cellIdCounter++}`;
}

export function createEmptyNotebook(): NotebookDocument {
  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
      language_info: { name: 'python', version: '3.10.0' },
    },
    cells: [
      {
        id: generateCellId(),
        cell_type: 'code',
        source: '',
        metadata: {},
        execution_count: null,
        outputs: [],
      },
    ],
  };
}

export function parseNotebook(json: string): NotebookDocument {
  try {
    const raw = JSON.parse(json);
    const cells: NotebookCell[] = (raw.cells || []).map((c: Record<string, unknown>) => ({
      id: (c.id as string) || generateCellId(),
      cell_type: (c.cell_type as string) || 'code',
      source: Array.isArray(c.source) ? (c.source as string[]).join('') : ((c.source as string) || ''),
      metadata: (c.metadata as Record<string, unknown>) || {},
      execution_count: (c.execution_count as number) ?? null,
      outputs: (c.outputs as NotebookOutput[]) || [],
    }));
    return {
      nbformat: (raw.nbformat as number) || 4,
      nbformat_minor: (raw.nbformat_minor as number) || 5,
      metadata: (raw.metadata as Record<string, unknown>) || {},
      cells,
    };
  } catch {
    return createEmptyNotebook();
  }
}

function splitSourceLines(source: string): string[] {
  if (!source) return [];
  const lines = source.split('\n');
  return lines.map((line, i) => (i < lines.length - 1 ? line + '\n' : line));
}

export function serializeNotebook(doc: NotebookDocument): string {
  const output = {
    nbformat: doc.nbformat,
    nbformat_minor: doc.nbformat_minor,
    metadata: doc.metadata,
    cells: doc.cells.map((c) => {
      const cell: Record<string, unknown> = {
        id: c.id,
        cell_type: c.cell_type,
        source: splitSourceLines(c.source),
        metadata: c.metadata,
      };
      if (c.cell_type === 'code') {
        cell.execution_count = c.execution_count ?? null;
        cell.outputs = c.outputs || [];
      }
      return cell;
    }),
  };
  return JSON.stringify(output, null, 1);
}

export function extractCodeCells(doc: NotebookDocument): string {
  return doc.cells
    .filter((c) => c.cell_type === 'code' && c.source.trim())
    .map((c) => c.source)
    .join('\n\n');
}
