import { useRef, useEffect, useState } from 'react';

/**
 * Slider — a draggable range control matching the original mkSl() style.
 * Props:
 *   min, max, step, initial  — range config
 *   fillColor, thumbColor    — colours
 *   label                    — left label text
 *   format(v)                — formats the displayed value
 *   onChange(v)              — called whenever value changes
 */
export default function Slider({ min, max, step, initial, fillColor, thumbColor, label, format, onChange }) {
  const [value, setValue] = useState(initial);
  const trackRef = useRef(null);
  const dragging = useRef(false);

  function clamp(v) {
    return Math.max(min, Math.min(max, v));
  }

  function snap(raw) {
    // snap to nearest step
    return clamp(Math.round((raw - min) / step) * step + min);
  }

  function setFromX(clientX) {
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + pct * (max - min);
    const snapped = snap(raw);
    setValue(snapped);
    onChange(snapped);
  }

  useEffect(() => {
    function onMove(e) {
      if (!dragging.current) return;
      setFromX(e.touches ? e.touches[0].clientX : e.clientX);
    }
    function onUp() { dragging.current = false; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="slr">
      <span className="sll">{label}</span>
      <div
        className="slt"
        ref={trackRef}
        onClick={e => setFromX(e.clientX)}
      >
        <div className="slf" style={{ width: `${pct}%`, background: fillColor }} />
        <div
          className="slh"
          style={{ left: `${pct}%`, background: thumbColor }}
          onMouseDown={e => { dragging.current = true; e.preventDefault(); }}
          onTouchStart={() => { dragging.current = true; }}
        />
      </div>
      <span className="slv" style={{ color: thumbColor }}>{format(value)}</span>
    </div>
  );
}
