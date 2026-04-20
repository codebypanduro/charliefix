/* global React, Charlie, Icon, SelectionLayer, CropLayer, describeNode, isCharlieEl */

// Fake screenshot renderer — produces an SVG that resembles a captured region.
// Because we can't actually screenshot DOM without a big dependency, we render a
// stylized grayscale representation of elements inside the crop rect.
function renderFakeShot(rect, attachEl = null) {
  // rect: {x,y,w,h} in viewport coords OR null to use element bounds
  let area = rect;
  if (!area && attachEl) {
    const r = attachEl.getBoundingClientRect();
    area = { x: r.left, y: r.top, w: r.width, h: r.height };
  }
  if (!area) return null;

  // collect visible boxes intersecting rect
  const boxes = [];
  const all = document.querySelectorAll('body *');
  for (const el of all) {
    if (isCharlieEl(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    // intersection
    const ix = Math.max(area.x, r.left);
    const iy = Math.max(area.y, r.top);
    const ax = Math.min(area.x + area.w, r.right);
    const ay = Math.min(area.y + area.h, r.bottom);
    if (ax <= ix || ay <= iy) continue;
    const s = getComputedStyle(el);
    const bg = s.backgroundColor;
    const color = s.color;
    const tag = el.tagName.toLowerCase();
    const text = (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) ? el.textContent.trim() : '';
    const fontSize = parseFloat(s.fontSize) || 14;
    const fontWeight = s.fontWeight;
    const fontFamily = s.fontFamily;
    const radius = s.borderTopLeftRadius;
    boxes.push({
      x: r.left - area.x, y: r.top - area.y,
      w: r.width, h: r.height,
      bg, color, tag, text, fontSize, fontWeight, fontFamily, radius,
      area: r.width * r.height,
    });
  }
  boxes.sort((a, b) => b.area - a.area);

  const scale = Math.min(1, 360 / area.w);
  const vbW = area.w;
  const vbH = area.h;

  return {
    vbW, vbH, boxes, scale, rect: area,
  };
}

function FakeShot({ shot, maxW = 320 }) {
  if (!shot) return null;
  const { vbW, vbH, boxes } = shot;
  return (
    <svg className="cshot" viewBox={`0 0 ${vbW} ${vbH}`} style={{ maxWidth: maxW, width: '100%', height: 'auto', background: '#faf8f5' }} preserveAspectRatio="xMidYMid meet">
      {boxes.map((b, i) => {
        const bgOk = b.bg && b.bg !== 'rgba(0, 0, 0, 0)' && b.bg !== 'transparent';
        const r = parseFloat(b.radius) || 0;
        return (
          <g key={i}>
            {bgOk && <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={r} ry={r} fill={b.bg} />}
            {b.text && b.fontSize > 10 && (
              <text
                x={b.x + 4}
                y={b.y + b.fontSize + 4}
                fontFamily={b.fontFamily}
                fontSize={b.fontSize}
                fontWeight={b.fontWeight}
                fill={b.color}
                style={{ dominantBaseline: 'auto' }}
              >
                {b.text.slice(0, 40)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

window.renderFakeShot = renderFakeShot;
window.FakeShot = FakeShot;
