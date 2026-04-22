import html2canvas from 'html2canvas-pro';

export type Rect = { x: number; y: number; w: number; h: number };

async function withOverlayHidden<T>(fn: () => Promise<T>): Promise<T> {
  const root = document.getElementById('charlie-fixes-root') as HTMLElement | null;
  const prev = root?.style.visibility ?? '';
  if (root) root.style.visibility = 'hidden';
  try {
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    return await fn();
  } finally {
    if (root) root.style.visibility = prev;
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('toBlob returned null'));
    }, 'image/png');
  });
}

export async function captureRegion(rect: Rect): Promise<Blob> {
  return withOverlayHidden(async () => {
    const canvas = await html2canvas(document.body, {
      x: rect.x + window.scrollX,
      y: rect.y + window.scrollY,
      width: rect.w,
      height: rect.h,
      useCORS: true,
      backgroundColor: null,
      logging: false,
      scale: window.devicePixelRatio || 1,
    });
    return canvasToBlob(canvas);
  });
}

export async function captureViewport(): Promise<Blob> {
  return captureRegion({
    x: 0,
    y: 0,
    w: window.innerWidth,
    h: window.innerHeight,
  });
}
