import { useEffect, useState } from 'preact/hooks';
import { Charlie } from './components/Charlie';
import { SelectionLayer } from './components/SelectionLayer';
import { Composer } from './components/Composer';
import { QueuePanel } from './components/QueuePanel';
import { PinsLayer } from './components/PinsLayer';
import { Icon } from './icons';
import { describeNode } from './lib/describeNode';
import { generateMarkdown } from './lib/promptGen';
import { loadQueue, saveQueue, type FixItem } from './lib/storage';

type Mode = 'idle' | 'picking';

export function CharlieApp({ accent }: { accent: string }) {
  const [mode, setMode] = useState<Mode>('idle');
  const [queueOpen, setQueueOpen] = useState(false);
  const [items, setItems] = useState<FixItem[]>(() => loadQueue());
  const [composerEl, setComposerEl] = useState<Element | null>(null);
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
        if (composerEl) setComposerEl(null);
        else if (mode !== 'idle') setMode('idle');
        else if (queueOpen) setQueueOpen(false);
      } else if (e.key === 's' && mode === 'idle' && !composerEl) {
        setMode('picking');
      } else if (e.key === 'l' && mode === 'idle' && !composerEl) {
        setQueueOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [mode, composerEl, queueOpen]);

  const onPick = (el: Element) => {
    setMode('idle');
    setComposerEl(el);
  };

  const saveFix = (comment: string) => {
    if (!composerEl) return;
    const desc = describeNode(composerEl);
    const item: FixItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
    setItems((prev) => [...prev, item]);
    setComposerEl(null);
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
    setItems([]);
    setRemindClear(false);
  };

  const handoffDisabled = items.length === 0;

  const mood = mode === 'picking' ? 'targeting' : composerEl ? 'happy' : 'idle';

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

      {remindClear && items.length > 0 && (
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
        composerEl={composerEl}
        items={items}
        onPinClick={() => setQueueOpen(true)}
      />

      {mode === 'picking' && (
        <SelectionLayer onPick={onPick} onCancel={() => setMode('idle')} />
      )}

      {composerEl && (
        <Composer el={composerEl} onSave={saveFix} onCancel={() => setComposerEl(null)} />
      )}

      {queueOpen && (
        <QueuePanel
          items={items}
          onDelete={(id) => setItems((p) => p.filter((it) => it.id !== id))}
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
