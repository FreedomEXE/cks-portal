# Logo Loader Component

A tiny React + Framer Motion component that animates the *stroke draw* of your SVG logo. The parser ignores full-canvas background boxes automatically.

## Quick start

```bash
npm i
npm run dev
```

Open http://localhost:5173

## Files

- `src/LogoLoader.tsx` — reusable component + `parseSvg(xml)` helper.
- `src/main.tsx` — demo page that lets you paste an SVG and preview.
- `index.html` — demo shell.

## Use in your app

Copy `src/LogoLoader.tsx` into your project, then:

```tsx
import { LogoLoader, parseSvg } from "./LogoLoader";

const { paths, viewBox } = parseSvg(rawSvgString);

<LogoLoader
  paths={paths}
  viewBox={viewBox}
  color="#111827"
  size={220}
  thickness={18}
  duration={1.2}
  delay={0.25}
  stagger
  rotate={false}
/>
```

## Notes

- The parser strips out a background `<rect x="0" y="0" width=vbW height=vbH/>` or common `m0 0 hW vH h-W z` path matching the `viewBox` size.
- It converts `circle`, `rect`, `polyline`, `polygon` into paths so everything animates uniformly.
- If you need a GIF, record the page (ScreenToGif/OBS/Loom) or render headlessly with Puppeteer + ffmpeg.
