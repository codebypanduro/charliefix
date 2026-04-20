/* global React, Charlie, Icon, SelectionLayer, CropLayer, describeNode, FakeShot, renderFakeShot, isCharlieEl */

// ——— Composer popover ———
const Composer = ({ anchor, attachShot, initial = '', onSave, onCancel, onRemoveShot }) => {
  const [text, setText] = React.useState(initial);
  const textRef = React.useRef(null);
  const popRef = React.useRef(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (textRef.current) textRef.current.focus();
  }, []);

  React.useEffect(() => {
    if (!popRef.current) return;
    const popW = 340, popH = 260;
    let top, left;
    if (anchor.el) {
      const r = anchor.el.getBoundingClientRect();
      left = r.right + 12;
      top = r.top;
      if (left + popW > window.innerWidth - 16) left = Math.max(16, r.left - popW - 12);
      if (top + popH > window.innerHeight - 16) top = Math.max(16, window.innerHeight - popH - 16);
      if (top < 16) top = 16;
    } else if (anchor.rect) {
      left = anchor.rect.x + anchor.rect.w + 12;
      top = anchor.rect.y;
      if (left + popW > window.innerWidth - 16) left = Math.max(16, anchor.rect.x - popW - 12);
    } else {
      left = (window.innerWidth - popW) / 2;
      top = (window.innerHeight - popH) / 2;
    }
    setPos({ top, left });
  }, [anchor]);

  React.useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
      else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (text.trim()) onSave(text.trim()); }
      else if (e.key === 'Enter' && !e.shiftKey && document.activeElement === textRef.current) {
        e.preventDefault(); if (text.trim()) onSave(text.trim());
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [text]);

  const nodeInfo = anchor.el ? describeNode(anchor.el) : null;

  return (
    <div className="c-composer" ref={popRef} style={{ top: pos.top, left: pos.left }}>
      <div className="c-composer-head">
        <div className="c-mascot-mini"><Charlie mood="happy" size={22} /></div>
        <div className="c-target-chip">
          {nodeInfo ? (
            <>
              <span className="tag">&lt;{nodeInfo.tag}&gt;</span>
              {nodeInfo.cls && <span className="cls">{nodeInfo.cls}</span>}
            </>
          ) : (
            <>📸 Region {anchor.rect ? `${Math.round(anchor.rect.w)}×${Math.round(anchor.rect.h)}` : ''}</>
          )}
        </div>
        <button className="c-target-close" onClick={onCancel} aria-label="Close">{Icon.x}</button>
      </div>
      <div className="c-composer-body">
        <textarea
          ref={textRef}
          placeholder="What should Charlie fix here?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {attachShot && (
          <div className="c-composer-preview">
            <span className="c-prev-label">screenshot</span>
            <FakeShot shot={attachShot} maxW={320} />
          </div>
        )}
      </div>
      <div className="c-composer-foot">
        <div className="hint">
          <span className="kbd">⏎</span> save
          <span className="kbd">esc</span> cancel
        </div>
        <div className="actions">
          <button className="c-btn-sm ghost" onClick={onCancel}>Cancel</button>
          <button className="c-btn-sm primary" disabled={!text.trim()} onClick={() => onSave(text.trim())}>Add fix</button>
        </div>
      </div>
    </div>
  );
};

// ——— Queue panel ———
const QueuePanel = ({ items, onDelete, onEdit, onClear, onClose, onCopy, onPreview, promptFormat, setPromptFormat, barPos }) => {
  // position panel relative to toolbar
  const style = (() => {
    if (barPos === 'bottom-center') return { bottom: 84, left: '50%', transform: 'translateX(-50%)' };
    if (barPos === 'bottom-right') return { bottom: 84, right: 24 };
    if (barPos === 'bottom-left') return { bottom: 84, left: 24 };
    if (barPos === 'top-center') return { top: 84, left: '50%', transform: 'translateX(-50%)' };
    return { bottom: 84, right: 24 };
  })();
  const [editingId, setEditingId] = React.useState(null);
  const [editText, setEditText] = React.useState('');

  return (
    <div className="c-queue" style={style}>
      <div className="c-queue-head">
        <h3>Fix list</h3>
        <span className="count-pill">{items.length}</span>
        {items.length > 0 && <button onClick={onClear} title="Clear all">{Icon.trash}</button>}
        <button onClick={onClose} title="Close">{Icon.x}</button>
      </div>
      <div className="c-queue-list">
        {items.length === 0 ? (
          <div className="c-empty">
            <div className="charlie-empty"><Charlie mood="idle" size={52} /></div>
            <h4>No fixes yet</h4>
            <p>Click <strong>Select</strong> or <strong>Screenshot</strong> in the toolbar to start pinching out what needs to change.</p>
          </div>
        ) : items.map((it, i) => (
          <div key={it.id} className={`c-item ${editingId === it.id ? 'editing' : ''}`}>
            <div className="c-item-num">{i + 1}</div>
            <div className="c-item-body">
              <div className={`c-item-target ${it.kind === 'screenshot' && !it.targetSelector ? 'scr' : ''}`}>
                {it.kind === 'screenshot' && !it.targetSelector ? (
                  <>📸 Screenshot • {it.shotMeta?.w}×{it.shotMeta?.h}</>
                ) : (
                  <><span className="tag">&lt;{it.targetTag}&gt;</span>&nbsp;{it.targetSelector}</>
                )}
              </div>
              {editingId === it.id ? (
                <textarea
                  className="c-item-edit"
                  value={editText}
                  autoFocus
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={() => { if (editText.trim()) onEdit(it.id, editText.trim()); setEditingId(null); }}
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
                <div className="c-item-comment">{it.comment}</div>
              )}
              {it.shot && (
                <div className="c-item-thumb">
                  <FakeShot shot={it.shot} maxW={240} />
                </div>
              )}
            </div>
            <div className="c-item-actions">
              <button onClick={() => { setEditingId(it.id); setEditText(it.comment); }} title="Edit">{Icon.edit}</button>
              <button className="del" onClick={() => onDelete(it.id)} title="Delete">{Icon.trash}</button>
            </div>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <div className="c-queue-foot">
          <div className="c-format-row">
            <label>Format</label>
            <select value={promptFormat} onChange={(e) => setPromptFormat(e.target.value)}>
              <option value="markdown">Markdown</option>
              <option value="xml">XML</option>
              <option value="json">JSON</option>
              <option value="prose">Plain prose</option>
            </select>
            <span style={{ flex: 1 }} />
          </div>
          <div className="c-queue-actions">
            <button className="c-btn-sm ghost" onClick={onPreview}>{Icon.list} Preview prompt</button>
            <button className="c-btn-sm primary" onClick={onCopy}>{Icon.copy} Copy prompt</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ——— Prompt preview modal ———
const PromptModal = ({ text, onClose, onCopy, copied }) => {
  return (
    <div className="c-prompt-modal" onClick={onClose}>
      <div className="c-prompt-card" onClick={(e) => e.stopPropagation()}>
        <div className="c-prompt-head">
          <div style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--c-accent)', display: 'grid', placeItems: 'center' }}>
            <Charlie mood="excited" size={22} />
          </div>
          <h3>Prompt ready to hand off</h3>
          <button className="c-btn-sm ghost" onClick={onClose}>{Icon.x}</button>
        </div>
        <pre className="c-prompt-body">{text}</pre>
        <div className="c-prompt-foot">
          <div className="meta">{text.split('\n').length} lines · {text.length} chars</div>
          <div className="actions">
            <button className="c-btn-sm ghost" onClick={onClose}>Close</button>
            <button className="c-btn-sm primary" onClick={onCopy}>
              {copied ? Icon.check : Icon.copy}
              {copied ? ' Copied' : ' Copy to clipboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ——— Tweaks panel ———
const TweaksPanel = ({ settings, setSettings }) => {
  const swatches = [
    { name: 'coral', color: 'oklch(0.72 0.17 35)' },
    { name: 'amber', color: 'oklch(0.78 0.16 75)' },
    { name: 'lime',  color: 'oklch(0.82 0.17 135)' },
    { name: 'sky',   color: 'oklch(0.72 0.15 240)' },
    { name: 'plum',  color: 'oklch(0.65 0.18 320)' },
  ];
  return (
    <div className="c-tweaks">
      <h4>Charlie tweaks</h4>
      <div className="c-tweak-row">
        <label className="c-tweak-label">Toolbar position</label>
        <div className="c-tweak-options">
          {['bottom-center', 'bottom-right', 'bottom-left', 'top-center'].map(p => (
            <button key={p} className={`c-tweak-pill ${settings.barPos === p ? 'active' : ''}`} onClick={() => setSettings({ ...settings, barPos: p })}>
              {p.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>
      <div className="c-tweak-row">
        <label className="c-tweak-label">Accent</label>
        <div className="c-tweak-swatches">
          {swatches.map(s => (
            <button
              key={s.name}
              className={`c-tweak-swatch ${settings.accent === s.color ? 'active' : ''}`}
              style={{ background: s.color }}
              onClick={() => setSettings({ ...settings, accent: s.color })}
              title={s.name}
            />
          ))}
        </div>
      </div>
      <div className="c-tweak-row">
        <label className="c-tweak-label">Selection style</label>
        <div className="c-tweak-options">
          {[['dashed', 'Dashed'], ['solid', 'Solid'], ['figma', 'Figma'], ['devtools', 'Devtools']].map(([v, l]) => (
            <button key={v} className={`c-tweak-pill ${settings.selectStyle === v ? 'active' : ''}`} onClick={() => setSettings({ ...settings, selectStyle: v })}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="c-tweak-row">
        <label className="c-tweak-label">Prompt format</label>
        <div className="c-tweak-options">
          {[['markdown', 'MD'], ['xml', 'XML'], ['json', 'JSON'], ['prose', 'Prose']].map(([v, l]) => (
            <button key={v} className={`c-tweak-pill ${settings.promptFormat === v ? 'active' : ''}`} onClick={() => setSettings({ ...settings, promptFormat: v })}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

window.Composer = Composer;
window.QueuePanel = QueuePanel;
window.PromptModal = PromptModal;
window.TweaksPanel = TweaksPanel;
