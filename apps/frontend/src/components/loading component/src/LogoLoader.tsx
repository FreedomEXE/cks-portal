import { motion } from "framer-motion";

export type PathSeg = { d: string; transform?: string | null };
export type ParsedSvg = { viewBox: string; paths: PathSeg[]; errors: string[] };

export function LogoLoader({
  paths,
  viewBox,
  color = "#111827",
  size = 220,
  thickness = 18,
  duration = 1.2,
  delay = 0.25,
  stagger = true,
  rotate = false,
}: {
  paths: PathSeg[];
  viewBox: string;
  color?: string;
  size?: number;
  thickness?: number;
  duration?: number;
  delay?: number;
  stagger?: boolean;
  rotate?: boolean;
}) {
  const rotProps = rotate
    ? { initial: { rotate: 0 }, animate: { rotate: 360 }, transition: { repeat: Infinity as const, duration: Math.max(8, duration * 8), ease: "linear" } }
    : { initial: {}, animate: {}, transition: {} };

  return (
    <div style={{ color, display: "grid", placeItems: "center" }}>
      <motion.svg width={size} height={size} viewBox={viewBox} {...rotProps}>
        {paths.map((p, i) => (
          <path
            key={`t-${i}`}
            d={p.d}
            transform={p.transform || undefined}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.14}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {paths.map((p, i) => (
          <motion.path
            key={`m-${i}`}
            d={p.d}
            transform={p.transform || undefined}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: Math.max(0.2, duration + (stagger ? i * 0.15 : 0)),
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "loop",
              repeatDelay: Math.max(0, delay),
            }}
          />
        ))}
      </motion.svg>
    </div>
  );
}

export function parseSvg(xml: string): ParsedSvg {
  const errors: string[] = [];
  try {
    const clean = xml.replace(/\n|\r/g, " ").replace(/\s{2,}/g, " ").trim();
    const dom = new DOMParser().parseFromString(clean, "image/svg+xml");

    if (dom.getElementsByTagName("parsererror").length > 0) {
      errors.push("XML parser reported an error – check SVG syntax.");
    }

    const svgEl = dom.querySelector("svg");
    if (!svgEl) {
      return { viewBox: "0 0 512 512", paths: [], errors: ["No <svg> root element found."] };
    }

    const viewBox = svgEl.getAttribute("viewBox") || `0 0 ${svgEl.getAttribute("width") || 512} ${svgEl.getAttribute("height") || 512}`;
    const { width: vbW, height: vbH } = parseViewBox(viewBox);

    const paths: PathSeg[] = [];

    dom.querySelectorAll("path").forEach((el) => {
      const d = el.getAttribute("d");
      const transform = el.getAttribute("transform");
      if (!d || !d.trim()) return;
      if (isFullBgPath(d, vbW, vbH, transform)) return;
      paths.push({ d: d.trim(), transform });
    });

    dom.querySelectorAll("rect").forEach((r) => {
      const x = num(r.getAttribute("x"), 0);
      const y = num(r.getAttribute("y"), 0);
      const w = num(r.getAttribute("width"), 0);
      const h = num(r.getAttribute("height"), 0);
      const rx = num(r.getAttribute("rx"), 0);
      const ry = num(r.getAttribute("ry"), rx);
      const transform = r.getAttribute("transform");
      if (nearlyEqual(x, 0) && nearlyEqual(y, 0) && nearlyEqual(w, vbW) && nearlyEqual(h, vbH)) return;
      if (w > 0 && h > 0) paths.push({ d: rectToPath(x, y, w, h, rx, ry), transform });
    });

    dom.querySelectorAll("circle").forEach((c) => {
      const cx = num(c.getAttribute("cx"), 0);
      const cy = num(c.getAttribute("cy"), 0);
      const r = num(c.getAttribute("r"), 0);
      const transform = c.getAttribute("transform");
      if (r > 0) {
        const d = `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy}`;
        paths.push({ d, transform });
      }
    });

    dom.querySelectorAll("polyline, polygon").forEach((g) => {
      const pts = (g.getAttribute("points") || "").trim();
      const transform = (g as Element).getAttribute("transform");
      if (pts) paths.push({ d: polyToPath(pts, g.tagName.toLowerCase() === "polygon"), transform });
    });

    if (paths.length === 0) errors.push("No drawable geometry found (paths/shapes) after background filtering.");

    return { viewBox, paths, errors };
  } catch (e: any) {
    errors.push(`Exception while parsing: ${e?.message || e}`);
    return { viewBox: "0 0 512 512", paths: [], errors };
  }
}

function parseViewBox(vb: string) {
  const parts = vb.trim().split(/\s+/).map(Number);
  return { x: parts[0] || 0, y: parts[1] || 0, width: parts[2] || 0, height: parts[3] || 0 };
}

function nearlyEqual(a: number, b: number, eps = 0.5) { return Math.abs(a - b) <= eps; }

function isFullBgPath(dRaw: string, vbW: number, vbH: number, transform: string | null) {
  const t = (transform || "").replace(/\s+/g, "").toLowerCase();
  if (t && t !== "translate(0)" && t !== "translate(0,0)") return false;
  const d = dRaw.toLowerCase().replace(/\s+/g, " ").trim();
  const match = d.match(/^m\s*0\s*0\s*h\s*([0-9.]+)\s*v\s*([0-9.]+)\s*h\s*-?([0-9.]+)\s*z\s*$/i);
  if (!match) return false;
  const W = Number(match[1]);
  const H = Number(match[2]);
  const W2 = Number(match[3]);
  return nearlyEqual(W, vbW) && nearlyEqual(H, vbH) && nearlyEqual(W, W2);
}

function num(v: string | null, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function rectToPath(x: number, y: number, w: number, h: number, rx: number, ry: number) {
  const rrx = Math.min(rx, w / 2), rry = Math.min(ry, h / 2);
  if (!rrx && !rry) return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
  return [
    `M ${x + rrx} ${y}`,
    `H ${x + w - rrx}`,
    `A ${rrx} ${rry} 0 0 1 ${x + w} ${y + rry}`,
    `V ${y + h - rry}`,
    `A ${rrx} ${rry} 0 0 1 ${x + w - rrx} ${y + h}`,
    `H ${x + rrx}`,
    `A ${rrx} ${rry} 0 0 1 ${x} ${y + h - rry}`,
    `V ${y + rry}`,
    `A ${rrx} ${rry} 0 0 1 ${x + rrx} ${y}`,
    "Z",
  ].join(" ");
}

function polyToPath(points: string, close: boolean) {
  const cmds = points.trim().split(/\s+/).map((p) => p.replace(/,/g, " "));
  const [first, ...rest] = cmds;
  const [x0, y0] = first.split(" ");
  return `M ${x0} ${y0} L ${rest.join(" ")} ${close ? "Z" : ""}`.trim();
}
