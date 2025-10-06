import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ModalRoot.module.css';

type PixelFieldProps = {
  active: boolean;
  squareSize?: number; // size of each square in pixels
  gridGap?: number; // gap between squares
  flickerChance?: number; // probability of flicker per frame
  maxOpacity?: number; // maximum opacity for squares
};

// Flickering grid - squares fade in/out independently
export default function PixelField({
  active,
  squareSize = 5,
  gridGap = 7,
  flickerChance = 0.15,
  maxOpacity = 0.5,
}: PixelFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const squaresRef = useRef<Float32Array | null>(null);
  const animRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);

  const prefersReduced = typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Resize to viewport
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Initialize grid when size changes
  useEffect(() => {
    const w = Math.max(1, size.w);
    const h = Math.max(1, size.h);

    const cellSize = squareSize + gridGap;
    const cols = Math.ceil(w / cellSize);
    const rows = Math.ceil(h / cellSize);
    const count = cols * rows;

    // Initialize squares with random starting opacities
    const squares = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      squares[i] = Math.random() < 0.15 ? Math.random() * maxOpacity : 0;
    }
    squaresRef.current = squares;

    // Setup canvas
    const c = canvasRef.current;
    if (c) {
      const dpr = window.devicePixelRatio || 1;
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      c.style.width = w + 'px';
      c.style.height = h + 'px';
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }
  }, [size.w, size.h, squareSize, gridGap, maxOpacity]);

  const updateSquares = useCallback((deltaTime: number) => {
    const squares = squaresRef.current;
    if (!squares) return;

    for (let i = 0; i < squares.length; i++) {
      const current = squares[i];

      // Randomly trigger new flicker
      if (Math.random() < flickerChance * deltaTime) {
        // Sometimes turn on, sometimes turn off
        if (current < 0.01) {
          // Turn on with random opacity
          squares[i] = Math.random() * maxOpacity;
        } else {
          // Turn off or change intensity
          if (Math.random() < 0.6) {
            squares[i] = 0; // fade out
          } else {
            squares[i] = Math.random() * maxOpacity; // change intensity
          }
        }
      } else {
        // Gradually fade towards 0
        squares[i] = current * 0.95;
      }
    }
  }, [flickerChance, maxOpacity]);

  const drawGrid = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const squares = squaresRef.current;
    if (!ctx || !squares) return;

    const w = size.w;
    const h = size.h;
    const cellSize = squareSize + gridGap;
    const cols = Math.ceil(w / cellSize);
    const rows = Math.ceil(h / cellSize);
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, w, h);

    // Draw squares with varying opacity
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const idx = i * rows + j;
        const opacity = squares[idx];

        if (opacity <= 0.001) continue; // skip invisible squares

        // Vary the color slightly for each square
        const colorVariation = Math.floor((idx % 5) / 5 * 80); // subtle variation
        const gray = 200 - colorVariation;

        ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, ${opacity})`;
        ctx.fillRect(
          i * cellSize,
          j * cellSize,
          squareSize,
          squareSize
        );
      }
    }
  }, [size.w, size.h, squareSize, gridGap]);

  // Animation loop
  useEffect(() => {
    if (!active || prefersReduced) {
      drawGrid();
      return;
    }

    const loop = (t: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = t;
      const dt = (t - lastFrameRef.current) / 1000; // seconds
      lastFrameRef.current = t;

      updateSquares(dt);
      drawGrid();

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
      lastFrameRef.current = 0;
    };
  }, [active, prefersReduced, updateSquares, drawGrid]);

  return (
    <div className={styles.gridLayer} aria-hidden>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
