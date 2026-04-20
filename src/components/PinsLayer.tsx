import { useEffect, useState } from 'preact/hooks';
import type { FixItem } from '../lib/storage';

type Props = {
  composerEl: Element | null;
  items: FixItem[];
  onPinClick?: () => void;
};

export function PinsLayer({ composerEl, items, onPinClick }: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener('scroll', bump, true);
    window.addEventListener('resize', bump);
    const id = window.setInterval(bump, 250);
    return () => {
      window.removeEventListener('scroll', bump, true);
      window.removeEventListener('resize', bump);
      window.clearInterval(id);
    };
  }, []);

  const composerRect = composerEl?.getBoundingClientRect();

  const resolved = items
    .map((it, i) => {
      if (!it.targetSelector) return null;
      let el: Element | null = null;
      try {
        el = document.querySelector(it.targetSelector);
      } catch {
        return null;
      }
      if (!el) return null;
      return { item: it, index: i, rect: el.getBoundingClientRect() };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  return (
    <div class="c-pins-layer">
      {composerRect && (
        <div
          class="c-pin-outline active"
          style={{
            top: composerRect.top,
            left: composerRect.left,
            width: composerRect.width,
            height: composerRect.height,
          }}
        />
      )}
      {resolved.map(({ item, index, rect }) => (
        <>
          <div
            key={`o-${item.id}`}
            class="c-pin-outline"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
          />
          <div
            key={`p-${item.id}`}
            class="c-pin-marker"
            style={{ top: rect.top, left: rect.left }}
            title={item.comment}
            onClick={onPinClick}
          >
            {index + 1}
          </div>
        </>
      ))}
    </div>
  );
}
