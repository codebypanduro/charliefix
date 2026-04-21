import { useEffect, useState } from 'preact/hooks';
import type { Rect } from '../lib/captureImage';

type Props = {
  fullshot: boolean;
  onCrop: (rect: Rect) => void;
  onCancel: () => void;
};

type Point = { x: number; y: number };

export function CropLayer({ fullshot, onCrop, onCancel }: Props) {
  const [start, setStart] = useState<Point | null>(null);
  const [end, setEnd] = useState<Point | null>(null);

  useEffect(() => {
    if (fullshot) {
      onCrop({ x: 0, y: 0, w: window.innerWidth, h: window.innerHeight });
    }
  }, [fullshot]);

  useEffect(() => {
    if (fullshot) return;

    let s: Point | null = null;
    let e: Point | null = null;

    const down = (ev: MouseEvent) => {
      s = { x: ev.clientX, y: ev.clientY };
      e = { x: ev.clientX, y: ev.clientY };
      setStart(s);
      setEnd(e);
    };
    const move = (ev: MouseEvent) => {
      if (!s) return;
      e = { x: ev.clientX, y: ev.clientY };
      setEnd(e);
    };
    const up = () => {
      if (s && e) {
        const x = Math.min(s.x, e.x);
        const y = Math.min(s.y, e.y);
        const w = Math.abs(e.x - s.x);
        const h = Math.abs(e.y - s.y);
        if (w > 10 && h > 10) onCrop({ x, y, w, h });
        else onCancel();
      } else {
        onCancel();
      }
    };
    const esc = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onCancel();
    };

    window.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('keydown', esc);
    };
  }, [fullshot, onCrop, onCancel]);

  if (fullshot) return null;

  const rect = start && end ? {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y),
  } : null;

  return (
    <div class="c-crop-layer">
      <div class="c-crop-hint">
        <span>Drag to capture a region</span>
        <span class="kbd">Esc</span>
        <span>cancel</span>
      </div>
      {rect && rect.w > 4 && (
        <>
          <div
            class="c-crop-rect"
            style={{ top: rect.y, left: rect.x, width: rect.w, height: rect.h }}
          />
          <div
            class="c-crop-dims"
            style={{ top: rect.y + rect.h + 8, left: rect.x }}
          >
            {Math.round(rect.w)} × {Math.round(rect.h)}
          </div>
        </>
      )}
    </div>
  );
}
