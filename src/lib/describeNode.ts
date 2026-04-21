export type NodeInfo = {
  tag: string;
  id: string;
  cls: string;
  selector: string;
  text: string;
  dim: string;
  url: string;
  route: string;
  component?: string;
  componentChain?: string;
  source?: string;
};

export function isCharlieEl(el: Element | null): boolean {
  if (!el) return true;
  return !!el.closest('#charlie-fixes-root');
}

type FiberLike = {
  type?: unknown;
  return?: FiberLike | null;
  stateNode?: unknown;
  _debugSource?: { fileName?: string; lineNumber?: number; columnNumber?: number };
  elementType?: unknown;
};

function getFiber(el: Element): FiberLike | null {
  const keys = Object.keys(el);
  const key =
    keys.find((k) => k.startsWith('__reactFiber$')) ||
    keys.find((k) => k.startsWith('__reactInternalInstance$'));
  if (!key) return null;
  return (el as unknown as Record<string, FiberLike>)[key] ?? null;
}

function componentName(type: unknown): string | null {
  if (!type) return null;
  if (typeof type === 'string') return null;
  const t = type as {
    displayName?: string;
    name?: string;
    render?: unknown;
    type?: unknown;
  };
  if (t.displayName) return t.displayName;
  if (t.name && t.name !== '_default') return t.name;
  if (t.render) return componentName(t.render);
  if (t.type) return componentName(t.type);
  return null;
}

function findReactInfo(el: Element): {
  component?: string;
  componentChain?: string;
  source?: string;
} {
  try {
    const fiber = getFiber(el);
    if (!fiber) return {};
    const chain: string[] = [];
    let source: string | undefined;
    let cur: FiberLike | null = fiber;
    let depth = 0;
    while (cur && depth < 40) {
      const name = componentName(cur.type);
      if (name) {
        chain.push(name);
        if (!source && cur._debugSource?.fileName) {
          const ds = cur._debugSource;
          const file = ds.fileName || '';
          const short = file.replace(/^.*\/(src\/)/, '$1');
          source = ds.lineNumber ? `${short}:${ds.lineNumber}` : short;
        }
      }
      cur = cur.return ?? null;
      depth++;
    }
    if (chain.length === 0) return {};
    return {
      component: chain[0],
      componentChain: chain.slice(0, 4).reverse().join(' > '),
      source,
    };
  } catch {
    return {};
  }
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

  const react = findReactInfo(el);

  return {
    tag,
    id,
    cls: classes,
    selector,
    text,
    dim,
    url: location.href,
    route: location.pathname,
    ...react,
  };
}
