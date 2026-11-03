import { describe, expect, it } from "vitest";
import { DECAGON_SIDES, decagonBoundaryRadius, decagonVertices, positionAgentInsideDecagon } from "./decagon";

describe("decagon swarm viewport", () => {
  it("builds a true ten-sided regular polygon", () => {
    const verts = decagonVertices(260, 205, 170);
    expect(verts).toHaveLength(DECAGON_SIDES);
    for (const v of verts) {
      expect(Math.hypot(v.x - 260, v.y - 205)).toBeCloseTo(170, 8);
    }
  });

  it("keeps agent markers and selection halos inside the boundary across population sizes", () => {
    const radius = 170, margin = 20;
    for (const n of [1, 10, 30, 60, 120, 400]) {
      for (let i = 0; i < n; i++) {
        const p = positionAgentInsideDecagon(i, n, i % 8, 260, 205, radius, margin);
        expect(p.distance + margin).toBeLessThanOrEqual(decagonBoundaryRadius(p.angle, radius) + 1e-9);
        expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
      }
    }
  });

  it("does not put all ten polygon vertices on a circle-shaped border rendering", () => {
    const pts = decagonVertices(0, 0, 170);
    const edgeMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    expect(Math.hypot(edgeMid.x, edgeMid.y)).toBeCloseTo(170 * Math.cos(Math.PI / 10), 8);
  });
});
