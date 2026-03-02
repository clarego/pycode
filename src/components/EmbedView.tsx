import { useEffect, useState } from 'react';
import { loadSnippet } from '../lib/snippets';
import PythonPlayground from './PythonPlayground';
import { Loader2 } from 'lucide-react';

interface EmbedViewProps {
  shortCode: string;
}

export default function EmbedView({ shortCode }: EmbedViewProps) {
  const [files, setFiles] = useState<Record<string, string> | null>(null);
  const [binaryFiles, setBinaryFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string | undefined>(undefined);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snippet = await loadSnippet(shortCode);
      if (snippet) {
        setFiles(snippet.files);
        setBinaryFiles(snippet.binary_files || {});
        setActiveFile(snippet.active_file || undefined);
      } else {
        setError(true);
      }
      setLoading(false);
    }
    load();
  }, [shortCode]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading snippet...</span>
        </div>
      </div>
    );
  }

  if (error || !files) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 font-medium">Snippet not found</p>
          <p className="text-sm text-slate-400 mt-1">This code may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <PythonPlayground
        initialFiles={files}
        initialBinaryFiles={binaryFiles}
        initialActiveFile={activeFile}
        isEmbed
        shareCode={shortCode}
      />
    </div>
  );
}
