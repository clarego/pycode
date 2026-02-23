import { useRef, useEffect, useCallback } from 'react';
import type { PygameFrame } from '../hooks/usePyodide';

interface PygameRendererProps {
  frame: PygameFrame;
  onEvent: (eventData: Record<string, unknown>) => void;
}

function rgbaStr(c: number[]): string {
  if (c.length >= 4) return `rgba(${c[0]},${c[1]},${c[2]},${c[3] / 255})`;
  return `rgb(${c[0] || 0},${c[1] || 0},${c[2] || 0})`;
}

function renderCommands(ctx: CanvasRenderingContext2D, commands: PygameFrame['commands']) {
  for (const cmd of commands) {
    switch (cmd.type) {
      case 'fill': {
        ctx.fillStyle = rgbaStr(cmd.color);
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        break;
      }
      case 'fillRect': {
        const [x, y, w, h] = cmd.rect;
        ctx.fillStyle = rgbaStr(cmd.color);
        ctx.fillRect(x, y, w, h);
        break;
      }
      case 'rect': {
        const [x, y, w, h] = cmd.rect;
        const br = cmd.border_radius || 0;
        if (cmd.width === 0) {
          ctx.fillStyle = rgbaStr(cmd.color);
          if (br > 0) {
            roundRect(ctx, x, y, w, h, br);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, w, h);
          }
        } else {
          ctx.strokeStyle = rgbaStr(cmd.color);
          ctx.lineWidth = cmd.width;
          if (br > 0) {
            roundRect(ctx, x, y, w, h, br);
            ctx.stroke();
          } else {
            ctx.strokeRect(x + cmd.width / 2, y + cmd.width / 2, w - cmd.width, h - cmd.width);
          }
        }
        break;
      }
      case 'circle': {
        const [cx, cy] = cmd.center;
        ctx.beginPath();
        ctx.arc(cx, cy, cmd.radius, 0, Math.PI * 2);
        if (cmd.width === 0) {
          ctx.fillStyle = rgbaStr(cmd.color);
          ctx.fill();
        } else {
          ctx.strokeStyle = rgbaStr(cmd.color);
          ctx.lineWidth = cmd.width;
          ctx.stroke();
        }
        break;
      }
      case 'ellipse': {
        const [ex, ey, ew, eh] = cmd.rect;
        ctx.beginPath();
        ctx.ellipse(ex + ew / 2, ey + eh / 2, ew / 2, eh / 2, 0, 0, Math.PI * 2);
        if (cmd.width === 0) {
          ctx.fillStyle = rgbaStr(cmd.color);
          ctx.fill();
        } else {
          ctx.strokeStyle = rgbaStr(cmd.color);
          ctx.lineWidth = cmd.width;
          ctx.stroke();
        }
        break;
      }
      case 'line': {
        ctx.beginPath();
        ctx.moveTo(cmd.start[0], cmd.start[1]);
        ctx.lineTo(cmd.end[0], cmd.end[1]);
        ctx.strokeStyle = rgbaStr(cmd.color);
        ctx.lineWidth = cmd.width || 1;
        ctx.lineCap = 'round';
        ctx.stroke();
        break;
      }
      case 'lines': {
        if (cmd.points.length < 2) break;
        ctx.beginPath();
        ctx.moveTo(cmd.points[0][0], cmd.points[0][1]);
        for (let i = 1; i < cmd.points.length; i++) {
          ctx.lineTo(cmd.points[i][0], cmd.points[i][1]);
        }
        if (cmd.closed) ctx.closePath();
        ctx.strokeStyle = rgbaStr(cmd.color);
        ctx.lineWidth = cmd.width || 1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        break;
      }
      case 'polygon': {
        if (cmd.points.length < 3) break;
        ctx.beginPath();
        ctx.moveTo(cmd.points[0][0], cmd.points[0][1]);
        for (let i = 1; i < cmd.points.length; i++) {
          ctx.lineTo(cmd.points[i][0], cmd.points[i][1]);
        }
        ctx.closePath();
        if (cmd.width === 0) {
          ctx.fillStyle = rgbaStr(cmd.color);
          ctx.fill();
        } else {
          ctx.strokeStyle = rgbaStr(cmd.color);
          ctx.lineWidth = cmd.width;
          ctx.stroke();
        }
        break;
      }
      case 'arc': {
        const [ax, ay, aw, ah] = cmd.rect;
        ctx.beginPath();
        ctx.ellipse(ax + aw / 2, ay + ah / 2, aw / 2, ah / 2, 0, -cmd.start, -cmd.stop, true);
        ctx.strokeStyle = rgbaStr(cmd.color);
        ctx.lineWidth = cmd.width || 1;
        ctx.stroke();
        break;
      }
      case 'text': {
        const weight = cmd.bold ? 'bold' : 'normal';
        const style = cmd.italic ? 'italic' : 'normal';
        ctx.font = `${style} ${weight} ${cmd.size}px ${cmd.fontFamily || 'sans-serif'}`;
        if (cmd.bgColor) {
          const m = ctx.measureText(cmd.text);
          ctx.fillStyle = rgbaStr(cmd.bgColor);
          ctx.fillRect(cmd.x, cmd.y, m.width, cmd.size * 1.3);
        }
        ctx.fillStyle = rgbaStr(cmd.color);
        ctx.textBaseline = 'top';
        ctx.fillText(cmd.text, cmd.x, cmd.y);
        break;
      }
      case 'pixel': {
        ctx.fillStyle = rgbaStr(cmd.color);
        ctx.fillRect(cmd.x, cmd.y, 1, 1);
        break;
      }
      case 'surface': {
        ctx.save();
        if (cmd.alpha !== undefined && cmd.alpha < 255) {
          ctx.globalAlpha = cmd.alpha / 255;
        }
        ctx.translate(cmd.x, cmd.y);
        renderCommands(ctx, cmd.commands as PygameFrame['commands']);
        ctx.restore();
        break;
      }
    }
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const KEY_MAP: Record<string, number> = {
  ArrowUp: 273, ArrowDown: 274, ArrowRight: 275, ArrowLeft: 276,
  Backspace: 8, Tab: 9, Enter: 13, Escape: 27, ' ': 32,
  a: 97, b: 98, c: 99, d: 100, e: 101, f: 102, g: 103, h: 104, i: 105,
  j: 106, k: 107, l: 108, m: 109, n: 110, o: 111, p: 112, q: 113, r: 114,
  s: 115, t: 116, u: 117, v: 118, w: 119, x: 120, y: 121, z: 122,
  '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55, '8': 56, '9': 57,
  F1: 282, F2: 283, F3: 284, F4: 285, F5: 286, F6: 287,
  F7: 288, F8: 289, F9: 290, F10: 291, F11: 292, F12: 293,
  ShiftLeft: 304, ShiftRight: 303, ControlLeft: 306, ControlRight: 305,
  AltLeft: 308, AltRight: 307,
};

export default function PygameRenderer({ frame, onEvent }: PygameRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frame) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderCommands(ctx, frame.commands);
  }, [frame]);

  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);
    onEvent({ type: 'mousemove', ...pos });
  }, [getCanvasPos, onEvent]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);
    onEvent({ type: 'mousedown', ...pos, button: e.button });
  }, [getCanvasPos, onEvent]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);
    onEvent({ type: 'mouseup', ...pos, button: e.button });
  }, [getCanvasPos, onEvent]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const key = KEY_MAP[e.key] || KEY_MAP[e.code] || e.keyCode;
    onEvent({ type: 'keydown', key, char: e.key.length === 1 ? e.key : '' });
  }, [onEvent]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const key = KEY_MAP[e.key] || KEY_MAP[e.code] || e.keyCode;
    onEvent({ type: 'keyup', key });
  }, [onEvent]);

  return (
    <div className="flex items-center justify-center p-4 h-full">
      <div className="flex flex-col shadow-2xl rounded-lg overflow-hidden" style={{ maxWidth: '100%', maxHeight: '100%' }}>
        <div className="flex items-center h-8 px-2 bg-gradient-to-b from-[#e8e8e8] to-[#d0d0d0] border-b border-[#a0a0a0] select-none shrink-0">
          <div className="flex items-center gap-1.5 mr-3">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#dea123]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29]" />
          </div>
          <div className="flex-1 text-center text-[11px] text-[#4a4a4a] font-medium truncate">
            {frame.title || 'pygame window'}
          </div>
          <div className="w-12" />
        </div>
        <canvas
          ref={canvasRef}
          width={frame.width}
          height={frame.height}
          tabIndex={0}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          className="block outline-none cursor-crosshair"
          style={{
            maxWidth: '100%',
            height: 'auto',
            imageRendering: 'pixelated',
            backgroundColor: '#000',
          }}
        />
      </div>
    </div>
  );
}
