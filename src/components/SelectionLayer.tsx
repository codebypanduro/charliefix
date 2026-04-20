import { useEffect, useState } from 'preact/hooks';
import { describeNode, isCharlieEl, type NodeInfo } from '../lib/describeNode';

type Props = {
  onPick: (el: Element) => void;
  onCancel: () => void;
};

export function SelectionLayer({ onPick, onCancel }: Props) {
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [info, setInfo] = useState<NodeInfo | null>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || isCharlieEl(el)) {
        setRect(null);
        setInfo(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      setInfo(describeNode(el));
    };
    const click = (e: MouseEvent) => {
      if (isCharlieEl(e.target as Element)) return;
      e.preventDefault();
      e.stopPropagation();
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || isCharlieEl(el)) return;
      onPick(el);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('click', click, true);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('click', click, true);
      window.removeEventListener('keydown', key);
    };
  }, [onPick, onCancel]);

  return (
    <div class="c-select-layer">
      {rect && (
        <>
          <div
            class="c-hover-ring"
            style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          />
          {info && (
            <div class="c-hover-label" style={{ top: Math.max(4, rect.top - 30), left: rect.left }}>
              <span class="tag">{info.tag}</span>
              {info.cls && <span class="cls">{info.cls}</span>}
              <span class="dim">{info.dim}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
