import { useEffect, useRef, useState } from 'react';

/**
 * Wraps children in a div that fades + slides into view the first time
 * the element enters the viewport (IntersectionObserver).
 *
 * Props:
 *   direction  – 'up' | 'down' | 'left' | 'right' | 'none'  (default 'up')
 *   delay      – ms before the transition starts              (default 0)
 *   duration   – transition duration in ms                    (default 650)
 *   threshold  – 0-1, how much of the element must be visible (default 0.12)
 *   className  – extra classes on the wrapper div
 *   as         – wrapper element tag                          (default 'div')
 */
export default function FadeIn({
  children,
  direction = 'up',
  delay = 0,
  duration = 650,
  threshold = 0.12,
  className = '',
  as: Tag = 'div',
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  const initial = {
    up:    'opacity-0 translate-y-7',
    down:  'opacity-0 -translate-y-7',
    left:  'opacity-0 translate-x-7',
    right: 'opacity-0 -translate-x-7',
    none:  'opacity-0',
  }[direction] ?? 'opacity-0 translate-y-7';

  return (
    <Tag
      ref={ref}
      style={{ transitionDuration: `${duration}ms`, transitionDelay: `${delay}ms` }}
      className={`transition-all ease-out ${visible ? 'opacity-100 translate-y-0 translate-x-0' : initial} ${className}`}
    >
      {children}
    </Tag>
  );
}
