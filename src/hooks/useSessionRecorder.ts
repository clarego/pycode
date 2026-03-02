import { useRef, useCallback, useEffect } from 'react';
import type { Snapshot } from '../lib/sessions';

const SNAPSHOT_INTERVAL_MS = 1000;
const BULK_INSERT_THRESHOLD = 80;

export interface RedFlag {
  type: 'paste' | 'bulk_insert';
  chars: number;
  timestamp_ms: number;
  file: string;
}

function totalChars(files: Record<string, string>): number {
  let total = 0;
  for (const v of Object.values(files)) {
    total += v.length;
  }
  return total;
}

function findChangedFile(
  current: Record<string, string>,
  prev: Record<string, string>,
  activeFile: string
): string {
  for (const [name, content] of Object.entries(current)) {
    if (content !== (prev[name] ?? '')) return name;
  }
  return activeFile;
}

export function useSessionRecorder() {
  const snapshots = useRef<Snapshot[]>([]);
  const startTime = useRef<number>(Date.now());
  const lastContent = useRef<string>('');
  const lastTotalChars = useRef<number>(0);
  const lastFiles = useRef<Record<string, string>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentFiles = useRef<Record<string, string>>({});
  const currentActiveFile = useRef<string>('main.py');
  const pendingEvent = useRef<string | null>(null);
  const redFlags = useRef<RedFlag[]>([]);

  const captureSnapshot = useCallback(() => {
    const serialized = JSON.stringify(currentFiles.current);
    if (serialized === lastContent.current && !pendingEvent.current) return;

    const currentTotal = totalChars(currentFiles.current);
    const charsAdded = Math.max(0, currentTotal - lastTotalChars.current);

    let event = pendingEvent.current || undefined;
    if (!event && charsAdded >= BULK_INSERT_THRESHOLD) {
      event = 'bulk_insert';
    }

    const timestampMs = Date.now() - startTime.current;

    if (event === 'paste' || (event === 'bulk_insert' && charsAdded >= BULK_INSERT_THRESHOLD)) {
      const changedFile = findChangedFile(
        currentFiles.current,
        lastFiles.current,
        currentActiveFile.current
      );
      redFlags.current.push({
        type: event as 'paste' | 'bulk_insert',
        chars: charsAdded,
        timestamp_ms: timestampMs,
        file: changedFile,
      });
    }

    pendingEvent.current = null;
    lastContent.current = serialized;
    lastTotalChars.current = currentTotal;
    lastFiles.current = { ...currentFiles.current };

    snapshots.current.push({
      timestamp_ms: timestampMs,
      files: { ...currentFiles.current },
      active_file: currentActiveFile.current,
      chars_added: charsAdded,
      event,
    });
  }, []);

  useEffect(() => {
    startTime.current = Date.now();
    snapshots.current = [];
    lastContent.current = '';
    lastTotalChars.current = 0;
    lastFiles.current = {};
    redFlags.current = [];

    intervalRef.current = setInterval(captureSnapshot, SNAPSHOT_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [captureSnapshot]);

  const updateFiles = useCallback((files: Record<string, string>, activeFile: string) => {
    currentFiles.current = files;
    currentActiveFile.current = activeFile;
  }, []);

  const recordEvent = useCallback((event: string) => {
    pendingEvent.current = event;
    captureSnapshot();
  }, [captureSnapshot]);

  const getSnapshots = useCallback(() => {
    captureSnapshot();
    return {
      snapshots: [...snapshots.current],
      durationMs: Date.now() - startTime.current,
    };
  }, [captureSnapshot]);

  const getRedFlags = useCallback((): RedFlag[] => {
    return [...redFlags.current];
  }, []);

  const reset = useCallback(() => {
    startTime.current = Date.now();
    snapshots.current = [];
    lastContent.current = '';
    lastTotalChars.current = 0;
    lastFiles.current = {};
    redFlags.current = [];
  }, []);

  return { updateFiles, getSnapshots, reset, recordEvent, getRedFlags };
}
