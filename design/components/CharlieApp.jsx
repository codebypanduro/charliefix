/* global React, ReactDOM, Charlie, Icon, SelectionLayer, CropLayer, Composer, QueuePanel, PromptModal, TweaksPanel, describeNode, renderFakeShot, FakeShot */

function generatePrompt(items, format = 'markdown') {
  const intro = "The following fixes were collected from a live page using Charlie fixes. Please apply each change as specified. Where a CSS selector is given, locate the element and update it accordingly. Screenshots are stylized representations of the captured region.";
  if (items.length === 0) return '';

  if (format === 'markdown') {
    let out = `# Fix list\n\n${intro}\n\n`;
    items.forEach((it, i) => {
      out += `## ${i + 1}. ${it.kind === 'screenshot' && !it.targetSelector ? 'Screenshot region' : `\`${it.targetTag}\` — ${it.targetSelector}`}\n\n`;
      if (it.targetSelector) out += `**Selector:** \`${it.targetSelector}\`\n\n`;
      if (it.targetText) out += `**Element text:** "${it.targetText}"\n\n`;
      if (it.kind === 'screenshot' && it.shotMeta) out += `**Region:** ${it.shotMeta.w}×${it.shotMeta.h} at (${it.shotMeta.x}, ${it.shotMeta.y})\n\n`;
      out += `**Fix:** ${it.comment}\n\n`;
      if (it.shot) out += `_[screenshot attached]_\n\n`;
      out += '---\n\n';
    });
    return out.trimEnd();
  }
  if (format === 'xml') {
    let out = `<fixes>\n  <context>${intro}</context>\n`;
    items.forEach((it, i) => {
      out += `  <fix index="${i + 1}" kind="${it.kind}">\n`;
      if (it.targetSelector) out += `    <selector>${it.targetSelector}</selector>\n`;
      if (it.targetTag) out += `    <tag>${it.targetTag}</tag>\n`;
      if (it.targetText) out += `    <text>${escapeXml(it.targetText)}</text>\n`;
      if (it.shotMeta) out += `    <region x="${it.shotMeta.x}" y="${it.shotMeta.y}" w="${it.shotMeta.w}" h="${it.shotMeta.h}" />\n`;
      out += `    <comment>${escapeXml(it.comment)}</comment>\n`;
      if (it.shot) out += `    <screenshot>attached</screenshot>\n`;
      out += `  </fix>\n`;
    });
    out += `</fixes>`;
    return out;
  }
  if (format === 'json') {
    const obj = {
      context: intro,
      fixes: items.map((it, i) => ({
        index: i + 1,
        kind: it.kind,
        selector: it.targetSelector || null,
        tag: it.targetTag || null,
        text: it.targetText || null,
        region: it.shotMeta || null,
        comment: it.comment,
        hasScreenshot: !!it.shot,
      })),
    };
    return JSON.stringify(obj, null, 2);
  }
  // prose
  let out = `${intro}\n\n`;
  items.forEach((it, i) => {
    const loc = it.targetSelector ? ` on the <${it.targetTag}> element matching "${it.targetSelector}"` : ' in the captured screenshot region';
    out += `(${i + 1}) ${it.comment}${loc}.\n`;
  });
  return out;
}

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
}

const REACTIONS = {
  pickingElement: ['Pick one!', 'Point me at it 🎯', "I'm watching..."],
  pickingScreenshot: ['Drag a box', 'Cropping time 📸'],
  added: ['Got it!', 'Noted ✏️', 'On the list', 'Saved', 'Nice fix!'],
  cleared: ['Fresh slate ✨', 'All clear'],
  copied: ['Copied! 🎉', 'Ready for the agent', 'Go paste me!'],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Main Charlie overlay app
function CharlieApp() {
  const [mode, setMode] = React.useState('idle'); // idle | picking | screenshot | fullshot | composing
  const [queueOpen, setQueueOpen] = React.useState(false);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [composer, setComposer] = React.useState(null); // { el?, rect?, shot?, shotMeta? }
  const [promptModal, setPromptModal] = React.useState(null);
  const [copied, setCopied] = React.useState(false);
  const [mood, setMood] = React.useState('idle');
  const [eyeTarget, setEyeTarget] = React.useState(null);
  const [reaction, setReaction] = React.useState(null);
  const reactionTimer = React.useRef(null);

  const [settings, setSettings] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('charlie-settings') || 'null') || {}; } catch { return {}; }
  });
  const merged = {
    barPos: 'bottom-center',
    accent: 'oklch(0.72 0.17 35)',
    selectStyle: 'dashed',
    promptFormat: 'markdown',
    ...settings,
  };

  React.useEffect(() => {
    localStorage.setItem('charlie-settings', JSON.stringify(merged));
    document.documentElement.style.setProperty('--c-accent-override', merged.accent);
  }, [JSON.stringify(merged)]);

  const showReaction = (msg) => {
    setReaction(msg);
    clearTimeout(reactionTimer.current);
    reactionTimer.current = setTimeout(() => setReaction(null), 2400);
  };

  // Listen for tweak mode toggle from host
  React.useEffect(() => {
    const handler = (e) => {
      if (!e.data) return;
      if (e.data.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  // Persist tweak edits
  React.useEffect(() => {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: merged }, '*');
  }, [JSON.stringify(merged)]);

  // Global keyboard shortcuts
  React.useEffect(() => {
    const key = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
      if (e.key === 'Escape') {
        if (composer) setComposer(null);
        else if (mode !== 'idle') setMode('idle');
        else if (queueOpen) setQueueOpen(false);
      } else if (e.key === 's' && !e.metaKey && !e.ctrlKey && mode === 'idle' && !composer) {
        setMode('picking');
      } else if (e.key === 'c' && !e.metaKey && !e.ctrlKey && mode === 'idle' && !composer) {
        setMode('screenshot');
      } else if (e.key === 'l' && !e.metaKey && !e.ctrlKey && mode === 'idle' && !composer) {
        setQueueOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [mode, composer, queueOpen]);

  const onPickElement = (el, point) => {
    setMode('idle');
    setComposer({ el });
    setMood('happy');
  };

  const onCrop = (rect) => {
    const shot = renderFakeShot(rect);
    setMode('idle');
    setComposer({
      rect,
      shot,
      shotMeta: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.w), h: Math.round(rect.h) },
    });
    setMood('excited');
  };

  const saveComposer = (text) => {
    const desc = composer.el ? describeNode(composer.el) : null;
    const newItem = {
      id: Date.now() + Math.random(),
      kind: composer.shot ? (composer.el ? 'element+shot' : 'screenshot') : 'element',
      comment: text,
      targetTag: desc?.tag || null,
      targetSelector: desc?.selector || null,
      targetText: desc?.text || null,
      shot: composer.shot || null,
      shotMeta: composer.shotMeta || null,
    };
    // capture element bounds for pin marker
    if (composer.el) {
      const r = composer.el.getBoundingClientRect();
      newItem.pin = {
        x: r.left + window.scrollX,
        y: r.top + window.scrollY,
        w: r.width, h: r.height,
      };
    }
    setItems((prev) => [...prev, newItem]);
    setComposer(null);
    setMood('happy');
    showReaction(pick(REACTIONS.added));
  };

  const copyPrompt = async () => {
    const text = generatePrompt(items, merged.promptFormat);
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(true);
    setMood('excited');
    showReaction(pick(REACTIONS.copied));
    setTimeout(() => setCopied(false), 1800);
  };

  const clearAll = () => {
    setItems([]);
    showReaction(pick(REACTIONS.cleared));
  };

  const editItem = (id, comment) => setItems((prev) => prev.map(it => it.id === id ? { ...it, comment } : it));
  const deleteItem = (id) => setItems((prev) => prev.filter(it => it.id !== id));

  // mascot moods
  let barMood = mood;
  if (composer) barMood = 'happy';
  if (mode === 'picking') barMood = 'targeting';
  if (mode === 'screenshot' || mode === 'fullshot') barMood = 'excited';
  if (promptModal) barMood = 'excited';

  return (
    <>
      <style>{`.charlie-root { --c-accent: ${merged.accent}; --c-accent-soft: color-mix(in oklch, ${merged.accent} 18%, transparent); }`}</style>

      {/* Pin markers for saved items */}
      {items.filter(it => it.pin).map((it, i) => (
        <React.Fragment key={it.id}>
          <div
            className="c-pin-outline"
            style={{
              top: it.pin.y - window.scrollY,
              left: it.pin.x - window.scrollX,
              width: it.pin.w,
              height: it.pin.h,
            }}
          />
          <div
            className="c-pin-marker"
            style={{
              top: it.pin.y - window.scrollY,
              left: it.pin.x - window.scrollX,
            }}
            title={it.comment}
            onClick={() => setQueueOpen(true)}
          >
            {items.indexOf(it) + 1}
          </div>
        </React.Fragment>
      ))}

      {/* Toolbar */}
      <div className="charlie-bar" data-pos={merged.barPos}>
        <div className="c-mascot-slot" style={{ background: merged.accent, position: 'relative' }}>
          <Charlie mood={barMood} eyeTarget={eyeTarget} size={36} />
          {reaction && <div className="c-reaction">{reaction}</div>}
        </div>
        <div className="c-divider" />
        <button
          className={`c-tool-btn ${mode === 'picking' ? 'active' : ''}`}
          onClick={() => setMode(mode === 'picking' ? 'idle' : 'picking')}
          title="Select an element (S)"
        >
          {Icon.cursor} Select <span className="kbd">S</span>
        </button>
        <button
          className={`c-tool-btn ${mode === 'screenshot' ? 'active' : ''}`}
          onClick={() => setMode(mode === 'screenshot' ? 'idle' : 'screenshot')}
          title="Crop a region (C)"
        >
          {Icon.crop} Crop <span className="kbd">C</span>
        </button>
        <button
          className={`c-tool-btn ${mode === 'fullshot' ? 'active' : ''}`}
          onClick={() => setMode('fullshot')}
          title="Full viewport screenshot"
        >
          {Icon.camera} Full
        </button>
        <div className="c-divider" />
        <button
          className={`c-tool-btn c-queue-btn ${queueOpen ? 'active' : ''}`}
          onClick={() => setQueueOpen(!queueOpen)}
          title="Open fix list (L)"
        >
          {Icon.list} Fixes
          {items.length > 0 && <span className="c-count-badge">{items.length}</span>}
        </button>
        <button
          className="c-tool-btn c-primary-cta"
          onClick={() => setPromptModal(generatePrompt(items, merged.promptFormat))}
          disabled={items.length === 0}
          title="Preview & copy prompt"
        >
          {Icon.arrow} Hand off
        </button>
      </div>

      {/* Selection overlay */}
      {mode === 'picking' && (
        <SelectionLayer
          selectStyle={merged.selectStyle}
          onPick={onPickElement}
          setEyeTarget={setEyeTarget}
          setMood={setMood}
        />
      )}
      {(mode === 'screenshot' || mode === 'fullshot') && (
        <CropLayer
          fullshot={mode === 'fullshot'}
          onCrop={onCrop}
          onCancel={() => setMode('idle')}
        />
      )}

      {composer && (
        <Composer
          anchor={composer}
          attachShot={composer.shot}
          onSave={saveComposer}
          onCancel={() => setComposer(null)}
        />
      )}

      {queueOpen && (
        <QueuePanel
          items={items}
          onDelete={deleteItem}
          onEdit={editItem}
          onClear={clearAll}
          onClose={() => setQueueOpen(false)}
          onCopy={copyPrompt}
          onPreview={() => setPromptModal(generatePrompt(items, merged.promptFormat))}
          promptFormat={merged.promptFormat}
          setPromptFormat={(v) => setSettings({ ...merged, promptFormat: v })}
          barPos={merged.barPos}
        />
      )}

      {promptModal && (
        <PromptModal
          text={promptModal}
          onClose={() => setPromptModal(null)}
          onCopy={copyPrompt}
          copied={copied}
        />
      )}

      {tweaksOpen && (
        <TweaksPanel settings={merged} setSettings={(s) => setSettings(s)} />
      )}
    </>
  );
}

window.CharlieApp = CharlieApp;
window.generatePrompt = generatePrompt;
