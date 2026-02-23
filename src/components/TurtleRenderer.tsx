import { useMemo } from 'react';

export interface TurtleFrame {
  width: number;
  height: number;
  bgcolor: string;
  title: string;
  items: TurtleDrawItem[];
  turtles: TurtleCursor[];
}

interface TurtleDrawItem {
  type: string;
  [key: string]: unknown;
}

interface TurtleCursor {
  x: number;
  y: number;
  heading: number;
  visible: boolean;
  shape: string;
  color: string;
  fillColor: string;
  penSize: number;
  shapeSize: number[];
}

interface TurtleRendererProps {
  frame: TurtleFrame;
}

function toCanvas(x: number, y: number, w: number, h: number): [number, number] {
  return [w / 2 + x, h / 2 - y];
}

function renderTurtleShape(
  t: TurtleCursor,
  canvasW: number,
  canvasH: number,
  idx: number
): JSX.Element | null {
  if (!t.visible) return null;
  const [cx, cy] = toCanvas(t.x, t.y, canvasW, canvasH);
  const angle = -t.heading;
  const sw = (t.shapeSize?.[0] || 1) * 10;
  const sl = (t.shapeSize?.[1] || 1) * 10;

  if (t.shape === 'turtle') {
    return (
      <g key={`turtle-${idx}`} transform={`translate(${cx},${cy}) rotate(${angle})`}>
        <path
          d={`M ${sl},0
              C ${sl * 0.6},${-sw * 0.3} ${sl * 0.3},${-sw * 0.7} ${-sl * 0.1},${-sw * 0.9}
              C ${-sl * 0.3},${-sw * 0.5} ${-sl * 0.5},${-sw * 0.2} ${-sl * 0.4},0
              C ${-sl * 0.5},${sw * 0.2} ${-sl * 0.3},${sw * 0.5} ${-sl * 0.1},${sw * 0.9}
              C ${sl * 0.3},${sw * 0.7} ${sl * 0.6},${sw * 0.3} ${sl},0 Z`}
          fill={t.fillColor || t.color || 'black'}
          stroke={t.color || 'black'}
          strokeWidth={1}
        />
        <circle cx={sl * 1.1} cy={0} r={sw * 0.25} fill={t.fillColor || t.color || 'black'} stroke={t.color || 'black'} strokeWidth={0.5} />
      </g>
    );
  }

  if (t.shape === 'circle') {
    return (
      <circle
        key={`turtle-${idx}`}
        cx={cx}
        cy={cy}
        r={Math.max(sw, sl) * 0.6}
        fill={t.fillColor || t.color || 'black'}
        stroke={t.color || 'black'}
        strokeWidth={1}
      />
    );
  }

  if (t.shape === 'square') {
    const size = Math.max(sw, sl) * 0.8;
    return (
      <rect
        key={`turtle-${idx}`}
        x={cx - size / 2}
        y={cy - size / 2}
        width={size}
        height={size}
        fill={t.fillColor || t.color || 'black'}
        stroke={t.color || 'black'}
        strokeWidth={1}
        transform={`rotate(${angle},${cx},${cy})`}
      />
    );
  }

  if (t.shape === 'triangle') {
    return (
      <g key={`turtle-${idx}`} transform={`translate(${cx},${cy}) rotate(${angle})`}>
        <polygon
          points={`${sl},0 ${-sl * 0.6},${-sw * 0.7} ${-sl * 0.6},${sw * 0.7}`}
          fill={t.fillColor || t.color || 'black'}
          stroke={t.color || 'black'}
          strokeWidth={1}
        />
      </g>
    );
  }

  return (
    <g key={`turtle-${idx}`} transform={`translate(${cx},${cy}) rotate(${angle})`}>
      <polygon
        points={`${sl},0 ${-sl * 0.5},${-sw * 0.5} ${-sl * 0.3},0 ${-sl * 0.5},${sw * 0.5}`}
        fill={t.fillColor || t.color || 'black'}
        stroke={t.color || 'black'}
        strokeWidth={1}
      />
    </g>
  );
}

function renderDrawItem(
  item: TurtleDrawItem,
  canvasW: number,
  canvasH: number,
  idx: number
): JSX.Element | null {
  switch (item.type) {
    case 'line': {
      const [x1, y1] = toCanvas(item.x1 as number, item.y1 as number, canvasW, canvasH);
      const [x2, y2] = toCanvas(item.x2 as number, item.y2 as number, canvasW, canvasH);
      return (
        <line
          key={idx}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={item.color as string || 'black'}
          strokeWidth={item.width as number || 1}
          strokeLinecap="round"
        />
      );
    }
    case 'dot': {
      const [dx, dy] = toCanvas(item.x as number, item.y as number, canvasW, canvasH);
      return (
        <circle
          key={idx}
          cx={dx} cy={dy}
          r={(item.size as number || 4) / 2}
          fill={item.color as string || 'black'}
        />
      );
    }
    case 'polygon': {
      const pts = item.points as [number, number][];
      if (!pts || pts.length < 3) return null;
      const pointStr = pts
        .map(([px, py]) => {
          const [cx, cy] = toCanvas(px, py, canvasW, canvasH);
          return `${cx},${cy}`;
        })
        .join(' ');
      return (
        <polygon
          key={idx}
          points={pointStr}
          fill={item.color as string || 'black'}
          stroke="none"
        />
      );
    }
    case 'stamp': {
      const cursor: TurtleCursor = {
        x: item.x as number,
        y: item.y as number,
        heading: item.heading as number,
        visible: true,
        shape: item.shape as string || 'classic',
        color: item.color as string || 'black',
        fillColor: (item.fillColor as string) || (item.color as string) || 'black',
        penSize: 1,
        shapeSize: (item.shapeSize as number[]) || [1, 1, 1],
      };
      return renderTurtleShape(cursor, canvasW, canvasH, idx);
    }
    case 'text': {
      const [tx, ty] = toCanvas(item.x as number, item.y as number, canvasW, canvasH);
      const fontSize = item.size as number || 8;
      const fontFamily = (item.font as string) || 'Arial';
      const fontStyle = (item.style as string) || 'normal';
      const isBold = fontStyle.includes('bold');
      const isItalic = fontStyle.includes('italic');
      let anchor = 'start';
      if (item.align === 'center') anchor = 'middle';
      else if (item.align === 'right') anchor = 'end';
      return (
        <text
          key={idx}
          x={tx} y={ty}
          fill={item.color as string || 'black'}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontWeight={isBold ? 'bold' : 'normal'}
          fontStyle={isItalic ? 'italic' : 'normal'}
          textAnchor={anchor}
          dominantBaseline="auto"
        >
          {item.text as string}
        </text>
      );
    }
    default:
      return null;
  }
}

export default function TurtleRenderer({ frame }: TurtleRendererProps) {
  const { width, height, bgcolor, title, items, turtles } = frame;

  const drawnElements = useMemo(() => {
    return items.map((item, i) => renderDrawItem(item, width, height, i));
  }, [items, width, height]);

  const turtleCursors = useMemo(() => {
    return turtles.map((t, i) => renderTurtleShape(t, width, height, i));
  }, [turtles, width, height]);

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
            {title || 'Python Turtle Graphics'}
          </div>
          <div className="w-12" />
        </div>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{
            maxWidth: '100%',
            height: 'auto',
            backgroundColor: bgcolor || 'white',
            display: 'block',
          }}
        >
          {drawnElements}
          {turtleCursors}
        </svg>
      </div>
    </div>
  );
}
