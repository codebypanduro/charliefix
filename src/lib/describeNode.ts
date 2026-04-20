export type NodeInfo = {
  tag: string;
  id: string;
  cls: string;
  selector: string;
  text: string;
  dim: string;
};

export function isCharlieEl(el: Element | null): boolean {
  if (!el) return true;
  return !!el.closest('#charlie-fixes-root');
}

export function describeNode(el: Element): NodeInfo {
  const tag = el.tagName.toLowerCase();
  const id = (el as HTMLElement).id ? `#${(el as HTMLElement).id}` : '';
  const classes =
    el.classList.length > 0
      ? '.' + Array.from(el.classList).slice(0, 2).join('.')
      : '';
  const rect = el.getBoundingClientRect();

  const chain: string[] = [];
  let cur: Element | null = el;
  let depth = 0;
  while (cur && cur !== document.body && depth < 4) {
    let part = cur.tagName.toLowerCase();
    if ((cur as HTMLElement).id) {
      part += '#' + (cur as HTMLElement).id;
      chain.unshift(part);
      break;
    }
    if (cur.classList.length > 0) {
      const cls = Array.from(cur.classList)[0];
      if (cls) part += '.' + cls;
    }
    chain.unshift(part);
    cur = cur.parentElement;
    depth++;
  }

  const selector = chain.join(' > ');
  const text = ((el as HTMLElement).innerText || '').trim().slice(0, 80);
  const dim = `${Math.round(rect.width)}×${Math.round(rect.height)}`;

  return { tag, id, cls: classes, selector, text, dim };
}
