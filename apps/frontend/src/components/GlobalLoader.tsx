import React, { useEffect, useMemo, useState } from 'react';
import { useLoading } from '../contexts/LoadingContext';
import { LogoLoader, parseSvg, type ParsedSvg } from './LogoLoader';

export default function GlobalLoader(): JSX.Element | null {
  const { visible } = useLoading();

  // Try to use configured public gif (default /loader.gif); fallback to CSS spinner
  const [gifOk, setGifOk] = useState<boolean | null>(null);
  const { loaderSrc, loaderSrcSet, sizePx, forceVector, svgSource, colorHex } = useMemo(() => {
    const env = (import.meta as any).env ?? {};
    const src = (env.VITE_LOADER_IMAGE as string | undefined)?.trim() || '/loader.gif';
    const src2x = (env.VITE_LOADER_IMAGE_2X as string | undefined)?.trim();
    const src3x = (env.VITE_LOADER_IMAGE_3X as string | undefined)?.trim();
    const srcSet = [
      src2x ? `${src2x} 2x` : null,
      src3x ? `${src3x} 3x` : null,
    ]
      .filter(Boolean)
      .join(', ');
    const size = Number((env.VITE_LOADER_SIZE as string | undefined) || '128');
    const force = String(env.VITE_LOADER_FORCE_VECTOR ?? 'false') === 'true';
    const svg = (env.VITE_LOADER_SVG as string | undefined)?.trim();
    const color = (env.VITE_LOADER_COLOR as string | undefined)?.trim() || undefined;
    return {
      loaderSrc: src,
      loaderSrcSet: srcSet || undefined,
      sizePx: Number.isFinite(size) ? size : 128,
      forceVector: force,
      svgSource: svg,
      colorHex: color,
    };
  }, []);

  const resolvedSrc = useMemo(() => {
    try {
      const base = (import.meta as any).env?.BASE_URL || (import.meta as any).env?.VITE_BASE || '/';
      if (loaderSrc.startsWith('http://') || loaderSrc.startsWith('https://') || loaderSrc.startsWith('data:')) {
        return loaderSrc;
      }
      if (loaderSrc.startsWith('/')) {
        return String(base).replace(/\/$/, '') + '/' + loaderSrc.replace(/^\/+/, '');
      }
      return String(base).replace(/\/$/, '') + '/' + loaderSrc;
    } catch {
      return loaderSrc;
    }
  }, [loaderSrc]);

  useEffect(() => {
    // Only check once on first mount
    let cancelled = false;
    const img = new Image();
    img.onload = () => !cancelled && setGifOk(true);
    img.onerror = () => {
      if (!cancelled) {
        setGifOk(false);
        try { console.warn('[GlobalLoader] Failed to load loader image:', resolvedSrc); } catch {}
      }
    };
    img.src = resolvedSrc;
    return () => {
      cancelled = true;
    };
  }, [resolvedSrc]);

  // Optional SVG logo animation (declare hooks unconditionally to preserve order)
  const [parsedSvg, setParsedSvg] = useState<ParsedSvg | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!svgSource) {
        setParsedSvg(null);
        return;
      }
      try {
        const isInline = svgSource.trim().startsWith('<');
        const text = isInline
          ? svgSource
          : await fetch(svgSource, { credentials: 'same-origin' }).then((r) => r.text());
        if (!cancelled) setParsedSvg(parseSvg(text));
      } catch (e) {
        if (!cancelled) setParsedSvg(null);
        try { console.warn('[GlobalLoader] Failed to load SVG for loader:', e); } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, [svgSource]);

  if (!visible) return null;

  const showGif = gifOk && !forceVector && !svgSource;

  const VectorSpinner = ({ size }: { size: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      aria-hidden="true"
      style={{ display: 'block' }}
      className="text-brand-600"
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="rgba(148,163,184,0.25)" /* slate-400/25 track */
        strokeWidth="6"
      />
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="6"
        strokeDasharray="100 60"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="0.9s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/65 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center">
        {parsedSvg?.paths?.length ? (
          <LogoLoader
            paths={parsedSvg.paths}
            viewBox={parsedSvg.viewBox}
            size={sizePx}
            color={colorHex || '#111827'}
            thickness={Math.max(10, Math.round(sizePx / 12))}
            duration={1.1}
            delay={0.25}
            stagger
          />
        ) : showGif ? (
          <img
            src={resolvedSrc}
            srcSet={loaderSrcSet}
            alt="Loading"
            decoding="async"
            loading="eager"
            style={{
              width: sizePx,
              height: sizePx,
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))',
              imageRendering: 'auto',
            }}
          />
        ) : (
          <VectorSpinner size={sizePx} />
        )}
        <span className="mt-3 text-sm text-slate-700">Loading…</span>
      </div>
    </div>
  );
}
