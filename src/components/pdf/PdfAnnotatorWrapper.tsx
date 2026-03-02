import { useEffect, useState, useCallback } from 'react';
import PdfAnnotator from './PdfAnnotator';
import {
  loadPdfAnnotation,
  savePdfAnnotation,
  type AnnotationState,
} from '../../lib/pdfAnnotations';

interface PdfAnnotatorWrapperProps {
  pdfUrl: string;
  filename: string;
  username?: string;
}

const EMPTY_STATE: AnnotationState = { textBoxes: [], images: [], drawings: [] };

export default function PdfAnnotatorWrapper({ pdfUrl, filename, username }: PdfAnnotatorWrapperProps) {
  const [initialState, setInitialState] = useState<AnnotationState | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setInitialState(undefined);

    async function load() {
      if (!username) {
        setInitialState(EMPTY_STATE);
        setLoaded(true);
        return;
      }
      const annotation = await loadPdfAnnotation(username, filename);
      setInitialState(annotation?.annotation_state ?? EMPTY_STATE);
      setLoaded(true);
    }

    load();
  }, [username, filename]);

  const handleSave = useCallback(
    async (state: AnnotationState) => {
      setSaving(true);
      setSavedOk(false);

      if (username) {
        await savePdfAnnotation(username, filename, state);
      }

      setSaving(false);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    },
    [username, filename]
  );

  if (!loaded) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
          Loading annotations…
        </div>
      </div>
    );
  }

  return (
    <PdfAnnotator
      pdfUrl={pdfUrl}
      filename={filename}
      username={username}
      initialState={initialState}
      onSave={username ? handleSave : undefined}
      saving={saving}
      savedOk={savedOk}
    />
  );
}
