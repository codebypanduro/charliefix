import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../icons';
import type { FixItem } from '../lib/storage';
import { getImage, getObjectUrl } from '../lib/imageStore';
import { imageFilename, orderedItems } from '../lib/promptGen';

type Props = {
  items: FixItem[];
  onClear: () => void;
  onDismiss: () => void;
};

function ThumbRow({
  item,
  index,
  total,
}: {
  item: FixItem;
  index: number;
  total: number;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!item.imageId) return;
    let cancelled = false;
    getObjectUrl(item.imageId).then((u) => {
      if (!cancelled && u) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [item.imageId]);

  const copyImage = async () => {
    if (!item.imageId) return;
    const blob = await getImage(item.imageId);
    if (!blob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error('[charlie-fixes] clipboard image write failed', err);
    }
  };

  const download = async () => {
    if (!item.imageId) return;
    const blob = await getImage(item.imageId);
    if (!blob) return;
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = imageFilename(index + 1);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 0);
  };

  return (
    <div class="c-paste-row">
      <div class="c-paste-num">
        {index + 1}/{total}
      </div>
      <div class="c-paste-thumb">
        {url ? <img src={url} alt="" /> : null}
      </div>
      <div class="c-paste-meta">
        <div class="c-paste-title">
          {item.kind === 'screenshot' ? 'Screenshot region' : `<${item.targetTag}>`}
        </div>
        {item.shotMeta && (
          <div class="c-paste-sub">
            {item.shotMeta.w}×{item.shotMeta.h}
          </div>
        )}
      </div>
      <div class="c-paste-actions">
        <button
          class={`c-btn-sm primary ${copied ? 'ok' : ''}`}
          onClick={copyImage}
          title="Copy image to clipboard — then paste into Claude Code"
        >
          {copied ? Icon.check : Icon.copy}
          {copied ? ' Copied' : ' Copy image'}
        </button>
        <button
          class="c-btn-sm ghost"
          onClick={download}
          title={`Download ${imageFilename(index + 1)}`}
        >
          {Icon.download ?? Icon.arrow}
        </button>
      </div>
    </div>
  );
}

export function ShotPastePanel({ items, onClear, onDismiss }: Props) {
  const ordered = orderedItems(items);
  const shots = ordered.filter((it) => it.imageId);

  return (
    <div class="c-paste-panel" role="status">
      <div class="c-paste-head">
        <strong>Prompt copied</strong>
        <span class="c-paste-hint">
          Paste into Claude Code, then copy each screenshot below and paste it.
        </span>
        <button class="c-paste-close" onClick={onDismiss} aria-label="Dismiss">
          {Icon.x}
        </button>
      </div>
      <div class="c-paste-list">
        {shots.map((it) => {
          const index = ordered.indexOf(it);
          return (
            <ThumbRow key={it.id} item={it} index={index} total={ordered.length} />
          );
        })}
      </div>
      <div class="c-paste-foot">
        <button class="c-btn-sm primary" onClick={onClear}>
          {Icon.trash} Clear fix list
        </button>
      </div>
    </div>
  );
}
