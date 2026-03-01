import { useRef, useState, useEffect, useCallback, MouseEvent, TouchEvent } from 'react';

interface Point {
  x: number;
  y: number;
}

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  disabled?: boolean;
  paths?: number[][][];
  onPathsChange?: (paths: number[][][]) => void;
}

export default function DrawingCanvas({
  width = 300,
  height = 300,
  disabled = false,
  paths: externalPaths,
  onPathsChange,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<number[][][]>(externalPaths || []);
  const currentPath = useRef<number[][]>([]);

  useEffect(() => {
    if (externalPaths) {
      setPaths(externalPaths);
    }
  }, [externalPaths]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#eaf0ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const allPaths = [...paths, currentPath.current];
    for (const path of allPaths) {
      if (path.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(path[0][0], path[0][1]);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i][0], path[i][1]);
      }
      ctx.stroke();
    }
  }, [paths]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getPos = (e: MouseEvent | TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: MouseEvent | TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    const pos = getPos(e);
    currentPath.current = [[pos.x, pos.y]];
    setIsDrawing(true);
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    const pos = getPos(e);
    currentPath.current.push([pos.x, pos.y]);
    redraw();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.current.length > 1) {
      const newPaths = [...paths, currentPath.current];
      setPaths(newPaths);
      onPathsChange?.(newPaths);
    }
    currentPath.current = [];
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="bg-shelter-surface rounded-2xl border border-shelter-border touch-none w-full"
      style={{ aspectRatio: `${width}/${height}` }}
      onMouseDown={startDraw}
      onMouseMove={draw}
      onMouseUp={endDraw}
      onMouseLeave={endDraw}
      onTouchStart={startDraw}
      onTouchMove={draw}
      onTouchEnd={endDraw}
    />
  );
}
