import { h, render } from 'preact';
import { CharlieApp } from './CharlieApp';
import styles from './styles.css?inline';

type CharlieConfig = {
  accent?: string;
  mount?: 'auto' | 'manual';
};

declare global {
  interface Window {
    __CHARLIE__?: CharlieConfig;
    CharlieFixes?: { mount: () => void; unmount: () => void };
  }
}

const DEFAULTS: Required<CharlieConfig> = {
  accent: 'oklch(0.72 0.17 35)',
  mount: 'auto',
};

let host: HTMLDivElement | null = null;

function mount(): void {
  if (host) return;
  const cfg: Required<CharlieConfig> = { ...DEFAULTS, ...(window.__CHARLIE__ || {}) };

  host = document.createElement('div');
  host.id = 'charlie-fixes-root';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  shadow.appendChild(styleEl);

  const appRoot = document.createElement('div');
  shadow.appendChild(appRoot);

  render(h(CharlieApp, { accent: cfg.accent }), appRoot);
}

function unmount(): void {
  if (!host) return;
  host.remove();
  host = null;
}

window.CharlieFixes = { mount, unmount };

const cfg = window.__CHARLIE__ || {};
if (cfg.mount !== 'manual') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
}

export { mount, unmount };
