import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { loadSession, type Snapshot } from '../lib/sessions';
import { Play, Pause, SkipBack, SkipForward, Clock, FileCode, Eye, Loader2, User, AlertTriangle, Clipboard, ChevronDown, ChevronUp } from 'lucide-react';

interface SessionReviewProps {
  shareId: string;
}

const SUSPICIOUS_CHARS_THRESHOLD = 80;

interface FlaggedMoment {
  index: number;
  timestamp_ms: number;
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

function DiffHighlightedCode({ code, prevCode }: { code: string; prevCode: string }) {
  const lines = code.split('\n');
  const prevLines = prevCode.split('\n');

  return (
    <div className="font-mono text-sm leading-6">
      {lines.map((line, i) => {
        const isNew = i >= prevLines.length;
        const isChanged = !isNew && line !== prevLines[i];
        let bg = '';
        if (isNew) bg = 'bg-emerald-50 border-l-2 border-emerald-400';
        else if (isChanged) bg = 'bg-amber-50 border-l-2 border-amber-400';
        else bg = 'border-l-2 border-transparent';

        return (
          <div key={i} className={`flex ${bg} transition-colors duration-150`}>
            <span className="select-none w-12 text-right pr-4 text-slate-400 text-xs leading-6 flex-shrink-0">
              {i + 1}
            </span>
            <pre className="flex-1 whitespace-pre-wrap break-all text-slate-800">
              {line || ' '}
            </pre>
          </div>
        );
      })}
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
  const playRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    if (currentIndex >= snapshots.length - 1) {
      stopPlayback();
      return;
    }

    const currentMs = snapshots[currentIndex].timestamp_ms;
    const nextMs = snapshots[currentIndex + 1].timestamp_ms;
    const delay = Math.max(50, (nextMs - currentMs) / playbackSpeed);

    playRef.current = setTimeout(() => {
      setCurrentIndex((i) => i + 1);
    }, delay);

    return () => {
      if (playRef.current) clearTimeout(playRef.current);
    };
  }, [isPlaying, currentIndex, snapshots, playbackSpeed, stopPlayback]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      if (currentIndex >= snapshots.length - 1) setCurrentIndex(0);
      setIsPlaying(true);
    }
  }, [isPlaying, currentIndex, snapshots.length, stopPlayback]);

  const jumpToFlag = useCallback((index: number) => {
    stopPlayback();
    setCurrentIndex(index);
    const snap = snapshots[index];
    if (snap) {
      const prev = index > 0 ? snapshots[index - 1] : null;
      setActiveTab(findChangedFile(snap, prev));
    }
  }, [stopPlayback, snapshots]);

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
              {flaggedMoments.length} suspicious moment{flaggedMoments.length !== 1 ? 's' : ''} detected
            </span>
            {showFlags ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showFlags && (
            <div className="px-5 pb-3 space-y-1.5">
              {flaggedMoments.map((flag) => (
                <button
                  key={flag.index}
                  onClick={() => jumpToFlag(flag.index)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                    currentIndex === flag.index
                      ? 'bg-amber-200/60 ring-1 ring-amber-300'
                      : 'bg-white/70 hover:bg-white'
                  }`}
                >
                  <span className="text-xs font-mono text-amber-700 tabular-nums w-12 shrink-0">
                    {formatTime(flag.timestamp_ms)}
                  </span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {flag.event === 'paste' && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                        <Clipboard size={9} />
                        PASTE
                      </span>
                    )}
                    {flag.chars_added >= SUSPICIOUS_CHARS_THRESHOLD && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        +{flag.chars_added} chars
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 truncate">{flag.file}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Step {flag.index + 1}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-1 px-4 py-1.5 bg-white border-b border-slate-200">
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
                <span className="flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full animate-pulse">
                  <Clipboard size={10} />
                  PASTE DETECTED
                </span>
              )}
              {currentCharsAdded >= SUSPICIOUS_CHARS_THRESHOLD && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <AlertTriangle size={10} />
                  +{currentCharsAdded} chars in ~1s
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-auto bg-white px-4 py-3">
          <DiffHighlightedCode code={currentCode} prevCode={prevCode} />
        </div>
      </div>

      <div className="bg-white border-t border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => { stopPlayback(); setCurrentIndex(0); }}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="Go to start"
          >
            <SkipBack size={16} />
          </button>

          <button
            onClick={togglePlayback}
            className="p-2 rounded-full bg-sky-600 hover:bg-sky-500 text-white transition-colors shadow-sm"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
          </button>

          <button
            onClick={() => { stopPlayback(); setCurrentIndex(snapshots.length - 1); }}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="Go to end"
          >
            <SkipForward size={16} />
          </button>

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
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -top-5 left-0 right-0 h-5 flex items-end px-0.5">
            {snapshots.map((s, i) => {
              const left = durationMs > 0 ? (s.timestamp_ms / durationMs) * 100 : 0;
              const isFlagged = flaggedIndices.has(i);
              return (
                <div
                  key={i}
                  className={`absolute bottom-0 rounded-full transition-all ${
                    isFlagged
                      ? i === currentIndex
                        ? 'h-5 w-1.5 bg-red-500'
                        : 'h-4 w-1 bg-amber-400 group-hover:h-5'
                      : i === currentIndex
                        ? 'h-4 w-0.5 bg-sky-500'
                        : 'h-2 w-0.5 bg-slate-300 group-hover:h-3 group-hover:bg-slate-400'
                  }`}
                  style={{ left: `${left}%` }}
                  title={
                    isFlagged
                      ? `${formatTime(s.timestamp_ms)} - ${s.event === 'paste' ? 'PASTE' : 'Bulk insert'} (+${computeCharsAdded(s, i > 0 ? snapshots[i-1] : null)} chars)`
                      : `${formatTime(s.timestamp_ms)}`
                  }
                />
              );
            })}
          </div>

          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-sky-500/20 rounded-full transition-all duration-150"
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
              setCurrentIndex(Number(e.target.value));
            }}
            className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
