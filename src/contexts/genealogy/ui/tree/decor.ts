/**
 * Pure decorative helpers for the ancestor fan: monograms, curved vine paths,
 * and leaf/blossom placement along a vine. Kept pure so the renderer stays a
 * thin view and these can be unit-tested.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Leaf {
  x: number;
  y: number;
  angle: number; // degrees
  variant: "leaf" | "blossom";
}

/** Up to two initials from a person's legal name, e.g. "Krishna Murthy" → "KM". */
export function monogram(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => /[A-Za-zÀ-ɏ]/.test(p));
  if (parts.length === 0) return "?";
  const first = parts[0]![0]!;
  const second = parts.length > 1 ? parts[parts.length - 1]![0]! : "";
  return (first + second).toUpperCase();
}

/**
 * A gently bowed quadratic path from `a` to `b`. The control point is offset
 * perpendicular to the segment so vines curve organically rather than running
 * straight. `bow` is the fraction of the segment length used for the offset.
 */
export function vinePath(a: Point, b: Point, bow = 0.18): { d: string; control: Point } {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  // Perpendicular unit vector.
  const px = -dy / len;
  const py = dx / len;
  const offset = len * bow;
  const control = { x: mx + px * offset, y: my + py * offset };
  return {
    d: `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
    control,
  };
}

/** Sample a quadratic Bézier at parameter t. */
function quadAt(a: Point, c: Point, b: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * a.x + 2 * mt * t * c.x + t * t * b.x,
    y: mt * mt * a.y + 2 * mt * t * c.y + t * t * b.y,
  };
}

/**
 * Place leaves (and the occasional blossom) along a vine. Deterministic — leaf
 * count scales with length and the blossom cadence is fixed — so renders are
 * stable across reloads (no Math.random in the view).
 */
export function leavesAlong(a: Point, b: Point, control: Point, seed = 0): Leaf[] {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const count = Math.max(2, Math.min(9, Math.round(len / 34)));
  const leaves: Leaf[] = [];
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const p = quadAt(a, control, b, t);
    // Tangent direction for leaf orientation.
    const tan = quadAt(a, control, b, Math.min(1, t + 0.01));
    const angle = (Math.atan2(tan.y - p.y, tan.x - p.x) * 180) / Math.PI;
    const sideFlip = (i + seed) % 2 === 0 ? 1 : -1;
    leaves.push({
      x: p.x,
      y: p.y,
      angle: angle + sideFlip * 55,
      variant: (i + seed) % 4 === 0 ? "blossom" : "leaf",
    });
  }
  return leaves;
}
