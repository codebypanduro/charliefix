import { useEffect, useRef, useState } from 'preact/hooks';
import { Charlie } from './Charlie';
import { Icon } from '../icons';
import { describeNode } from '../lib/describeNode';

type Props = {
  el: Element;
  onSave: (text: string) => void;
  onCancel: () => void;
};

export function Composer({ el, onSave, onCancel }: Props) {
  const [text, setText] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const info = describeNode(el);

  useEffect(() => {
    textRef.current?.focus();
    const popW = 340;
    const popH = 220;
    const r = el.getBoundingClientRect();
    let left = r.right + 12;
    let top = r.top;
    if (left + popW > window.innerWidth - 16) left = Math.max(16, r.left - popW - 12);
    if (top + popH > window.innerHeight - 16) top = Math.max(16, window.innerHeight - popH - 16);
    if (top < 16) top = 16;
    setPos({ top, left });
  }, [el]);

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
        <div class="c-target-chip">
          <span class="tag">&lt;{info.tag}&gt;</span>
          {info.cls && <span class="cls">{info.cls}</span>}
        </div>
        <button class="c-target-close" onClick={onCancel} aria-label="Close">
          {Icon.x}
        </button>
      </div>
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
