import type { FixItem } from './storage';

const INTRO =
  'The following fixes were collected from a live page using Charlie fixes. Please apply each change as specified. Where a CSS selector is given, locate the element and update it accordingly.';

export function generateMarkdown(items: FixItem[]): string {
  if (items.length === 0) return '';
  let out = `# Fix list\n\n${INTRO}\n\n`;
  items.forEach((it, i) => {
    out += `## ${i + 1}. \`${it.targetTag}\` — ${it.targetSelector}\n\n`;
    if (it.targetSelector) out += `**Selector:** \`${it.targetSelector}\`\n\n`;
    if (it.targetText) out += `**Element text:** "${it.targetText}"\n\n`;
    out += `**Fix:** ${it.comment}\n\n---\n\n`;
  });
  return out.trimEnd();
}
