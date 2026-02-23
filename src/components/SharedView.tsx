import { useEffect, useState } from 'react';
import { loadSnippet } from '../lib/snippets';
import PythonPlayground from './PythonPlayground';
import { Loader2 } from 'lucide-react';

interface SharedViewProps {
  shortCode: string;
}

export default function SharedView({ shortCode }: SharedViewProps) {
  const [files, setFiles] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snippet = await loadSnippet(shortCode);
      if (snippet) {
        setFiles(snippet.files);
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
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-sky-500" />
          <span className="text-sm text-slate-500">Loading shared code...</span>
        </div>
      </div>
    );
  }

  if (error || !files) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-slate-400">?</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-700">Snippet not found</h2>
          <p className="text-sm text-slate-400 mt-2">
            This code snippet may have been removed or the link is invalid.
          </p>
          <a
            href="/"
            className="inline-block mt-4 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-500 transition-colors"
          >
            Go to Editor
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <PythonPlayground initialFiles={files} />
    </div>
  );
}
