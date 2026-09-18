export type OutlinePoint = [number, number];

interface StrokeOutlineOptions {
  width: number;
  /** SVG `stroke-linejoin`: "round", "bevel", "miter" (default) or "miter-clip". */
  lineJoin?: string;
  /** SVG `stroke-linecap`: "round", "square" or "butt" (default). */
  lineCap?: string;
  miterLimit?: number;
  /** Points per full turn of a rounded join or cap. */
  arcSegments?: number;
}

const DEFAULT_ARC_SEGMENTS = 32;
const DEFAULT_MITER_LIMIT = 4;

function distance(a: OutlinePoint, b: OutlinePoint): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function offset(point: OutlinePoint, normal: OutlinePoint, halfWidth: number): OutlinePoint {
  return [point[0] + normal[0] * halfWidth, point[1] + normal[1] * halfWidth];
}

function leftNormal(direction: OutlinePoint): OutlinePoint {
  return [-direction[1], direction[0]];
}

/**
 * Adds the points of an arc around `center` between the angles `from` and `from + sweep`,
 * excluding both ends. Points sit on a fixed angular grid, so arcs sharing a center (strokes that
 * meet end to end, pattern tiles) get identical points instead of edges crossing at grazing angles.
 */
function pushArc(
  out: OutlinePoint[],
  center: OutlinePoint,
  radius: number,
  from: number,
  sweep: number,
  arcSegments: number,
) {
  const step = (Math.PI * 2) / arcSegments;
  const to = from + sweep;
  // Skip grid points right next to the ends, which would only add tiny edges.
  const epsilon = step * 0.1;
  if (sweep > 0) {
    for (let index = Math.floor(from / step) + 1; index * step < to - epsilon; index += 1) {
      if (index * step > from + epsilon) {
        const angle = index * step;
        out.push([center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius]);
      }
    }
    return;
  }
  for (let index = Math.ceil(from / step) - 1; index * step > to + epsilon; index -= 1) {
    if (index * step < from - epsilon) {
      const angle = index * step;
      out.push([center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius]);
    }
  }
}

interface Segment {
  direction: OutlinePoint;
  length: number;
}

/** Points along the left side of the polyline, from its first point to its last. */
function offsetSide(
  points: OutlinePoint[],
  segments: Segment[],
  halfWidth: number,
  lineJoin: string,
  miterLimit: number,
  arcSegments: number,
): OutlinePoint[] {
  const side: OutlinePoint[] = [offset(points[0], leftNormal(segments[0].direction), halfWidth)];

  for (let index = 1; index < points.length - 1; index += 1) {
    const vertex = points[index];
    const before = segments[index - 1];
    const after = segments[index];
    const normalBefore = leftNormal(before.direction);
    const normalAfter = leftNormal(after.direction);
    const end = offset(vertex, normalBefore, halfWidth);
    const start = offset(vertex, normalAfter, halfWidth);
    const cross =
      before.direction[0] * after.direction[1] - before.direction[1] * after.direction[0];
    const dot = before.direction[0] * after.direction[0] + before.direction[1] * after.direction[1];

    if (1 + dot < 1e-9) {
      // The path turns back on itself: go around the vertex like a cap.
      if (lineJoin === "round") {
        side.push(end);
        pushArc(
          side,
          vertex,
          halfWidth,
          Math.atan2(normalBefore[1], normalBefore[0]),
          -Math.PI,
          arcSegments,
        );
        side.push(start);
      } else {
        side.push(end, start);
      }
      continue;
    }

    // Offset lines meet this far from the vertex, along each segment.
    const miterReach = (halfWidth * Math.abs(cross)) / (1 + dot);
    const miterPoint: OutlinePoint = [
      vertex[0] + (halfWidth * (normalBefore[0] + normalAfter[0])) / (1 + dot),
      vertex[1] + (halfWidth * (normalBefore[1] + normalAfter[1])) / (1 + dot),
    ];

    if (Math.abs(cross) < 1e-12) {
      side.push(start);
    } else if (cross > 0) {
      // Inner side of a left turn: stop where the offset lines cross, or go through the vertex
      // when the segments are too short for that (the nonzero rule fills the small loop).
      if (miterReach <= before.length && miterReach <= after.length) {
        side.push(miterPoint);
      } else {
        side.push(end, vertex, start);
      }
    } else if (lineJoin === "round") {
      side.push(end);
      pushArc(
        side,
        vertex,
        halfWidth,
        Math.atan2(normalBefore[1], normalBefore[0]),
        Math.atan2(cross, dot),
        arcSegments,
      );
      side.push(start);
    } else if (
      (lineJoin === "miter" || lineJoin === "miter-clip") &&
      Math.sqrt(2 / (1 + dot)) <= miterLimit
    ) {
      side.push(miterPoint);
    } else {
      side.push(end, start);
    }
  }

  const last = points[points.length - 1];
  side.push(offset(last, leftNormal(segments[segments.length - 1].direction), halfWidth));
  return side;
}

/** Points going around the end of the polyline, from its left side to its right side. */
function capPoints(
  end: OutlinePoint,
  direction: OutlinePoint,
  halfWidth: number,
  lineCap: string,
  arcSegments: number,
): OutlinePoint[] {
  const normal = leftNormal(direction);
  if (lineCap === "round") {
    const cap: OutlinePoint[] = [];
    pushArc(cap, end, halfWidth, Math.atan2(normal[1], normal[0]), -Math.PI, arcSegments);
    return cap;
  }
  if (lineCap === "square") {
    const tip: OutlinePoint = [
      end[0] + direction[0] * halfWidth,
      end[1] + direction[1] * halfWidth,
    ];
    return [offset(tip, normal, halfWidth), offset(tip, normal, -halfWidth)];
  }
  return [];
}

function toSegments(points: OutlinePoint[]): Segment[] {
  return points.slice(1).map((point, index) => {
    const previous = points[index];
    const length = distance(previous, point);
    return {
      direction: [(point[0] - previous[0]) / length, (point[1] - previous[1]) / length],
      length,
    };
  });
}

function dotOutline(center: OutlinePoint, halfWidth: number, lineCap: string, arcSegments: number) {
  if (lineCap === "round") {
    const circle: OutlinePoint[] = [];
    for (let index = 0; index < arcSegments; index += 1) {
      const angle = (index / arcSegments) * Math.PI * 2;
      circle.push([
        center[0] + Math.cos(angle) * halfWidth,
        center[1] + Math.sin(angle) * halfWidth,
      ]);
    }
    return circle;
  }
  if (lineCap === "square") {
    const [x, y] = center;
    return [
      [x - halfWidth, y - halfWidth],
      [x + halfWidth, y - halfWidth],
      [x + halfWidth, y + halfWidth],
      [x - halfWidth, y + halfWidth],
    ] satisfies OutlinePoint[];
  }
  return null;
}

/**
 * Outline of a stroked polyline, as a single ring to fill with the nonzero rule: the ring crosses
 * itself where the stroke overlaps itself or turns sharply, and those areas count as filled.
 * A polyline whose last point equals its first is closed: every vertex gets a join, no cap.
 */
export function strokeOutline(
  polyline: OutlinePoint[],
  {
    width,
    lineJoin = "miter",
    lineCap = "butt",
    miterLimit = DEFAULT_MITER_LIMIT,
    arcSegments = DEFAULT_ARC_SEGMENTS,
  }: StrokeOutlineOptions,
): OutlinePoint[] | null {
  const halfWidth = width / 2;
  if (!(halfWidth > 0) || !polyline.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))) {
    return null;
  }
  const minimumStep = halfWidth * 1e-6;
  const points = polyline.filter(
    (point, index) => index === 0 || distance(polyline[index - 1], point) > minimumStep,
  );
  if (points.length === 1) {
    return dotOutline(points[0], halfWidth, lineCap, arcSegments);
  }

  const isClosed =
    points.length > 2 && distance(points[0], points[points.length - 1]) <= minimumStep;
  // A closed path runs once more over its first segment, so its first vertex gets a real join;
  // the doubled segment is covered twice, which the nonzero rule fills once.
  const path = isClosed ? [...points.slice(0, -1), points[0], points[1]] : points;
  const cap = isClosed ? "butt" : lineCap;
  const segments = toSegments(path);
  const reversedPath = [...path].reverse();
  const reversedSegments = toSegments(reversedPath);

  return [
    ...offsetSide(path, segments, halfWidth, lineJoin, miterLimit, arcSegments),
    ...capPoints(
      path[path.length - 1],
      segments[segments.length - 1].direction,
      halfWidth,
      cap,
      arcSegments,
    ),
    ...offsetSide(reversedPath, reversedSegments, halfWidth, lineJoin, miterLimit, arcSegments),
    ...capPoints(
      path[0],
      reversedSegments[reversedSegments.length - 1].direction,
      halfWidth,
      cap,
      arcSegments,
    ),
  ];
}
