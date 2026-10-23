import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import './DotGrid.css';

type DotGridProps = {
  baseColor?: string;
  activeColor?: string;
  shape?: 'circle' | 'square';
  dotSize?: number;
  gap?: number;
  proximity?: number;
  strength?: number;
  bounce?: number;
  tension?: number;
  returnDuration?: number;
  shockRadius?: number;
  shockStrength?: number;
  swell?: number;
  stretch?: number;
  glow?: number;
  fade?: number;
  opacity?: number;
  intro?: boolean;
  mouseInteraction?: boolean;
  clickShock?: boolean;
  paused?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
};

type Dot = { x: number; y: number; dx: number; dy: number; vx: number; vy: number; energy: number };
type Shock = { x: number; y: number; started: number };

const colorChannels = (value: string) => {
  const hex = value.replace('#', '');
  const normalized = hex.length === 3 ? hex.split('').map((digit) => digit + digit).join('') : hex;
  const number = Number.parseInt(normalized, 16);
  if (!Number.isFinite(number)) return [0.25, 0.4, 0.38];
  return [(number >> 16) / 255, ((number >> 8) & 255) / 255, (number & 255) / 255];
};

export default function DotGrid({
  baseColor = '#3a3446',
  activeColor = '#ffffff',
  shape = 'circle',
  dotSize = 5,
  gap = 18,
  proximity = 140,
  strength = 1,
  bounce = 0.6,
  tension = 0.4,
  returnDuration = 0.8,
  shockRadius = 320,
  shockStrength = 5,
  swell = 0.8,
  stretch = 0.5,
  glow = 0.5,
  fade = 0,
  opacity = 1,
  intro = true,
  mouseInteraction = true,
  clickShock = true,
  paused = false,
  dpr,
  className = '',
  style,
}: DotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<() => void>(() => {});
  const settingsRef = useRef<DotGridProps>({ baseColor, activeColor, shape, dotSize, gap, proximity, strength, bounce, tension, returnDuration, shockRadius, shockStrength, swell, stretch, glow, fade, opacity, intro, mouseInteraction, clickShock, paused, dpr });

  useEffect(() => {
    settingsRef.current = { baseColor, activeColor, shape, dotSize, gap, proximity, strength, bounce, tension, returnDuration, shockRadius, shockStrength, swell, stretch, glow, fade, opacity, intro, mouseInteraction, clickShock, paused, dpr };
  }, [baseColor, activeColor, shape, dotSize, gap, proximity, strength, bounce, tension, returnDuration, shockRadius, shockStrength, swell, stretch, glow, fade, opacity, intro, mouseInteraction, clickShock, paused, dpr]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: -1000, y: -1000, vx: 0, vy: 0, previousX: 0, previousY: 0, inside: false, time: 0 };
    const shocks: Shock[] = [];
    let dots: Dot[] = [];
    let columns = 1;
    let rows = 1;
    let width = 1;
    let height = 1;
    let ratio = 1;
    let frame = 0;
    let lastTime = 0;
    let introTime = performance.now();
    let disposed = false;

    const rebuild = () => {
      const current = settingsRef.current;
      const bounds = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, bounds.width);
      const nextHeight = Math.max(1, bounds.height);
      const nextRatio = Math.min(current.dpr ?? window.devicePixelRatio ?? 1, 2);
      if (nextWidth === width && nextHeight === height && nextRatio === ratio) return;
      width = nextWidth;
      height = nextHeight;
      ratio = nextRatio;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      columns = Math.max(1, Math.floor((width + current.gap!) / (current.dotSize! + current.gap!)));
      rows = Math.max(1, Math.floor((height + current.gap!) / (current.dotSize! + current.gap!)));
      const cell = current.dotSize! + current.gap!;
      const startX = (width - (columns * cell - current.gap!)) / 2 + current.dotSize! / 2;
      const startY = (height - (rows * cell - current.gap!)) / 2 + current.dotSize! / 2;
      dots = Array.from({ length: columns * rows }, (_, index) => ({
        x: startX + (index % columns) * cell,
        y: startY + Math.floor(index / columns) * cell,
        dx: 0,
        dy: 0,
        vx: 0,
        vy: 0,
        energy: 0,
      }));
      introTime = performance.now();
      draw(performance.now(), 0);
      wake();
    };

    const draw = (now: number, elapsed: number) => {
      const current = settingsRef.current;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      const base = colorChannels(current.baseColor!);
      const active = colorChannels(current.activeColor!);
      const cell = current.dotSize! + current.gap!;
      const introProgress = reducedMotion || !current.intro ? 1 : Math.min(1, (now - introTime) / 1000);
      const introRadius = introProgress * Math.hypot(width, height) * 0.55;
      const damping = Math.max(0.1, 1.4 - current.bounce!);
      const spring = 4 / Math.max(0.2, current.returnDuration!);
      const step = Math.min(elapsed, 0.04);

      dots.forEach((dot, index) => {
        let forceX = -dot.dx * spring * spring - dot.vx * damping * spring;
        let forceY = -dot.dy * spring * spring - dot.vy * damping * spring;
        const x = dot.x + dot.dx;
        const y = dot.y + dot.dy;

        if (!reducedMotion && current.mouseInteraction && pointer.inside) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < current.proximity!) {
            const falloff = (1 - distance / current.proximity!) ** 2;
            const directionX = distance ? dx / distance : 0;
            const directionY = distance ? dy / distance : 0;
            forceX += (directionX * 0.7 + pointer.vx * 0.002) * falloff * current.strength! * 90;
            forceY += (directionY * 0.7 + pointer.vy * 0.002) * falloff * current.strength! * 90;
            dot.energy = Math.max(dot.energy, falloff * 0.8);
          }
        }

        if (!reducedMotion) {
          shocks.forEach((shock) => {
            const dx = x - shock.x;
            const dy = y - shock.y;
            const distance = Math.hypot(dx, dy);
            const age = (now - shock.started) / 1000;
            const waveFront = age * 620;
            const difference = distance - waveFront;
            if (age < current.shockRadius! / 620 && Math.abs(difference) < cell * 2.5 && distance > 0) {
              const wavePower = Math.exp(-((difference / (cell * 1.2)) ** 2));
              forceX += (dx / distance) * wavePower * current.shockStrength! * 9;
              forceY += (dy / distance) * wavePower * current.shockStrength! * 9;
              dot.energy = Math.max(dot.energy, wavePower);
            }
          });
        }

        if (current.tension! > 0 && columns > 1) {
          const neighbor = dots[index - 1];
          if (index % columns > 0 && neighbor) {
            forceX += (neighbor.dx - dot.dx) * current.tension! * 0.45;
            forceY += (neighbor.dy - dot.dy) * current.tension! * 0.45;
          }
        }

        dot.vx += forceX * step;
        dot.vy += forceY * step;
        dot.dx += dot.vx * step;
        dot.dy += dot.vy * step;
        dot.energy *= Math.exp(-step * 4.5);

        const introScale = introProgress < 1
          ? Math.max(0.5, Math.min(1, (introRadius - Math.hypot(dot.x - width / 2, dot.y - height / 2)) / (cell * 2)))
          : 1;
        const motion = Math.hypot(dot.vx, dot.vy);
        const radius = Math.max(0.5, current.dotSize! * 0.5 * (1 + current.swell! * dot.energy)) * introScale;
        const edgeDistance = Math.min(x, y, width - x, height - y);
        const edgeAlpha = current.fade! > 0 ? Math.max(0, Math.min(1, edgeDistance / (Math.min(width, height) * current.fade! * 0.4))) : 1;
        const color = base.map((channel, channelIndex) => Math.round((channel + (active[channelIndex] - channel) * Math.min(1, dot.energy)) * 255));
        context.globalAlpha = Math.max(0, Math.min(1, current.opacity! * edgeAlpha));
        context.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        context.shadowColor = current.activeColor!;
        context.shadowBlur = current.glow! * dot.energy * 12;

        if (motion > 18 && current.stretch! > 0) {
          context.strokeStyle = context.fillStyle;
          context.lineWidth = radius * 2;
          context.lineCap = 'round';
          context.beginPath();
          context.moveTo(x - dot.vx * current.stretch! * 0.012, y - dot.vy * current.stretch! * 0.012);
          context.lineTo(x, y);
          context.stroke();
        } else if (current.shape === 'square') {
          context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        } else {
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
        }
        context.shadowBlur = 0;
      });
      context.globalAlpha = 1;
      for (let index = shocks.length - 1; index >= 0; index--) {
        if ((now - shocks[index].started) / 1000 > settingsRef.current.shockRadius! / 620) shocks.splice(index, 1);
      }
    };

    const hasMotion = () => shocks.length > 0 || (!reducedMotion && settingsRef.current.intro && performance.now() - introTime < 1200) || dots.some((dot) => Math.abs(dot.dx) + Math.abs(dot.dy) + Math.abs(dot.vx) + Math.abs(dot.vy) > 0.08 || dot.energy > 0.02);

    const animate = (now: number) => {
      frame = 0;
      if (disposed || settingsRef.current.paused) return;
      const elapsed = lastTime ? (now - lastTime) / 1000 : 0;
      lastTime = now;
      draw(now, elapsed);
      if (hasMotion()) frame = requestAnimationFrame(animate);
    };

    const wake = () => {
      if (frame || disposed || settingsRef.current.paused) return;
      lastTime = 0;
      frame = requestAnimationFrame(animate);
    };
    wakeRef.current = wake;

    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const inside = x >= 0 && y >= 0 && x <= bounds.width && y <= bounds.height;
      const now = event.timeStamp || performance.now();
      if (inside && pointer.inside && pointer.time) {
        const seconds = Math.max(0.004, (now - pointer.time) / 1000);
        pointer.vx = ((x - pointer.previousX) / seconds) * 0.2;
        pointer.vy = ((y - pointer.previousY) / seconds) * 0.2;
      } else {
        pointer.vx = 0;
        pointer.vy = 0;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.previousX = x;
      pointer.previousY = y;
      pointer.time = now;
      pointer.inside = inside;
      if (inside && settingsRef.current.mouseInteraction) wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!settingsRef.current.clickShock || reducedMotion) return;
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      if (x < 0 || y < 0 || x > bounds.width || y > bounds.height) return;
      shocks.push({ x, y, started: performance.now() });
      wake();
    };

    const onPointerLeave = () => {
      pointer.inside = false;
      pointer.time = 0;
      wake();
    };

    const resizeObserver = new ResizeObserver(rebuild);
    resizeObserver.observe(canvas);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('blur', onPointerLeave);
    rebuild();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('blur', onPointerLeave);
      wakeRef.current = () => {};
    };
  }, []);

  useEffect(() => {
    if (!paused) wakeRef.current();
  }, [paused, dotSize, gap, baseColor, activeColor, shape, proximity, strength, bounce, tension, returnDuration, shockRadius, shockStrength, swell, stretch, glow, fade, opacity, intro, mouseInteraction, clickShock, dpr]);

  return <div className={`dot-grid ${className}`.trim()} style={style} aria-hidden="true"><canvas ref={canvasRef} className="dot-grid__canvas" /></div>;
}
