'use client';

import { useEffect } from 'react';

export type CharlieFixesProps = {
  accent?: string;
  enabled?: boolean;
};

export function CharlieFixes({ accent, enabled = true }: CharlieFixesProps): null {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    if (accent) {
      window.__CHARLIE__ = { ...(window.__CHARLIE__ || {}), accent };
    }

    let cancelled = false;
    import('charlie-fixes').then(() => {
      if (cancelled) {
        window.CharlieFixes?.unmount();
      }
    });

    return () => {
      cancelled = true;
      window.CharlieFixes?.unmount();
    };
  }, [accent, enabled]);

  return null;
}

export default CharlieFixes;
