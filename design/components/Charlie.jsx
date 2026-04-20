/* global React */
// Charlie mascot — friendly blob with expressive eyes
// Moods: idle | targeting | excited | thinking | happy | winking

const Charlie = ({ mood = 'idle', eyeTarget = null, size = 36 }) => {
  const [blinking, setBlinking] = React.useState(false);

  React.useEffect(() => {
    let t;
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

  // compute pupil offset from eye target (viewport coords)
  const [pupilOffset, setPupilOffset] = React.useState({ x: 0, y: 0 });
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!eyeTarget || mood !== 'targeting') {
      setPupilOffset({ x: 0, y: 0 });
      return;
    }
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = eyeTarget.x - cx;
    const dy = eyeTarget.y - cy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const maxR = 1.2;
    setPupilOffset({
      x: (dx / len) * Math.min(maxR, len / 60),
      y: (dy / len) * Math.min(maxR, len / 60),
    });
  }, [eyeTarget, mood]);

  const eyeStyle = { transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`, transition: 'transform 0.08s' };

  // mouth path by mood
  let mouth;
  if (mood === 'excited' || mood === 'happy') {
    mouth = <path d="M 14 22 Q 18 26 22 22" stroke="#1a0f08" strokeWidth="1.6" strokeLinecap="round" fill="none" />;
  } else if (mood === 'thinking') {
    mouth = <path d="M 15 23 Q 18 22.5 21 23" stroke="#1a0f08" strokeWidth="1.5" strokeLinecap="round" fill="none" />;
  } else if (mood === 'targeting') {
    mouth = <circle cx="18" cy="23" r="1.3" fill="#1a0f08" />;
  } else {
    mouth = <path d="M 15 22.5 Q 18 24 21 22.5" stroke="#1a0f08" strokeWidth="1.4" strokeLinecap="round" fill="none" />;
  }

  // eye rendering — targeting mode shows crosshair-style eyes; winking one eye closed
  const renderEye = (cx, isLeft) => {
    if (mood === 'winking' && isLeft) {
      return <path d={`M ${cx - 2.2} 15 Q ${cx} 16.5 ${cx + 2.2} 15`} stroke="#1a0f08" strokeWidth="1.6" fill="none" strokeLinecap="round" />;
    }
    if (mood === 'targeting') {
      return (
        <g>
          <circle cx={cx} cy="15" r="2.6" fill="#faf8f5" stroke="#1a0f08" strokeWidth="0.8" />
          <circle className="blink" cx={cx + pupilOffset.x} cy={15 + pupilOffset.y} r="1.4" fill="#1a0f08" />
        </g>
      );
    }
    return (
      <g>
        <ellipse className="blink" cx={cx} cy="15" rx="1.5" ry="2.1" fill="#1a0f08" style={eyeStyle} />
      </g>
    );
  };

  return (
    <svg
      ref={ref}
      className={`charlie-face ${blinking && mood !== 'winking' ? 'blinking' : ''}`}
      viewBox="0 0 36 36"
      style={{ width: size, height: size }}
    >
      {/* body blob */}
      <path
        d="M 18 4 C 25 4 31 9 31 17 C 31 24 27 31 18 31 C 9 31 5 24 5 17 C 5 9 11 4 18 4 Z"
        fill="#faf8f5"
      />
      {/* cheeks */}
      <ellipse cx="10" cy="21" rx="2" ry="1.3" fill="#ffb8a0" opacity="0.55" />
      <ellipse cx="26" cy="21" rx="2" ry="1.3" fill="#ffb8a0" opacity="0.55" />
      {/* eyes */}
      {renderEye(13, true)}
      {renderEye(23, false)}
      {/* mouth */}
      {mouth}
      {/* tuft — little hair */}
      <path d="M 17 4 Q 18 1.2 20 4" stroke="#1a0f08" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </svg>
  );
};

window.Charlie = Charlie;
