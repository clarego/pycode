import type { TkWidgetNode } from '../../hooks/usePyodide';

interface CanvasItem {
  id: number;
  type: string;
  coords: number[];
  fill?: string;
  outline?: string;
  width?: string;
  text?: string;
  font?: string;
  anchor?: string;
  dash?: string;
}

interface TkinterCanvasProps {
  node: TkWidgetNode;
}

export default function TkinterCanvas({ node }: TkinterCanvasProps) {
  const items = (node.canvasItems || []) as unknown as CanvasItem[];
  const w = (node.config.width as number) || 300;
  const h = (node.config.height as number) || 200;
  const bg = (node.config.bg as string) || (node.config.background as string) || '#fff';

  return (
    <svg
      width={w}
      height={h}
      style={{
        backgroundColor: bg,
        border: '2px inset #c0c0c0',
        borderRadius: 1,
        display: 'block',
      }}
    >
      {items.map(item => <CanvasShape key={item.id} item={item} />)}
    </svg>
  );
}

function CanvasShape({ item }: { item: CanvasItem }) {
  const c = item.coords || [];
  const strokeWidth = parseFloat(item.width || '1') || 1;
  const fill = item.fill || 'transparent';
  const outline = item.outline || (item.type === 'line' ? '#000' : (fill === 'transparent' ? '#000' : 'transparent'));

  switch (item.type) {
    case 'line': {
      if (c.length >= 4) {
        const points = [];
        for (let i = 0; i < c.length; i += 2) {
          points.push(`${c[i]},${c[i + 1]}`);
        }
        return (
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke={item.fill || '#000'}
            strokeWidth={strokeWidth}
            strokeDasharray={item.dash || undefined}
          />
        );
      }
      return null;
    }

    case 'rectangle': {
      if (c.length >= 4) {
        const x = Math.min(c[0], c[2]);
        const y = Math.min(c[1], c[3]);
        const w = Math.abs(c[2] - c[0]);
        const h = Math.abs(c[3] - c[1]);
        return (
          <rect
            x={x} y={y} width={w} height={h}
            fill={fill === '' ? 'transparent' : fill}
            stroke={outline}
            strokeWidth={outline !== 'transparent' ? strokeWidth : 0}
          />
        );
      }
      return null;
    }

    case 'oval': {
      if (c.length >= 4) {
        const cx = (c[0] + c[2]) / 2;
        const cy = (c[1] + c[3]) / 2;
        const rx = Math.abs(c[2] - c[0]) / 2;
        const ry = Math.abs(c[3] - c[1]) / 2;
        return (
          <ellipse
            cx={cx} cy={cy} rx={rx} ry={ry}
            fill={fill === '' ? 'transparent' : fill}
            stroke={outline}
            strokeWidth={outline !== 'transparent' ? strokeWidth : 0}
          />
        );
      }
      return null;
    }

    case 'polygon': {
      if (c.length >= 6) {
        const points = [];
        for (let i = 0; i < c.length; i += 2) {
          points.push(`${c[i]},${c[i + 1]}`);
        }
        return (
          <polygon
            points={points.join(' ')}
            fill={fill === '' ? '#000' : fill}
            stroke={outline}
            strokeWidth={outline !== 'transparent' ? strokeWidth : 0}
          />
        );
      }
      return null;
    }

    case 'arc': {
      if (c.length >= 4) {
        const cx = (c[0] + c[2]) / 2;
        const cy = (c[1] + c[3]) / 2;
        const rx = Math.abs(c[2] - c[0]) / 2;
        const ry = Math.abs(c[3] - c[1]) / 2;
        return (
          <ellipse
            cx={cx} cy={cy} rx={rx} ry={ry}
            fill={fill === '' ? 'transparent' : fill}
            stroke={outline || '#000'}
            strokeWidth={strokeWidth}
          />
        );
      }
      return null;
    }

    case 'text': {
      if (c.length >= 2) {
        const anchor = item.anchor || 'center';
        let textAnchor: 'start' | 'middle' | 'end' = 'middle';
        if (anchor === 'w' || anchor === 'nw' || anchor === 'sw') textAnchor = 'start';
        if (anchor === 'e' || anchor === 'ne' || anchor === 'se') textAnchor = 'end';

        let fontSize = 12;
        let fontFamily = 'sans-serif';
        if (item.font) {
          const fontMatch = item.font.match(/\{?([^}]+)\}?\s+(\d+)/);
          if (fontMatch) {
            fontFamily = fontMatch[1];
            fontSize = parseInt(fontMatch[2]) || 12;
          }
        }

        return (
          <text
            x={c[0]} y={c[1]}
            textAnchor={textAnchor}
            dominantBaseline="middle"
            fill={item.fill || '#000'}
            fontSize={fontSize}
            fontFamily={fontFamily}
          >
            {item.text || ''}
          </text>
        );
      }
      return null;
    }

    default:
      return null;
  }
}
