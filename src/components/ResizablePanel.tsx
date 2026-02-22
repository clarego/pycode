import { useCallback, useEffect, useRef, useState } from 'react';

interface ResizablePanelProps {
  left: React.ReactNode;
  right: React.ReactNode;
  direction: 'horizontal' | 'vertical';
  defaultRatio?: number;
  minRatio?: number;
  maxRatio?: number;
}

export default function ResizablePanel({
  left,
  right,
  direction,
  defaultRatio = 0.5,
  minRatio = 0.25,
  maxRatio = 0.75,
}: ResizablePanelProps) {
  const [ratio, setRatio] = useState(defaultRatio);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
  }, []);

  useEffect(() => {
    function handleMove(clientX: number, clientY: number) {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let newRatio: number;
      if (direction === 'horizontal') {
        newRatio = (clientX - rect.left) / rect.width;
      } else {
        newRatio = (clientY - rect.top) / rect.height;
      }
      setRatio(Math.min(maxRatio, Math.max(minRatio, newRatio)));
    }

    function handleMouseMove(e: MouseEvent) {
      handleMove(e.clientX, e.clientY);
    }

    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }

    function handleEnd() {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [direction, minRatio, maxRatio]);

  const isHorizontal = direction === 'horizontal';
  const leftSize = `${ratio * 100}%`;
  const rightSize = `${(1 - ratio) * 100}%`;

  return (
    <div
      ref={containerRef}
      className={`flex h-full w-full overflow-hidden ${isHorizontal ? 'flex-row' : 'flex-col'}`}
    >
      <div
        style={{ [isHorizontal ? 'width' : 'height']: leftSize }}
        className="overflow-hidden flex-shrink-0"
      >
        {left}
      </div>

      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`flex-shrink-0 relative group ${
          isHorizontal
            ? 'w-1.5 cursor-col-resize hover:bg-sky-500/30 active:bg-sky-500/50'
            : 'h-1.5 cursor-row-resize hover:bg-sky-500/30 active:bg-sky-500/50'
        } bg-slate-200 transition-colors`}
      >
        <div
          className={`absolute bg-sky-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
            isHorizontal
              ? 'w-1 h-8 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
              : 'h-1 w-8 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
          }`}
        />
      </div>

      <div
        style={{ [isHorizontal ? 'width' : 'height']: rightSize }}
        className="overflow-hidden flex-shrink-0"
      >
        {right}
      </div>
    </div>
  );
}
