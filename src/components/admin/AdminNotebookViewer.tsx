import { useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import NotebookEditor from '../notebook/NotebookEditor';
import { usePyodide } from '../../hooks/usePyodide';

interface AdminNotebookViewerProps {
  content: string;
  filename: string;
}

export default function AdminNotebookViewer({ content, filename }: AdminNotebookViewerProps) {
  const [notebookContent, setNotebookContent] = useState(content);

  const {
    isReady,
    isRunning,
    output,
    plots,
    runCode,
  } = usePyodide();

  const handleRunCode = useCallback(
    (code: string) => {
      runCode({ 'main.py': code }, 'main.py');
    },
    [runCode]
  );

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3" style={{ backgroundColor: '#1e1e1e' }}>
        <Loader2 size={20} className="animate-spin text-sky-400" />
        <span className="text-xs" style={{ color: '#858585' }}>Loading Python runtime...</span>
      </div>
    );
  }

  return (
    <NotebookEditor
      value={notebookContent}
      onChange={setNotebookContent}
      onRunCode={handleRunCode}
      isRunning={isRunning}
      output={output}
      plots={plots}
      filename={filename}
    />
  );
}
