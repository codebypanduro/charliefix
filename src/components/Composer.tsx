import { useEffect, useRef, useState } from 'preact/hooks';
import { Charlie } from './Charlie';
import { Icon } from '../icons';
import { describeNode } from '../lib/describeNode';
import { getPreviewUrl } from '../lib/imageStore';
import type { ShotMeta } from '../lib/storage';

type Props = {
  el?: Element | null;
  imageId?: string;
  shotMeta?: ShotMeta;
  onSave: (text: string) => void;
  onCancel: () => void;
};

export function Composer({ el, imageId, shotMeta, onSave, onCancel }: Props) {
  const [text, setText] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const info = el ? describeNode(el) : null;

  useEffect(() => {
    textRef.current?.focus();
    const popW = 340;
    const popH = 260;
    let left: number;
    let top: number;
    if (el) {
      const r = el.getBoundingClientRect();
      left = r.right + 12;
      top = r.top;
      if (left + popW > window.innerWidth - 16) left = Math.max(16, r.left - popW - 12);
      if (top + popH > window.innerHeight - 16) top = Math.max(16, window.innerHeight - popH - 16);
      if (top < 16) top = 16;
    } else if (shotMeta) {
      left = shotMeta.x + shotMeta.w + 12;
      top = shotMeta.y;
      if (left + popW > window.innerWidth - 16) left = Math.max(16, shotMeta.x - popW - 12);
      if (top + popH > window.innerHeight - 16) top = Math.max(16, window.innerHeight - popH - 16);
      if (top < 16) top = 16;
    } else {
      left = Math.max(16, (window.innerWidth - popW) / 2);
      top = Math.max(16, (window.innerHeight - popH) / 2);
    }
    setPos({ top, left });
  }, [el, shotMeta]);

  useEffect(() => {
    if (!imageId) {
      setThumbUrl(null);
      return;
    }
    let cancelled = false;
    getPreviewUrl(imageId).then((url) => {
      if (!cancelled && url) setThumbUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [imageId]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter' && !e.shiftKey && document.activeElement === textRef.current) {
        e.preventDefault();
        if (text.trim()) onSave(text.trim());
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [text, onSave, onCancel]);

  return (
    <div class="c-composer" style={{ top: pos.top, left: pos.left }}>
      <div class="c-composer-head">
        <div class="c-mascot-mini">
          <Charlie mood="happy" size={22} />
        </div>
        {info ? (
          <div class="c-target-chip">
            <span class="tag">&lt;{info.tag}&gt;</span>
            {info.cls && <span class="cls">{info.cls}</span>}
          </div>
        ) : (
          <div class="c-target-chip">
            <span class="tag">Screenshot</span>
            {shotMeta && <span class="cls">{shotMeta.w}×{shotMeta.h}</span>}
          </div>
        )}
        <button class="c-target-close" onClick={onCancel} aria-label="Close">
          {Icon.x}
        </button>
      </div>
      {thumbUrl && (
        <div class="c-composer-shot">
          <img src={thumbUrl} alt="Captured region" />
        </div>
      )}
      <div class="c-composer-body">
        <textarea
          ref={textRef}
          placeholder="What should Charlie fix here?"
          value={text}
          onInput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)}
        />
      </div>
      <div class="c-composer-foot">
        <div class="hint">
          <span class="kbd">⏎</span> save
          <span class="kbd">esc</span> cancel
        </div>
        <div class="actions">
          <button class="c-btn-sm ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            class="c-btn-sm primary"
            disabled={!text.trim()}
            onClick={() => onSave(text.trim())}
          >
            Add fix
          </button>
        </div>
      </div>
    </div>
  );
}
