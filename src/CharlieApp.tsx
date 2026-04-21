import { useEffect, useState } from 'preact/hooks';
import { Charlie } from './components/Charlie';
import { SelectionLayer } from './components/SelectionLayer';
import { Composer } from './components/Composer';
import { QueuePanel } from './components/QueuePanel';
import { PinsLayer } from './components/PinsLayer';
import { CropLayer } from './components/CropLayer';
import { ShotPastePanel } from './components/ShotPastePanel';
import { Icon } from './icons';
import { describeNode } from './lib/describeNode';
import { generateMarkdown } from './lib/promptGen';
import { loadQueue, saveQueue, type FixItem, type ShotMeta } from './lib/storage';
import { captureRegion, type Rect } from './lib/captureImage';
import { putImage, deleteImage } from './lib/imageStore';

type Mode = 'idle' | 'picking' | 'cropping' | 'fullshot';

type ComposerState =
  | { el: Element; imageId?: undefined; shotMeta?: undefined }
  | { el?: undefined; imageId: string; shotMeta: ShotMeta }
  | null;

export function CharlieApp({ accent }: { accent: string }) {
  const [mode, setMode] = useState<Mode>('idle');
  const [queueOpen, setQueueOpen] = useState(false);
  const [shotMenuOpen, setShotMenuOpen] = useState(false);
  const [items, setItems] = useState<FixItem[]>(() => loadQueue());
  const [composer, setComposer] = useState<ComposerState>(null);
  const [copied, setCopied] = useState(false);
  const [remindClear, setRemindClear] = useState(false);

  useEffect(() => {
    saveQueue(items);
  }, [items]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey) return;
      if (e.key === 'Escape') {
        if (composer) setComposer(null);
        else if (shotMenuOpen) setShotMenuOpen(false);
        else if (mode !== 'idle') setMode('idle');
        else if (queueOpen) setQueueOpen(false);
      } else if (e.key === 's' && mode === 'idle' && !composer) {
        setMode('picking');
      } else if (e.key === 'c' && mode === 'idle' && !composer) {
        setShotMenuOpen((o) => !o);
      } else if (e.key === 'l' && mode === 'idle' && !composer) {
        setQueueOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [mode, composer, queueOpen, shotMenuOpen]);

  const onPick = (el: Element) => {
    setMode('idle');
    setComposer({ el });
  };

  const onCrop = async (rect: Rect) => {
    setMode('idle');
    try {
      const blob = await captureRegion(rect);
      const imageId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await putImage(imageId, blob);
      setComposer({
        imageId,
        shotMeta: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: Math.round(rect.w),
          h: Math.round(rect.h),
        },
      });
    } catch (err) {
      console.error('[charlie-fixes] capture failed', err);
    }
  };

  const saveFix = (comment: string) => {
    if (!composer) return;
    let item: FixItem;
    if (composer.el) {
      const desc = describeNode(composer.el);
      item = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind: 'element',
        comment,
        targetTag: desc.tag,
        targetSelector: desc.selector,
        targetText: desc.text,
        createdAt: Date.now(),
        url: desc.url,
        route: desc.route,
        component: desc.component,
        componentChain: desc.componentChain,
        source: desc.source,
      };
    } else {
      item = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind: 'screenshot',
        comment,
        targetTag: '',
        targetSelector: '',
        targetText: '',
        createdAt: Date.now(),
        url: window.location.href,
        route: window.location.pathname,
        imageId: composer.imageId,
        shotMeta: composer.shotMeta,
      };
    }
    setItems((prev) => [...prev, item]);
    setComposer(null);
  };

  const deleteItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target?.imageId) deleteImage(target.imageId).catch(() => {});
      return prev.filter((it) => it.id !== id);
    });
  };

  const copyPrompt = async () => {
    const text = generateMarkdown(items);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard unavailable — fall back silently
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    if (items.length > 0) setRemindClear(true);
  };

  const clearAll = () => {
    for (const it of items) {
      if (it.imageId) deleteImage(it.imageId).catch(() => {});
    }
    setItems([]);
    setRemindClear(false);
  };

  const handoffDisabled = items.length === 0;
  const hasImages = items.some((it) => it.imageId);

  const mood =
    mode === 'picking' ? 'targeting' :
    mode === 'cropping' || mode === 'fullshot' ? 'targeting' :
    composer ? 'happy' : 'idle';

  return (
    <>
      <style>{`#charlie-fixes-root { --c-accent: ${accent}; }`}</style>

      <div class="charlie-bar">
        <div class="c-mascot-slot">
          <Charlie mood={mood} size={36} />
        </div>
        <div class="c-divider" />
        <button
          class={`c-tool-btn ${mode === 'picking' ? 'active' : ''}`}
          onClick={() => setMode(mode === 'picking' ? 'idle' : 'picking')}
          title="Select an element (S)"
        >
          {Icon.cursor} Select <span class="kbd">S</span>
        </button>
        <div class="c-tool-wrap">
          <button
            class={`c-tool-btn ${mode === 'cropping' || mode === 'fullshot' || shotMenuOpen ? 'active' : ''}`}
            onClick={() => setShotMenuOpen((o) => !o)}
            title="Screenshot (C)"
          >
            {Icon.camera} Screenshot <span class="kbd">C</span>
          </button>
          {shotMenuOpen && (
            <>
              <div class="c-popover-backdrop" onClick={() => setShotMenuOpen(false)} />
              <div class="c-popover" role="menu">
                <button
                  class="c-popover-item"
                  onClick={() => {
                    setShotMenuOpen(false);
                    setMode('cropping');
                  }}
                >
                  <span class="c-popover-icon">{Icon.crop}</span>
                  <span class="c-popover-label">
                    <strong>Crop from area</strong>
                    <small>Drag a region to capture</small>
                  </span>
                </button>
                <button
                  class="c-popover-item"
                  onClick={() => {
                    setShotMenuOpen(false);
                    setMode('fullshot');
                  }}
                >
                  <span class="c-popover-icon">{Icon.camera}</span>
                  <span class="c-popover-label">
                    <strong>Full image</strong>
                    <small>Capture the whole viewport</small>
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
        <div class="c-divider" />
        <button
          class={`c-tool-btn c-queue-btn ${queueOpen ? 'active' : ''}`}
          onClick={() => setQueueOpen(!queueOpen)}
          title="Open fix list (L)"
        >
          {Icon.list} Fixes
          {items.length > 0 && <span class="c-count-badge">{items.length}</span>}
        </button>
        <button
          class="c-tool-btn c-primary-cta"
          onClick={copyPrompt}
          disabled={handoffDisabled}
          title="Copy prompt to clipboard"
        >
          {copied ? Icon.check : Icon.arrow} {copied ? 'Copied!' : 'Hand off'}
        </button>
      </div>

      {remindClear && items.length > 0 && hasImages && (
        <ShotPastePanel
          items={items}
          onClear={clearAll}
          onDismiss={() => setRemindClear(false)}
        />
      )}
      {remindClear && items.length > 0 && !hasImages && (
        <div class="c-clear-reminder" role="status">
          <span>Prompt copied — clear the fix list when you're done?</span>
          <button class="c-btn-sm primary" onClick={clearAll}>
            {Icon.trash} Clear list
          </button>
          <button class="c-btn-sm ghost" onClick={() => setRemindClear(false)} title="Dismiss">
            {Icon.x}
          </button>
        </div>
      )}

      <PinsLayer
        composerEl={composer?.el ?? null}
        items={items}
        onPinClick={() => setQueueOpen(true)}
      />

      {mode === 'picking' && (
        <SelectionLayer onPick={onPick} onCancel={() => setMode('idle')} />
      )}

      {(mode === 'cropping' || mode === 'fullshot') && (
        <CropLayer
          fullshot={mode === 'fullshot'}
          onCrop={onCrop}
          onCancel={() => setMode('idle')}
        />
      )}

      {composer && (
        <Composer
          el={composer.el}
          imageId={composer.imageId}
          shotMeta={composer.shotMeta}
          onSave={saveFix}
          onCancel={() => {
            if (composer.imageId) deleteImage(composer.imageId).catch(() => {});
            setComposer(null);
          }}
        />
      )}

      {queueOpen && (
        <QueuePanel
          items={items}
          onDelete={deleteItem}
          onEdit={(id, comment) =>
            setItems((p) => p.map((it) => (it.id === id ? { ...it, comment } : it)))
          }
          onClear={clearAll}
          onClose={() => setQueueOpen(false)}
          onCopy={copyPrompt}
          copied={copied}
        />
      )}
    </>
  );
}
