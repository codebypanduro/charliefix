import { useEffect, useRef, useState } from 'preact/hooks';

type Mood = 'idle' | 'happy' | 'targeting';

export function Charlie({ mood = 'idle', size = 36 }: { mood?: Mood; size?: number }) {
  const [blinking, setBlinking] = useState(false);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      const delay = 2200 + Math.random() * 2800;
      t = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 140);
        loop();
      }, delay);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (mood !== 'targeting') {
      setPupilOffset({ x: 0, y: 0 });
      return;
    }
    const onMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const maxR = 1.2;
      setPupilOffset({
        x: (dx / len) * Math.min(maxR, len / 60),
        y: (dy / len) * Math.min(maxR, len / 60),
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mood]);

  const mouth =
    mood === 'happy' ? (
      <path d="M 14 22 Q 18 26 22 22" stroke="#1a0f08" stroke-width="1.6" stroke-linecap="round" fill="none" />
    ) : mood === 'targeting' ? (
      <circle cx="18" cy="23" r="1.3" fill="#1a0f08" />
    ) : (
      <path d="M 15 22.5 Q 18 24 21 22.5" stroke="#1a0f08" stroke-width="1.4" stroke-linecap="round" fill="none" />
    );

  const renderEye = (cx: number) => {
    if (mood === 'targeting') {
      return (
        <g>
          <circle cx={cx} cy={15} r={2.6} fill="#faf8f5" stroke="#1a0f08" stroke-width={0.8} />
          <circle
            class={`blink ${blinking ? 'closed' : ''}`}
            cx={cx + pupilOffset.x}
            cy={15 + pupilOffset.y}
            r={1.4}
            fill="#1a0f08"
          />
        </g>
      );
    }
    return (
      <ellipse
        class={`blink ${blinking ? 'closed' : ''}`}
        cx={cx}
        cy={15}
        rx={1.5}
        ry={2.1}
        fill="#1a0f08"
      />
    );
  };

  return (
    <svg ref={ref} class="charlie-face" viewBox="0 0 36 36" style={{ width: size, height: size }}>
      <path
        d="M 18 4 C 25 4 31 9 31 17 C 31 24 27 31 18 31 C 9 31 5 24 5 17 C 5 9 11 4 18 4 Z"
        fill="#faf8f5"
      />
      <ellipse cx={10} cy={21} rx={2} ry={1.3} fill="#ffb8a0" opacity={0.55} />
      <ellipse cx={26} cy={21} rx={2} ry={1.3} fill="#ffb8a0" opacity={0.55} />
      {renderEye(13)}
      {renderEye(23)}
      {mouth}
      <path d="M 17 4 Q 18 1.2 20 4" stroke="#1a0f08" stroke-width="1.3" stroke-linecap="round" fill="none" />
    </svg>
  );
}
