export type FixItem = {
  id: string;
  comment: string;
  targetTag: string;
  targetSelector: string;
  targetText: string;
  createdAt: number;
};

const KEY = 'charlie-fixes:queue';

export function loadQueue(): FixItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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
