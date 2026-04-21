import type { FixItem } from './storage';

const INTRO =
  'The following fixes were collected from a live page using Charlie fixes. Please apply each change as specified. Where a CSS selector is given, locate the element and update it accordingly.';

function renderFix(it: FixItem, n: number, heading: string): string {
  let out = `${heading} ${n}. \`${it.targetTag}\` — ${it.targetSelector}\n\n`;
  if (it.component) {
    const chain = it.componentChain && it.componentChain !== it.component
      ? ` (${it.componentChain})`
      : '';
    out += `**Component:** \`${it.component}\`${chain}\n\n`;
  }
  if (it.source) out += `**Source:** \`${it.source}\`\n\n`;
  if (it.targetSelector) out += `**Selector:** \`${it.targetSelector}\`\n\n`;
  if (it.targetText) out += `**Element text:** "${it.targetText}"\n\n`;
  out += `**Fix:** ${it.comment}\n\n---\n\n`;
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
