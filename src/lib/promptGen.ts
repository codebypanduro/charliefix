import type { FixItem } from './storage';

const INTRO =
  'The following fixes were collected from a live page using Charlie fixes. Please apply each change as specified. Where a CSS selector is given, locate the element and update it accordingly. Where a screenshot is referenced, the PNG file is attached alongside this prompt in the same directory.';

export function imageFilename(n: number): string {
  return `charlie-fix-${n}.png`;
}

export function orderedItems(items: FixItem[]): FixItem[] {
  const routes = new Set(items.map((it) => it.route).filter(Boolean));
  if (routes.size <= 1) return items.slice();

  const groups = new Map<string, FixItem[]>();
  for (const it of items) {
    const key = it.route || '(unknown)';
    const arr = groups.get(key) ?? [];
    arr.push(it);
    groups.set(key, arr);
  }
  const out: FixItem[] = [];
  for (const group of groups.values()) out.push(...group);
  return out;
}

function renderFix(it: FixItem, n: number, heading: string): string {
  const isShotOnly = it.kind === 'screenshot' && !it.targetSelector;
  const title = isShotOnly
    ? 'Screenshot region'
    : `\`${it.targetTag}\` — ${it.targetSelector}`;
  let out = `${heading} ${n}. ${title}\n\n`;

  if (!isShotOnly) {
    if (it.component) {
      const chain = it.componentChain && it.componentChain !== it.component
        ? ` (${it.componentChain})`
        : '';
      out += `**Component:** \`${it.component}\`${chain}\n\n`;
    }
    if (it.source) out += `**Source:** \`${it.source}\`\n\n`;
    if (it.targetSelector) out += `**Selector:** \`${it.targetSelector}\`\n\n`;
    if (it.targetText) out += `**Element text:** "${it.targetText}"\n\n`;
  }

  if (it.shotMeta) {
    const { w, h, x, y } = it.shotMeta;
    out += `**Region:** ${w}×${h} at (${x}, ${y})\n\n`;
  }

  out += `**Fix:** ${it.comment}\n\n`;

  if (it.imageId) {
    out += `![screenshot](./${imageFilename(n)})\n\n`;
  }

  out += `---\n\n`;
  return out;
}

export function generateMarkdown(items: FixItem[]): string {
  if (items.length === 0) return '';

  const routes = new Set(items.map((it) => it.route).filter(Boolean));
  const multiRoute = routes.size > 1;

  let out = `# Fix list\n\n${INTRO}\n\n`;

  if (!multiRoute) {
    const url = items.find((it) => it.url)?.url;
    if (url) out += `**URL:** ${url}\n\n`;
    items.forEach((it, i) => {
      out += renderFix(it, i + 1, '##');
    });
    return out.trimEnd();
  }

  const groups = new Map<string, FixItem[]>();
  for (const it of items) {
    const key = it.route || '(unknown)';
    const arr = groups.get(key) ?? [];
    arr.push(it);
    groups.set(key, arr);
  }

  let n = 0;
  for (const [route, group] of groups) {
    out += `## Page: ${route}\n\n`;
    const url = group.find((it) => it.url)?.url;
    if (url) out += `**URL:** ${url}\n\n`;
    for (const it of group) {
      n++;
      out += renderFix(it, n, '###');
    }
  }

  return out.trimEnd();
}
