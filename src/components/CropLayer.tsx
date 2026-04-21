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
    const PLUS_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><line x1='12' y1='3' x2='12' y2='21' stroke='white' stroke-width='3' stroke-linecap='round'/><line x1='3' y1='12' x2='21' y2='12' stroke='white' stroke-width='3' stroke-linecap='round'/><line x1='12' y1='4' x2='12' y2='20' stroke='black' stroke-width='1.5' stroke-linecap='round'/><line x1='4' y1='12' x2='20' y2='12' stroke='black' stroke-width='1.5' stroke-linecap='round'/></svg>") 12 12, crosshair`;
    const prevHtml = document.documentElement.style.cursor;
    const prevBody = document.body.style.cursor;
    document.documentElement.style.setProperty('cursor', PLUS_CURSOR, 'important');
    document.body.style.setProperty('cursor', PLUS_CURSOR, 'important');

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
      document.documentElement.style.cursor = prevHtml;
      document.body.style.cursor = prevBody;
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
