import forceAtlas2 from 'graphology-layout-forceatlas2';
import type { AppGraph } from './graph';

export interface LayoutOptions {
  iterations?: number;
}

// Synchronous FA2 with sane defaults. M1 keeps it on the main thread to ship
// fast; the FA2 web worker (graphology-layout-forceatlas2/worker) is a drop-in
// upgrade in M3 once the renderer is busy enough that a freeze would be felt.
export function applyForceAtlas2Layout(graph: AppGraph, opts: LayoutOptions = {}): void {
  const iterations = opts.iterations ?? Math.min(200, Math.max(50, Math.round(2000 / Math.max(1, graph.order / 50))));

  // Seed positions if missing — FA2 needs starting coordinates.
  let i = 0;
  graph.forEachNode((node, attrs) => {
    if (typeof attrs.x !== 'number' || typeof attrs.y !== 'number') {
      const angle = (i * 2 * Math.PI) / Math.max(1, graph.order);
      const radius = Math.sqrt(graph.order) * 5;
      graph.mergeNodeAttributes(node, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        size: 4,
      });
      i++;
    }
  });

  const settings = forceAtlas2.inferSettings(graph);
  forceAtlas2.assign(graph, { iterations, settings });
}
