import { useEffect, useState } from 'react';
import { loadSnippet } from '../lib/snippets';
import PythonPlayground from './PythonPlayground';
import { Loader2 } from 'lucide-react';

interface SharedCodeViewProps {
  shortCode: string;
  profile?: { username: string; role: string } | null;
  apiKey?: string;
  logout?: () => void;
  onShowLogin?: () => void;
  onShowChangePassword?: () => void;
}

export default function SharedCodeView({
  shortCode,
  profile,
  apiKey,
  logout,
  onShowLogin,
  onShowChangePassword,
}: SharedCodeViewProps) {
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
      <PythonPlayground
        initialFiles={files}
        initialBinaryFiles={binaryFiles}
        initialActiveFile={activeFile}
        profile={profile}
        loading={false}
        apiKey={apiKey}
        logout={logout}
        onShowLogin={onShowLogin}
        onShowChangePassword={onShowChangePassword}
        defaultCollapsedPanels
      />
    </div>
  );
}
