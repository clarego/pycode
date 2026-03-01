import { useEffect, useRef, useState } from 'react';
import { usePyodide } from '../../hooks/usePyodide';
import TurtleRenderer, { TurtleFrame } from '../TurtleRenderer';
import { Loader2 } from 'lucide-react';

interface TaskOutputPreviewProps {
  solutionCode: string;
  usesTurtle?: boolean;
}

export default function TaskOutputPreview({ solutionCode, usesTurtle }: TaskOutputPreviewProps) {
  const { isReady, isRunning, turtleFrame, output, runCode } = usePyodide();
  const [hasRun, setHasRun] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState<TurtleFrame | null>(null);
  const [capturedOutput, setCapturedOutput] = useState<string[]>([]);
  const runRef = useRef(false);

  useEffect(() => {
    if (isReady && !runRef.current) {
      runRef.current = true;
      runCode({ 'main.py': solutionCode });
    }
  }, [isReady, solutionCode, runCode]);

  useEffect(() => {
    if (!isRunning && runRef.current && !hasRun) {
      setHasRun(true);
      if (turtleFrame) {
        setCapturedFrame(turtleFrame);
      }
      const lines = output
        .filter(l => l.type === 'stdout')
        .map(l => l.text);
      setCapturedOutput(lines);
    }
  }, [isRunning, turtleFrame, output, hasRun]);

  const loading = !hasRun;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-slate-500">
        <Loader2 size={13} className="animate-spin" />
        <span className="text-[10px]">Running preview...</span>
      </div>
    );
  }

  if (usesTurtle && capturedFrame) {
    return (
      <div className="rounded overflow-hidden border border-slate-700/50 bg-slate-950">
        <div className="flex items-center h-6 px-2 bg-gradient-to-b from-[#e8e8e8] to-[#d0d0d0] border-b border-[#a0a0a0] select-none">
          <div className="flex items-center gap-1 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e] border border-[#dea123]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840] border border-[#1aab29]" />
          </div>
          <div className="flex-1 text-center text-[9px] text-[#4a4a4a] font-medium truncate">
            {capturedFrame.title || 'Python Turtle Graphics'}
          </div>
          <div className="w-8" />
        </div>
        <div style={{ position: 'relative' }}>
          <svg
            viewBox={`0 0 ${capturedFrame.width} ${capturedFrame.height}`}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              backgroundColor: capturedFrame.bgcolor || 'white',
            }}
          >
            {capturedFrame.items.map((item, i) => renderItem(item, capturedFrame.width, capturedFrame.height, i))}
          </svg>
        </div>
      </div>
    );
  }

  if (!usesTurtle && capturedOutput.length > 0) {
    return (
      <div className="rounded border border-slate-700/50 bg-slate-950 overflow-hidden">
        <div className="px-2 py-1 bg-slate-800/80 border-b border-slate-700/50">
          <span className="text-[9px] text-slate-400 font-mono">output</span>
        </div>
        <pre className="p-2 text-[10px] font-mono text-emerald-300 leading-relaxed max-h-40 overflow-y-auto">
          {capturedOutput.join('\n')}
        </pre>
      </div>
    );
  }

  return null;
}

function toCanvas(x: number, y: number, w: number, h: number): [number, number] {
  return [w / 2 + x, h / 2 - y];
}

function renderItem(item: Record<string, unknown>, w: number, h: number, idx: number): JSX.Element | null {
  switch (item.type) {
    case 'line': {
      const [x1, y1] = toCanvas(item.x1 as number, item.y1 as number, w, h);
      const [x2, y2] = toCanvas(item.x2 as number, item.y2 as number, w, h);
      return <line key={idx} x1={x1} y1={y1} x2={x2} y2={y2} stroke={(item.color as string) || 'black'} strokeWidth={(item.width as number) || 1} strokeLinecap="round" />;
    }
    case 'dot': {
      const [dx, dy] = toCanvas(item.x as number, item.y as number, w, h);
      return <circle key={idx} cx={dx} cy={dy} r={((item.size as number) || 4) / 2} fill={(item.color as string) || 'black'} />;
    }
    case 'polygon': {
      const pts = item.points as [number, number][];
      if (!pts || pts.length < 3) return null;
      const pointStr = pts.map(([px, py]) => { const [cx, cy] = toCanvas(px, py, w, h); return `${cx},${cy}`; }).join(' ');
      return <polygon key={idx} points={pointStr} fill={(item.color as string) || 'black'} stroke="none" />;
    }
    case 'text': {
      const [tx, ty] = toCanvas(item.x as number, item.y as number, w, h);
      return (
        <text key={idx} x={tx} y={ty} fill={(item.color as string) || 'black'} fontSize={(item.size as number) || 8} fontFamily={(item.font as string) || 'Arial'} textAnchor="start">
          {item.text as string}
        </text>
      );
    }
    default:
      return null;
  }
}
