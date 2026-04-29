import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../icons';
import type { FixItem } from '../lib/storage';
import { getImage, getPreviewUrl } from '../lib/imageStore';
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
    getPreviewUrl(item.imageId).then((u) => {
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
          {item.kind === 'screenshot' ? 'Screenshot' : `<${item.targetTag}>`}
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
  const [step, setStep] = useState(0);
  const [stepBusy, setStepBusy] = useState(false);

  const copyNext = async () => {
    if (stepBusy) return;
    const idx = step >= shots.length ? 0 : step;
    const it = shots[idx];
    if (!it?.imageId) return;
    setStepBusy(true);
    try {
      const blob = await getImage(it.imageId);
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      }
      setStep(idx + 1);
    } catch (err) {
      console.error('[charlie-fixes] stepper copy failed', err);
    } finally {
      setStepBusy(false);
    }
  };

  const done = shots.length > 0 && step >= shots.length;
  const stepLabel = shots.length === 0
    ? ''
    : done
    ? 'All copied — restart'
    : `Copy image ${step + 1} of ${shots.length}`;

  return (
    <div class="c-paste-panel" role="status">
      <div class="c-paste-head">
        <strong>Prompt copied</strong>
        <span class="c-paste-hint">
          Paste the prompt into Claude Code, then copy each screenshot and paste it. The browser only holds one image at a time.
        </span>
        <button class="c-paste-close" onClick={onDismiss} aria-label="Dismiss">
          {Icon.x}
        </button>
      </div>
      {shots.length > 1 && (
        <div class="c-paste-stepper">
          <button
            class="c-btn-sm primary full"
            onClick={copyNext}
            disabled={stepBusy}
          >
            {done ? Icon.check : Icon.copy} {stepLabel}
          </button>
          <button
            class="c-btn-sm ghost"
            onClick={() => setStep(0)}
            disabled={step === 0 || stepBusy}
            title="Restart from image 1"
          >
            Reset
          </button>
        </div>
      )}
      {shots.length > 1 && step > 0 && !done && (
        <div class="c-paste-steptip">Paste into Claude Code, then click again for the next one.</div>
      )}
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
