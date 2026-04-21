export type FixKind = 'element' | 'screenshot' | 'element+shot';

export type ShotMeta = { x: number; y: number; w: number; h: number };

export type FixItem = {
  id: string;
  kind: FixKind;
  comment: string;
  targetTag: string;
  targetSelector: string;
  targetText: string;
  createdAt: number;
  url?: string;
  route?: string;
  component?: string;
  componentChain?: string;
  source?: string;
  imageId?: string;
  shotMeta?: ShotMeta;
};

const KEY = 'charlie-fixes:queue';

export function loadQueue(): FixItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((it: FixItem) => ({ ...it, kind: it.kind ?? 'element' }));
  } catch {
    return [];
  }
}

export function saveQueue(items: FixItem[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // quota or disabled storage — fail silently
  }
}
