import { useEffect, useRef, useState } from "react";
type Vector = { x: number; y: number };
export default function Joystick({ onMove }: { onMove: (v: Vector) => void }) {
  const [offset, setOffset] = useState<Vector>({ x: 0, y: 0 });
  const pointer = useRef<number | null>(null);
  const stop = () => {
    pointer.current = null;
    setOffset({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };
  useEffect(() => {
    const reset = () => stop();
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
    return () => {
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
      onMove({ x: 0, y: 0 });
    };
  }, [onMove]);
  const update = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2,
      y = e.clientY - r.top - r.height / 2;
    const distance = Math.hypot(x, y),
      scale = Math.max(34, distance);
    const v = { x: x / scale, y: y / scale };
    setOffset({ x: v.x * 34, y: v.y * 34 });
    onMove(v);
  };
  return (
    <button
      className="walk-joystick"
      aria-label="Wandeljoystick"
      aria-describedby="joystick-help"
      onPointerDown={(e) => {
        e.preventDefault();
        pointer.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => {
        if (pointer.current === e.pointerId) update(e);
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onBlur={stop}
      onKeyDown={(e) => {
        const v: Record<string, Vector> = {
          ArrowUp: { x: 0, y: -1 },
          w: { x: 0, y: -1 },
          ArrowDown: { x: 0, y: 1 },
          s: { x: 0, y: 1 },
          ArrowLeft: { x: -1, y: 0 },
          a: { x: -1, y: 0 },
          ArrowRight: { x: 1, y: 0 },
          d: { x: 1, y: 0 },
        };
        if (v[e.key]) {
          e.preventDefault();
          onMove(v[e.key]);
          setOffset({ x: v[e.key].x * 34, y: v[e.key].y * 34 });
        }
      }}
      onKeyUp={stop}
    >
      <span className="joystick-ring" aria-hidden="true" />
      <span
        className="joystick-thumb"
        aria-hidden="true"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      />
      <span id="joystick-help" className="sr-only">
        Sleep om te wandelen. Verder slepen verhoogt de snelheid. Loslaten
        stopt. Gebruik ook WASD of de pijltjestoetsen.
      </span>
    </button>
  );
}
