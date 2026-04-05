import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { loadSession, type Snapshot } from '../lib/sessions';
import {
  Play, Pause, SkipBack, SkipForward, Clock, FileCode, Eye, Loader2, User,
  AlertTriangle, Clipboard, ChevronDown, ChevronUp, Video, ZoomIn, ArrowRight,
  Timer,
} from 'lucide-react';
import NotebookRenderer from './notebook/NotebookRenderer';

interface SessionReviewProps {
  shareId: string;
}

const SUSPICIOUS_CHARS_THRESHOLD = 80;
const PRE_FLAG_CONTEXT = 6;
const POST_FLAG_CONTEXT = 4;

interface FlaggedMoment {
  index: number;
  timestamp_ms: number;
  prev_timestamp_ms: number;
  chars_added: number;
  event?: string;
  file: string;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function computeCharsAdded(current: Snapshot, prev: Snapshot | null): number {
  if (current.chars_added && current.chars_added > 0) return current.chars_added;
  if (!prev) return 0;
  const currentTotal = Object.values(current.files as Record<string, string>).join('').length;
  const prevTotal = Object.values(prev.files as Record<string, string>).join('').length;
  return Math.max(0, currentTotal - prevTotal);
}

function findChangedFile(current: Snapshot, prev: Snapshot | null): string {
  if (!prev) return current.active_file;
  const curFiles = current.files as Record<string, string>;
  const prevFiles = prev.files as Record<string, string>;
  for (const [name, content] of Object.entries(curFiles)) {
    if (content !== (prevFiles[name] ?? '')) return name;
  }
  return current.active_file;
}

function diffLines(code: string, prevCode: string): { line: string; status: 'new' | 'changed' | 'same' }[] {
  const lines = code.split('\n');
  const prevLines = prevCode.split('\n');
  return lines.map((line, i) => {
    const isNew = i >= prevLines.length;
    const isChanged = !isNew && line !== prevLines[i];
    return { line, status: isNew ? 'new' : isChanged ? 'changed' : 'same' };
  });
}

function DiffHighlightedCode({ code, prevCode, highlight }: { code: string; prevCode: string; highlight?: boolean }) {
  const diffed = diffLines(code, prevCode);

  return (
    <div className="font-mono text-sm leading-6">
      {diffed.map(({ line, status }, i) => {
        let bg = 'border-l-2 border-transparent';
        if (status === 'new') {
          bg = highlight
            ? 'bg-emerald-100 border-l-4 border-emerald-500 animate-pulse-once'
            : 'bg-emerald-50 border-l-2 border-emerald-400';
        } else if (status === 'changed') {
          bg = highlight
            ? 'bg-amber-100 border-l-4 border-amber-500 animate-pulse-once'
            : 'bg-amber-50 border-l-2 border-amber-400';
        }

        return (
          <div key={i} className={`flex ${bg} transition-colors duration-200`}>
            <span className="select-none w-12 text-right pr-4 text-slate-400 text-xs leading-6 flex-shrink-0">
              {i + 1}
            </span>
            <pre className={`flex-1 whitespace-pre-wrap break-all ${
              status !== 'same' ? 'text-slate-900 font-medium' : 'text-slate-800'
            }`}>
              {line || ' '}
            </pre>
          </div>
        );
      })}
    </div>
  );
}

function FlagEventPanel({
  flag,
  snapshot,
  prevSnapshot,
  file,
  onClose,
}: {
  flag: FlaggedMoment;
  snapshot: Snapshot;
  prevSnapshot: Snapshot | null;
  file: string;
  onClose: () => void;
}) {
  const files = snapshot.files as Record<string, string>;
  const prevFiles = prevSnapshot ? (prevSnapshot.files as Record<string, string>) : {};
  const code = files[file] || '';
  const prevCode = prevFiles[file] || '';
  const diffed = diffLines(code, prevCode);
  const changedLines = diffed.filter(l => l.status !== 'same');
  const addedChars = changedLines.reduce((s, l) => s + l.line.length, 0);
  const isPaste = flag.event === 'paste';
  const durationMs = flag.timestamp_ms - flag.prev_timestamp_ms;
  const durationSec = Math.max(1, Math.round(durationMs / 1000));
  const isNb = file.endsWith('.ipynb');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden" style={{ backgroundColor: '#1e1e1e', border: '1px solid #3c3c3c' }}>
        <div className={`flex items-center justify-between px-5 py-3 ${isPaste ? 'bg-red-700' : 'bg-amber-600'}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-white">
              {isPaste ? <Clipboard size={15} /> : <AlertTriangle size={15} />}
              <span className="font-semibold text-sm">{isPaste ? 'Paste Detected' : 'Bulk Insert Detected'}</span>
            </div>
            <span className="text-white/80 text-xs font-mono bg-black/25 px-2 py-0.5 rounded">
              {formatTime(flag.timestamp_ms)}
            </span>
            <span className="flex items-center gap-1 text-white/90 text-xs bg-black/20 px-2 py-0.5 rounded font-medium">
              <Timer size={11} />
              +{flag.chars_added} chars in {durationSec}s
              {durationSec <= 3 && flag.chars_added >= SUSPICIOUS_CHARS_THRESHOLD && (
                <span className="ml-1 text-white font-bold">— highly suspicious</span>
              )}
            </span>
            <span className="text-white/70 text-xs">{changedLines.length} line{changedLines.length !== 1 ? 's' : ''} changed</span>
            <span className="text-white/60 text-xs font-mono">{file}</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors ml-4 shrink-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
          >
            Close
          </button>
        </div>

        <div className="flex-1 min-h-0 flex overflow-hidden" style={{ minHeight: 0 }}>
          <div className="flex-1 min-w-0 flex flex-col" style={{ borderRight: '1px solid #3c3c3c' }}>
            <div className="flex items-center gap-2 px-4 py-2 shrink-0" style={{ backgroundColor: '#252526', borderBottom: '1px solid #3c3c3c' }}>
              <ArrowRight size={12} style={{ color: '#858585' }} />
              <span className="text-xs font-medium" style={{ color: '#d4d4d4' }}>Before</span>
              <span className="text-[10px] font-mono ml-auto" style={{ color: '#858585' }}>{formatTime(flag.prev_timestamp_ms)}</span>
            </div>
            <div className="flex-1 overflow-auto" style={{ backgroundColor: '#1e1e1e' }}>
              {isNb ? (
                <NotebookRenderer content={prevCode || '{}'} />
              ) : (
                <div className="px-0 py-2" style={{ backgroundColor: '#1e1e1e' }}>
                  <div className="font-mono text-[13px] leading-[1.6]">
                    {prevCode.split('\n').map((line, i) => (
                      <div key={i} className="flex hover:bg-white/5">
                        <span className="select-none text-right pr-4 pl-3 text-[12px] w-10 shrink-0 align-top" style={{ color: '#858585' }}>{i + 1}</span>
                        <pre className="flex-1 pr-4 whitespace-pre-wrap break-all" style={{ color: '#d4d4d4' }}>{line || ' '}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2 shrink-0" style={{ backgroundColor: '#252526', borderBottom: '1px solid #3c3c3c' }}>
              <ArrowRight size={12} style={{ color: isPaste ? '#f48771' : '#dcdcaa' }} />
              <span className="text-xs font-medium" style={{ color: '#d4d4d4' }}>After</span>
              <span className={`text-[10px] font-bold ml-1 px-1.5 py-0.5 rounded ${isPaste ? 'bg-red-900/60 text-red-300' : 'bg-amber-900/60 text-amber-300'}`}>
                {isPaste ? 'PASTED' : 'BULK INSERT'}
              </span>
              <span className="text-[10px] font-mono ml-auto" style={{ color: '#858585' }}>{formatTime(flag.timestamp_ms)}</span>
            </div>
            <div className="flex-1 overflow-auto" style={{ backgroundColor: '#1e1e1e' }}>
              {isNb ? (
                <NotebookRenderer content={code} highlightNewContent={prevCode || '{}'} />
              ) : (
                <div className="py-2" style={{ backgroundColor: '#1e1e1e' }}>
                  {diffed.map(({ line, status }, i) => {
                    let bg = 'transparent';
                    let borderColor = 'transparent';
                    if (status === 'new') { bg = 'rgba(78,201,176,0.12)'; borderColor = '#4ec9b0'; }
                    else if (status === 'changed') { bg = 'rgba(220,220,170,0.12)'; borderColor = '#dcdcaa'; }
                    return (
                      <div key={i} className="flex hover:bg-white/5" style={{ backgroundColor: bg, borderLeft: `3px solid ${borderColor}` }}>
                        <span className="select-none text-right pr-4 pl-2 text-[12px] w-10 shrink-0" style={{ color: '#858585' }}>{i + 1}</span>
                        <pre className="flex-1 pr-4 whitespace-pre-wrap break-all font-mono text-[13px] leading-[1.6]" style={{
                          color: status !== 'same' ? (status === 'new' ? '#4ec9b0' : '#dcdcaa') : '#d4d4d4',
                          fontWeight: status !== 'same' ? 600 : 400,
                        }}>{line || ' '}</pre>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {!isNb && changedLines.length > 0 && (
          <div className="px-4 py-3 shrink-0" style={{ backgroundColor: '#252526', borderTop: '1px solid #3c3c3c' }}>
            <p className="text-[11px] font-semibold mb-2" style={{ color: '#858585' }}>Changed Lines ({changedLines.length})</p>
            <div className="space-y-0.5 max-h-24 overflow-auto">
              {changedLines.slice(0, 15).map((l, i) => (
                <div key={i} className="flex gap-2 font-mono text-[11px] px-2 py-0.5 rounded" style={{
                  backgroundColor: l.status === 'new' ? 'rgba(78,201,176,0.1)' : 'rgba(220,220,170,0.1)',
                  border: `1px solid ${l.status === 'new' ? 'rgba(78,201,176,0.3)' : 'rgba(220,220,170,0.3)'}`,
                }}>
                  <span className="shrink-0" style={{ color: l.status === 'new' ? '#4ec9b0' : '#dcdcaa' }}>
                    {l.status === 'new' ? '+' : '~'}
                  </span>
                  <span className="whitespace-pre-wrap break-all" style={{ color: '#d4d4d4' }}>{l.line || '(empty)'}</span>
                </div>
              ))}
              {changedLines.length > 15 && (
                <p className="text-[10px] text-center py-1" style={{ color: '#555' }}>+{changedLines.length - 15} more lines</p>
              )}
            </div>
          </div>
        )}
        {isNb && (
          <div className="px-4 py-2.5 shrink-0 flex items-center gap-3" style={{ backgroundColor: '#252526', borderTop: '1px solid #3c3c3c' }}>
            <span className="text-[11px]" style={{ color: '#858585' }}>
              Notebook — {changedLines.length} line{changedLines.length !== 1 ? 's' : ''} modified, {addedChars} chars added in {durationSec}s
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(86,156,214,0.15)', color: '#569cd6' }}>
              Changed cells highlighted in blue
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SessionReview({ shareId }: SessionReviewProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [durationMs, setDurationMs] = useState(0);
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState('');
  const [showFlags, setShowFlags] = useState(true);
  const [flagPlayRange, setFlagPlayRange] = useState<{ start: number; end: number } | null>(null);
  const [inspectFlag, setInspectFlag] = useState<FlaggedMoment | null>(null);
  const playRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSession(shareId).then((result) => {
      if (!result || result.snapshots.length === 0) {
        setError('Session not found or has no recorded activity.');
        setLoading(false);
        return;
      }
      setSnapshots(result.snapshots);
      setDurationMs(result.session.duration_ms);
      setStudentName(result.session.student_name || '');
      const lastSnapshot = result.snapshots[result.snapshots.length - 1];
      setCurrentIndex(result.snapshots.length - 1);
      setActiveTab(lastSnapshot.active_file);
      setLoading(false);
    });
  }, [shareId]);

  const flaggedMoments = useMemo(() => {
    const flags: FlaggedMoment[] = [];
    for (let i = 0; i < snapshots.length; i++) {
      const snap = snapshots[i];
      const prev = i > 0 ? snapshots[i - 1] : null;
      const charsAdded = computeCharsAdded(snap, prev);
      const isFlagged = charsAdded >= SUSPICIOUS_CHARS_THRESHOLD || snap.event === 'paste';
      if (isFlagged) {
        flags.push({
          index: i,
          timestamp_ms: snap.timestamp_ms,
          prev_timestamp_ms: prev ? prev.timestamp_ms : snap.timestamp_ms,
          chars_added: charsAdded,
          event: snap.event,
          file: findChangedFile(snap, prev),
        });
      }
    }
    return flags;
  }, [snapshots]);

  const flaggedIndices = useMemo(() => new Set(flaggedMoments.map(f => f.index)), [flaggedMoments]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (playRef.current) {
      clearTimeout(playRef.current);
      playRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPlaying || snapshots.length === 0) return;

    const endIndex = flagPlayRange ? flagPlayRange.end : snapshots.length - 1;

    if (currentIndex >= endIndex) {
      stopPlayback();
      if (flagPlayRange) setFlagPlayRange(null);
      return;
    }

    const currentMs = snapshots[currentIndex].timestamp_ms;
    const nextMs = snapshots[currentIndex + 1].timestamp_ms;
    const timeDiff = nextMs - currentMs;
    const delay = flagPlayRange
      ? Math.max(80, Math.min(timeDiff / playbackSpeed, 600))
      : Math.max(50, timeDiff / playbackSpeed);

    playRef.current = setTimeout(() => {
      setCurrentIndex((i) => i + 1);
    }, delay);

    return () => {
      if (playRef.current) clearTimeout(playRef.current);
    };
  }, [isPlaying, currentIndex, snapshots, playbackSpeed, stopPlayback, flagPlayRange]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      setFlagPlayRange(null);
    } else {
      if (currentIndex >= snapshots.length - 1) setCurrentIndex(0);
      setIsPlaying(true);
    }
  }, [isPlaying, currentIndex, snapshots.length, stopPlayback]);

  const jumpToFlag = useCallback((index: number) => {
    stopPlayback();
    setFlagPlayRange(null);
    setCurrentIndex(index);
    const snap = snapshots[index];
    if (snap) {
      const prev = index > 0 ? snapshots[index - 1] : null;
      setActiveTab(findChangedFile(snap, prev));
    }
  }, [stopPlayback, snapshots]);

  const playFlagInContext = useCallback((flag: FlaggedMoment) => {
    stopPlayback();
    const start = Math.max(0, flag.index - PRE_FLAG_CONTEXT);
    const end = Math.min(snapshots.length - 1, flag.index + POST_FLAG_CONTEXT);
    setFlagPlayRange({ start, end });
    setCurrentIndex(start);
    const snap = snapshots[flag.index];
    if (snap) {
      const prev = flag.index > 0 ? snapshots[flag.index - 1] : null;
      setActiveTab(findChangedFile(snap, prev));
    }
    setIsPlaying(true);
    if (codeContainerRef.current) {
      codeContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [stopPlayback, snapshots]);

  useEffect(() => {
    if (flagPlayRange && currentIndex >= flagPlayRange.end && isPlaying) {
      stopPlayback();
      setFlagPlayRange(null);
    }
  }, [currentIndex, flagPlayRange, isPlaying, stopPlayback]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-sky-500" />
          <p className="text-slate-500 text-sm">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Eye size={28} className="text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Session Not Found</h2>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const snapshot = snapshots[currentIndex];
  const prevSnapshot = currentIndex > 0 ? snapshots[currentIndex - 1] : null;
  const files = snapshot.files as Record<string, string>;
  const prevFiles = prevSnapshot ? (prevSnapshot.files as Record<string, string>) : {};
  const fileNames = Object.keys(files);
  const displayFile = fileNames.includes(activeTab) ? activeTab : fileNames[0] || '';
  const currentCode = files[displayFile] || '';
  const prevCode = prevFiles[displayFile] || '';
  const progress = durationMs > 0 ? (snapshot.timestamp_ms / durationMs) * 100 : 0;
  const currentCharsAdded = computeCharsAdded(snapshot, prevSnapshot);
  const isCurrentFlagged = flaggedIndices.has(currentIndex);
  const currentFlag = isCurrentFlagged
    ? flaggedMoments.find(f => f.index === currentIndex) ?? null
    : null;

  const isFlagPlayback = flagPlayRange !== null;
  const isAtFlagApex = isFlagPlayback && currentFlag !== null;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="flex items-center justify-between px-5 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-sky-400" />
            <span className="text-sm font-semibold text-white">Session Review</span>
          </div>
          {studentName && (
            <span className="flex items-center gap-1.5 text-xs text-sky-300 bg-sky-900/40 px-2.5 py-0.5 rounded-full">
              <User size={12} />
              {studentName}
            </span>
          )}
          <span className="text-xs text-slate-400 font-mono bg-slate-700/50 px-2 py-0.5 rounded">
            {shareId}
          </span>
          {isFlagPlayback && (
            <span className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-900/40 px-2.5 py-0.5 rounded-full animate-pulse">
              <Video size={12} />
              Playing flag context
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          {flaggedMoments.length > 0 && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle size={12} />
              {flaggedMoments.length} flag{flaggedMoments.length !== 1 ? 's' : ''}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            {formatTime(durationMs)} total
          </span>
          <span className="flex items-center gap-1.5">
            <FileCode size={12} />
            {snapshots.length} snapshots
          </span>
        </div>
      </header>

      {flaggedMoments.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200">
          <button
            onClick={() => setShowFlags(!showFlags)}
            className="w-full flex items-center justify-between px-5 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle size={13} />
              {flaggedMoments.length} suspicious moment{flaggedMoments.length !== 1 ? 's' : ''} detected — click a flag to play back the event
            </span>
            {showFlags ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showFlags && (
            <div className="px-5 pb-3 space-y-1.5">
              {flaggedMoments.map((flag) => {
                const durationSec = Math.max(1, Math.round((flag.timestamp_ms - flag.prev_timestamp_ms) / 1000));
                const isHighlySuspicious = durationSec <= 3 && flag.chars_added >= SUSPICIOUS_CHARS_THRESHOLD;
                return (
                <div
                  key={flag.index}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    currentIndex === flag.index
                      ? 'bg-amber-200/60 ring-1 ring-amber-300'
                      : 'bg-white/70'
                  }`}
                >
                  <button
                    onClick={() => jumpToFlag(flag.index)}
                    className="flex items-center gap-3 flex-1 text-left min-w-0"
                  >
                    <span className="text-xs font-mono text-amber-700 tabular-nums w-12 shrink-0">
                      {formatTime(flag.timestamp_ms)}
                    </span>
                    <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                      {flag.event === 'paste' && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                          <Clipboard size={9} />
                          PASTE
                        </span>
                      )}
                      {flag.chars_added >= SUSPICIOUS_CHARS_THRESHOLD && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          <Timer size={9} />
                          +{flag.chars_added} chars in {durationSec}s
                        </span>
                      )}
                      {isHighlySuspicious && (
                        <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                          highly suspicious
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 truncate">{flag.file}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">Step {flag.index + 1}</span>
                  </button>

                  <button
                    onClick={() => playFlagInContext(flag)}
                    title="Play this event in context — watch the code change live"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors shrink-0 ${
                      flag.event === 'paste'
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    <Video size={11} />
                    Play
                  </button>

                  <button
                    onClick={() => {
                      jumpToFlag(flag.index);
                      setInspectFlag(flag);
                    }}
                    title="Inspect before/after diff for this event"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors shrink-0 bg-slate-800 hover:bg-slate-700 text-white"
                  >
                    <ZoomIn size={11} />
                    Inspect
                  </button>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col" ref={codeContainerRef}>
        <div className={`flex items-center gap-1 px-4 py-1.5 border-b transition-colors ${
          isAtFlagApex
            ? (currentFlag?.event === 'paste' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200')
            : 'bg-white border-slate-200'
        }`}>
          {fileNames.map((name) => (
            <button
              key={name}
              onClick={() => setActiveTab(name)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                displayFile === name
                  ? 'bg-sky-50 text-sky-700 font-medium'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {name}
              {snapshot.active_file === name && (
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
              )}
            </button>
          ))}

          {isCurrentFlagged && (
            <div className="ml-auto flex items-center gap-2">
              {snapshot.event === 'paste' && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full">
                  <Clipboard size={10} />
                  PASTE DETECTED HERE
                </span>
              )}
              {currentCharsAdded >= SUSPICIOUS_CHARS_THRESHOLD && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                  <AlertTriangle size={10} />
                  +{currentCharsAdded} chars in ~1s
                </span>
              )}
              {currentFlag && (
                <button
                  onClick={() => setInspectFlag(currentFlag)}
                  className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-800 bg-white border border-slate-300 px-2 py-0.5 rounded-full transition-colors"
                >
                  <ZoomIn size={10} />
                  Inspect
                </button>
              )}
            </div>
          )}

          {isFlagPlayback && !isAtFlagApex && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Video size={9} />
                Playing flag context…
              </span>
            </div>
          )}
        </div>

        <div className={`flex-1 min-h-0 overflow-auto transition-colors duration-300 ${
          isAtFlagApex
            ? (currentFlag?.event === 'paste' ? 'bg-red-50/30' : 'bg-amber-50/30')
            : 'bg-white'
        }`}>
          {displayFile.endsWith('.ipynb') ? (
            <NotebookRenderer content={currentCode} />
          ) : (
            <div className="px-4 py-3">
              <DiffHighlightedCode
                code={currentCode}
                prevCode={prevCode}
                highlight={isAtFlagApex}
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border-t border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => { stopPlayback(); setFlagPlayRange(null); setCurrentIndex(0); }}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="Go to start"
          >
            <SkipBack size={16} />
          </button>

          <button
            onClick={togglePlayback}
            className={`p-2 rounded-full text-white transition-colors shadow-sm ${
              isFlagPlayback
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-sky-600 hover:bg-sky-500'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
          </button>

          <button
            onClick={() => { stopPlayback(); setFlagPlayRange(null); setCurrentIndex(snapshots.length - 1); }}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="Go to end"
          >
            <SkipForward size={16} />
          </button>

          {isFlagPlayback && (
            <button
              onClick={() => { stopPlayback(); setFlagPlayRange(null); }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
            >
              Exit flag replay
            </button>
          )}

          <div className="flex items-center gap-1.5 ml-2">
            {[0.5, 1, 2, 4].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {flaggedMoments.length > 0 && (
            <div className="flex items-center gap-1 ml-2 border-l border-slate-200 pl-3">
              {(() => {
                const prevFlag = [...flaggedMoments].reverse().find(f => f.index < currentIndex);
                const nextFlag = flaggedMoments.find(f => f.index > currentIndex);
                return (
                  <>
                    <button
                      onClick={() => prevFlag && jumpToFlag(prevFlag.index)}
                      disabled={!prevFlag}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-amber-700 hover:bg-amber-50 disabled:text-slate-300 disabled:hover:bg-transparent rounded transition-colors"
                      title="Previous flag"
                    >
                      <SkipBack size={10} />
                      <AlertTriangle size={10} />
                    </button>
                    <button
                      onClick={() => nextFlag && jumpToFlag(nextFlag.index)}
                      disabled={!nextFlag}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-amber-700 hover:bg-amber-50 disabled:text-slate-300 disabled:hover:bg-transparent rounded transition-colors"
                      title="Next flag"
                    >
                      <AlertTriangle size={10} />
                      <SkipForward size={10} />
                    </button>
                  </>
                );
              })()}
            </div>
          )}

          <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
            <span className="font-mono tabular-nums">
              {formatTime(snapshot.timestamp_ms)}
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-mono tabular-nums">
              {formatTime(durationMs)}
            </span>
            <span className="text-slate-300 ml-1">
              Step {currentIndex + 1} of {snapshots.length}
            </span>
            {isFlagPlayback && flagPlayRange && (
              <span className="text-amber-600 font-medium">
                (flag clip {currentIndex - flagPlayRange.start + 1}/{flagPlayRange.end - flagPlayRange.start + 1})
              </span>
            )}
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -top-5 left-0 right-0 h-5 flex items-end px-0.5">
            {snapshots.map((s, i) => {
              const left = durationMs > 0 ? (s.timestamp_ms / durationMs) * 100 : 0;
              const isFlagged = flaggedIndices.has(i);
              const isInRange = flagPlayRange && i >= flagPlayRange.start && i <= flagPlayRange.end;
              return (
                <div
                  key={i}
                  className={`absolute bottom-0 rounded-full transition-all ${
                    isFlagged
                      ? i === currentIndex
                        ? 'h-5 w-1.5 bg-red-500'
                        : 'h-4 w-1 bg-amber-400 group-hover:h-5'
                      : isInRange
                        ? 'h-3 w-0.5 bg-amber-300'
                        : i === currentIndex
                          ? 'h-4 w-0.5 bg-sky-500'
                          : 'h-2 w-0.5 bg-slate-300 group-hover:h-3 group-hover:bg-slate-400'
                  }`}
                  style={{ left: `${left}%` }}
                  title={
                    isFlagged
                      ? `${formatTime(s.timestamp_ms)} - ${s.event === 'paste' ? 'PASTE' : 'Bulk insert'} (+${computeCharsAdded(s, i > 0 ? snapshots[i - 1] : null)} chars)`
                      : `${formatTime(s.timestamp_ms)}`
                  }
                />
              );
            })}
          </div>

          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
            {flagPlayRange && (
              <div
                className="absolute inset-y-0 bg-amber-200/60"
                style={{
                  left: `${durationMs > 0 ? (snapshots[flagPlayRange.start].timestamp_ms / durationMs) * 100 : 0}%`,
                  width: `${durationMs > 0 ? ((snapshots[flagPlayRange.end].timestamp_ms - snapshots[flagPlayRange.start].timestamp_ms) / durationMs) * 100 : 0}%`,
                }}
              />
            )}
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-150 ${
                isFlagPlayback ? 'bg-amber-500/30' : 'bg-sky-500/20'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <input
            type="range"
            min={0}
            max={snapshots.length - 1}
            value={currentIndex}
            onChange={(e) => {
              stopPlayback();
              setFlagPlayRange(null);
              setCurrentIndex(Number(e.target.value));
            }}
            className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {inspectFlag && (
        <FlagEventPanel
          flag={inspectFlag}
          snapshot={snapshots[inspectFlag.index]}
          prevSnapshot={inspectFlag.index > 0 ? snapshots[inspectFlag.index - 1] : null}
          file={inspectFlag.file}
          onClose={() => setInspectFlag(null)}
        />
      )}
    </div>
  );
}
