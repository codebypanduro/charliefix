import { useEffect, useState } from 'preact/hooks';
import { Charlie } from './Charlie';
import { Icon } from '../icons';
import type { FixItem } from '../lib/storage';
import { generateMarkdown } from '../lib/promptGen';
import { getObjectUrl } from '../lib/imageStore';

function Thumb({ imageId }: { imageId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getObjectUrl(imageId).then((u) => {
      if (!cancelled && u) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [imageId]);
  if (!url) return <div class="c-item-thumb c-item-thumb-empty" />;
  return (
    <div class="c-item-thumb">
      <img src={url} alt="Screenshot" />
    </div>
  );
}

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
  const [view, setView] = useState<'list' | 'preview'>('list');

  const preview = view === 'preview';

  return (
    <div class="c-queue">
      <div class="c-queue-head">
        <h3>{preview ? 'Prompt preview' : 'Fix list'}</h3>
        <span class="count-pill">{items.length}</span>
        {items.length > 0 && (
          <button
            class={preview ? 'active' : ''}
            onClick={() => setView(preview ? 'list' : 'preview')}
            title={preview ? 'Back to list' : 'Preview prompt'}
          >
            {preview ? Icon.list : Icon.eye}
          </button>
        )}
        {items.length > 0 && !preview && (
          <button onClick={onClear} title="Clear all">
            {Icon.trash}
          </button>
        )}
        <button onClick={onClose} title="Close">
          {Icon.x}
        </button>
      </div>

      {preview ? (
        <div class="c-queue-preview">
          <pre>{generateMarkdown(items)}</pre>
        </div>
      ) : (
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
                {it.imageId && <Thumb imageId={it.imageId} />}
                <div class="c-item-body">
                  <div class="c-item-target">
                    {it.targetSelector ? (
                      <>
                        <span class="tag">&lt;{it.targetTag}&gt;</span>&nbsp;{it.targetSelector}
                        {it.component && (
                          <>
                            &nbsp;·&nbsp;<span class="tag">{it.component}</span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <span class="tag">Screenshot</span>
                        {it.shotMeta && (
                          <>&nbsp;{it.shotMeta.w}×{it.shotMeta.h}</>
                        )}
                      </>
                    )}
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
      )}

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
