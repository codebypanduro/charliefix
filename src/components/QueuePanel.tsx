import { useState } from 'preact/hooks';
import { Charlie } from './Charlie';
import { Icon } from '../icons';
import type { FixItem } from '../lib/storage';

type Props = {
  items: FixItem[];
  onDelete: (id: string) => void;
  onEdit: (id: string, comment: string) => void;
  onClear: () => void;
  onClose: () => void;
  onCopy: () => void;
  copied: boolean;
};

export function QueuePanel({ items, onDelete, onEdit, onClear, onClose, onCopy, copied }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  return (
    <div class="c-queue">
      <div class="c-queue-head">
        <h3>Fix list</h3>
        <span class="count-pill">{items.length}</span>
        {items.length > 0 && (
          <button onClick={onClear} title="Clear all">
            {Icon.trash}
          </button>
        )}
        <button onClick={onClose} title="Close">
          {Icon.x}
        </button>
      </div>
      <div class="c-queue-list">
        {items.length === 0 ? (
          <div class="c-empty">
            <div class="charlie-empty">
              <Charlie mood="idle" size={52} />
            </div>
            <h4>No fixes yet</h4>
            <p>
              Click <strong>Select</strong> in the toolbar, then click any element on the page to
              start pinching out what needs to change.
            </p>
          </div>
        ) : (
          items.map((it, i) => (
            <div key={it.id} class={`c-item ${editingId === it.id ? 'editing' : ''}`}>
              <div class="c-item-num">{i + 1}</div>
              <div class="c-item-body">
                <div class="c-item-target">
                  <span class="tag">&lt;{it.targetTag}&gt;</span>&nbsp;{it.targetSelector}
                </div>
                {editingId === it.id ? (
                  <textarea
                    class="c-item-edit"
                    value={editText}
                    autoFocus
                    onInput={(e) => setEditText((e.currentTarget as HTMLTextAreaElement).value)}
                    onBlur={() => {
                      if (editText.trim()) onEdit(it.id, editText.trim());
                      setEditingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (editText.trim()) onEdit(it.id, editText.trim());
                        setEditingId(null);
                      } else if (e.key === 'Escape') {
                        setEditingId(null);
                      }
                    }}
                  />
                ) : (
                  <div class="c-item-comment">{it.comment}</div>
                )}
              </div>
              <div class="c-item-actions">
                <button
                  onClick={() => {
                    setEditingId(it.id);
                    setEditText(it.comment);
                  }}
                  title="Edit"
                >
                  {Icon.edit}
                </button>
                <button class="del" onClick={() => onDelete(it.id)} title="Delete">
                  {Icon.trash}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {items.length > 0 && (
        <div class="c-queue-foot">
          <button class="c-btn-sm primary full" onClick={onCopy}>
            {copied ? Icon.check : Icon.copy}
            {copied ? ' Copied!' : ' Copy prompt'}
          </button>
        </div>
      )}
    </div>
  );
}
