/* global React, Charlie */
// Icons
const Icon = {
  cursor: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51z" /></svg>,
  camera: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
  crop: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" /><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" /></svg>,
  list: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></svg>,
  copy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: "2.5px", width: "12px", height: "12px" }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
};
window.Icon = Icon;

// ——— Utilities ———
// React fiber detection — reads __reactFiber$... key stamped by React dev/prod
function getReactFiber(el) {
  if (!el) return null;
  const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
  return key ? el[key] : null;
}
function detectReact(el) {
  const fiber = getReactFiber(el);
  if (!fiber) return null;
  const names = [];
  let cur = fiber;
  let depth = 0;
  while (cur && depth < 25) {
    const t = cur.type || cur.elementType;
    if (t && typeof t !== 'string') {
      let name = t.displayName || t.name;
      // unwrap forwardRef/memo
      if (!name && t.render) name = t.render.displayName || t.render.name;
      if (!name && t.type) name = t.type.displayName || t.type.name;
      if (name && name.length > 1 && name !== 'Unknown' && !names.includes(name)) {
        names.unshift(name);
      }
    }
    cur = cur.return;
    depth++;
  }
  if (names.length === 0) return null;
  // skip Charlie's own components
  const filtered = names.filter((n) => !['CharlieApp', 'SelectionLayer', 'Composer', 'QueuePanel', 'PromptModal', 'TweaksPanel', 'Charlie', 'FakeShot', 'CropLayer'].includes(n));
  if (filtered.length === 0) return null;
  // keep last 4 of chain, innermost first reversed to outer→inner
  return filtered.slice(-4).join(' › ');
}
function isReactApp() {
  return !!document.querySelector('[id], [class]') && !!(() => {
    const walk = document.body.querySelectorAll('*');
    for (let i = 0; i < Math.min(walk.length, 200); i++) {
      if (Object.keys(walk[i]).some((k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'))) return true;
    }
    return false;
  })();
}

function describeNode(el) {
  if (!el) return { tag: '', cls: '', selector: '', text: '', dim: '', react: null };
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const classes = el.classList && el.classList.length ?
  '.' + Array.from(el.classList).filter((c) => !c.startsWith('charlie-') && !c.startsWith('c-')).slice(0, 2).join('.') :
  '';
  const rect = el.getBoundingClientRect();
  // selector chain
  const chain = [];
  let cur = el;
  let depth = 0;
  while (cur && cur !== document.body && depth < 4) {
    let part = cur.tagName.toLowerCase();
    if (cur.id) {part += '#' + cur.id;chain.unshift(part);break;}
    if (cur.classList && cur.classList.length) {
      const cls = Array.from(cur.classList).filter((c) => !c.startsWith('charlie-') && !c.startsWith('c-'))[0];
      if (cls) part += '.' + cls;
    }
    chain.unshift(part);
    cur = cur.parentElement;
    depth++;
  }
  const selector = chain.join(' > ');
  const text = (el.innerText || '').trim().slice(0, 80);
  const dim = `${Math.round(rect.width)}×${Math.round(rect.height)}`;
  const react = detectReact(el);
  return { tag, id, cls: classes, selector, text, dim, react };
}

function isCharlieEl(el) {
  if (!el) return true;
  return !!el.closest('.charlie-root, #charlie-root');
}

// ——— Selection layer ———
const SelectionLayer = ({ selectStyle, onPick, setEyeTarget, setMood }) => {
  const [hover, setHover] = React.useState(null);
  const [rect, setRect] = React.useState(null);
  const [info, setInfo] = React.useState(null);

  React.useEffect(() => {
    setMood('targeting');
    const move = (e) => {
      setEyeTarget({ x: e.clientX, y: e.clientY });
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || isCharlieEl(el)) {
        setHover(null);setRect(null);setInfo(null);return;
      }
      setHover(el);
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      setInfo(describeNode(el));
    };
    const click = (e) => {
      if (isCharlieEl(e.target)) return;
      e.preventDefault();e.stopPropagation();
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || isCharlieEl(el)) return;
      onPick(el, { x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('click', click, true);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('click', click, true);
      setMood('idle');
      setEyeTarget(null);
    };
  }, []);

  return (
    <div className="c-select-layer">
      {rect &&
      <>
          <div
          className="c-hover-ring"
          data-style={selectStyle}
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} />
        
          {info &&
        <div
          className="c-hover-label"
          style={{
            top: Math.max(4, rect.top - 30),
            left: rect.left
          }}>
          
              <span className="tag">{info.tag}</span>
              {info.cls && <span className="cls">{info.cls}</span>}
              {info.react && <span style={{ color: '#a8c7ff', fontSize: 10 }}>⚛ {info.react}</span>}
              <span className="dim">{info.dim}</span>
            </div>
        }
        </>
      }
    </div>);

};

// ——— Crop layer ———
const CropLayer = ({ onCrop, onCancel, fullshot }) => {
  const [start, setStart] = React.useState(null);
  const [end, setEnd] = React.useState(null);

  React.useEffect(() => {
    if (fullshot) {
      // capture entire viewport immediately
      const r = { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };
      onCrop(r);
      return;
    }
    const down = (e) => {setStart({ x: e.clientX, y: e.clientY });setEnd({ x: e.clientX, y: e.clientY });};
    const move = (e) => {if (start) setEnd({ x: e.clientX, y: e.clientY });};
    const up = (e) => {
      if (start && end) {
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const w = Math.abs(end.x - start.x);
        const h = Math.abs(end.y - start.y);
        if (w > 10 && h > 10) onCrop({ x, y, w, h });else
        onCancel();
      } else onCancel();
    };
    const esc = (e) => {if (e.key === 'Escape') onCancel();};
    window.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('keydown', esc);
    };
  }, [start, end, fullshot]);

  if (fullshot) return null;

  const rect = start && end ? {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y)
  } : null;

  return (
    <div className="c-crop-layer">
      <div className="c-crop-hint">
        <span>Drag to capture a region</span>
        <span className="kbd">Esc</span>
        <span>cancel</span>
      </div>
      {rect && rect.w > 4 &&
      <>
          <div className="c-crop-rect" style={{ top: rect.y, left: rect.x, width: rect.w, height: rect.h }} />
          <div className="c-crop-dims" style={{ top: rect.y + rect.h + 8, left: rect.x }}>
            {Math.round(rect.w)} × {Math.round(rect.h)}
          </div>
        </>
      }
    </div>);

};

window.SelectionLayer = SelectionLayer;
window.CropLayer = CropLayer;
window.describeNode = describeNode;
window.isCharlieEl = isCharlieEl;
window.detectReact = detectReact;
window.isReactApp = isReactApp;