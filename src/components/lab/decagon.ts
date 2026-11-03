/** Pure, deterministic geometry for the ten-sided Occult Killer network viewport. */
export const DECAGON_SIDES = 10;

export function decagonVertices(cx: number, cy: number, radius: number) {
  return Array.from({ length: DECAGON_SIDES }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / DECAGON_SIDES;
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });
}

export function decagonPoints(cx: number, cy: number, radius: number) {
  return decagonVertices(cx, cy, radius)
    .map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
}

/** Distance from the centre to the boundary in a given polar direction. */
export function decagonBoundaryRadius(angle: number, radius: number) {
  const step = (2 * Math.PI) / DECAGON_SIDES;
  const firstEdgeNormal = -Math.PI / 2 + step / 2;
  const relative = angle - firstEdgeNormal;
  const delta = (((relative + step / 2) % step) + step) % step - step / 2;
  return (radius * Math.cos(step / 2)) / Math.cos(delta);
}

/**
 * Position each agent on a deterministic radial band and clamp it inside the
 * polygon. The clearance includes a selected-node halo so nodes never spill out.
 */
export function positionAgentInsideDecagon(
  index: number,
  count: number,
  roleIndex: number,
  cx: number,
  cy: number,
  radius: number,
  clearance = 20,
) {
  const angle = -Math.PI / 2 + ((index + 0.5) * 2 * Math.PI) / Math.max(1, count);
  const preferred = 65 + (Math.max(0, roleIndex) % 3) * 23 + ((index * 7) % 5) * 12;
  const distance = Math.max(0, Math.min(preferred, decagonBoundaryRadius(angle, radius) - clearance));
  return { x: cx + Math.cos(angle) * distance, y: cy + Math.sin(angle) * distance, distance, angle };
}
