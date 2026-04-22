window.__CHARLIE__ = {
  accent: '#2d2a24',
  mount: 'auto',
};

(function () {
  const tabs = document.querySelectorAll('[data-tab]');
  const panels = document.querySelectorAll('[data-panel]');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      tabs.forEach((t) => t.setAttribute('aria-selected', t === tab ? 'true' : 'false'));
      panels.forEach((p) => {
        p.classList.toggle('active', p.getAttribute('data-panel') === target);
      });
    });
  });

  document.querySelectorAll('.code .copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = btn.parentElement.querySelector('pre')?.innerText ?? '';
      try {
        await navigator.clipboard.writeText(code);
        const prev = btn.textContent;
        btn.textContent = 'Copied';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = prev;
          btn.classList.remove('copied');
        }, 1400);
      } catch {
        /* clipboard blocked — no-op */
      }
    });
  });
})();
