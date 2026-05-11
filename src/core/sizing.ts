import type { AppGraph } from './graph';
import type { GroupingResult } from './grouping';
import { isVisible, type Filters } from './filters';

export type SizingMode = 'uniform' | 'usage';

export interface NodeSizing {
  mode: SizingMode;
  sizeOf: (nodeId: string) => number;
}

const UNIFORM_SIZE = 4;
const MIN_SIZE = 3;
const MAX_SIZE = 18;
const RANGE = MAX_SIZE - MIN_SIZE;

// Compute per-node sizes. When `mode === 'usage'`, size scales with in-degree
// (how many edges point TO the node = how often it is called/used). The scale
// is normalised within each group when a grouping is active, otherwise globally.
// This means the biggest node is always "the most-used in its current context",
// so switching Group By re-bands the sizes accordingly.
export function computeNodeSizing(
  graph: AppGraph,
  filters: Filters,
  grouping: GroupingResult | null,
  mode: SizingMode,
): NodeSizing {
  if (mode === 'uniform') {
    return { mode, sizeOf: () => UNIFORM_SIZE };
  }

  const groupKeyOf = (nodeId: string): string | null => grouping?.nodeToGroup.get(nodeId) ?? null;

  // Bucket usage per group: groupKey (or null for global / ungrouped) -> { max, usages }
  type Bucket = { max: number; usages: Map<string, number> };
  const buckets = new Map<string | null, Bucket>();

  graph.forEachNode((id, attrs) => {
    if (!isVisible(attrs, filters)) return;
    const usage = graph.inDegree(id);
    const key = groupKeyOf(id);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { max: 0, usages: new Map() };
      buckets.set(key, bucket);
    }
    bucket.usages.set(id, usage);
    if (usage > bucket.max) bucket.max = usage;
  });

  return {
    mode,
    sizeOf: (nodeId: string) => {
      const bucket = buckets.get(groupKeyOf(nodeId));
      if (!bucket || bucket.max === 0) return MIN_SIZE;
      const usage = bucket.usages.get(nodeId) ?? 0;
      // sqrt scaling so a node called 25x isn't 5x bigger by area than one called 1x;
      // it's ~5x bigger by radius but visually feels proportional.
      const norm = Math.sqrt(usage / bucket.max);
      return MIN_SIZE + RANGE * norm;
    },
  };
}
