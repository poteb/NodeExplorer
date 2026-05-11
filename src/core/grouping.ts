import type { AppGraph } from './graph';
import type { GraphAdapter, GroupingDef, NodeAttrs } from './adapter';
import { isVisible, type Filters } from './filters';

export type GroupId = string;

export interface GroupNode {
  id: GroupId;
  name: string;
  count: number;
  nodeIds: string[];
}

export interface GroupingResult {
  groupingId: string;
  groups: GroupNode[];
  // node id -> group id; null group means ungrouped
  nodeToGroup: Map<string, GroupId | null>;
  // group id -> color
  colorOf: (groupId: GroupId | null) => string;
}

export const NONE_GROUPING: GroupingDef = {
  id: 'none',
  label: 'None',
  keyOf: () => null,
};

const PALETTE_LIGHT = [
  '#0284c7', '#16a34a', '#dc2626', '#9333ea', '#ea580c',
  '#0891b2', '#65a30d', '#db2777', '#7c3aed', '#d97706',
  '#0d9488', '#ca8a04', '#4f46e5', '#be185d', '#15803d',
  '#b45309', '#1e40af', '#7e22ce', '#be123c', '#047857',
];

const PALETTE_DARK = [
  '#7dd3fc', '#86efac', '#fca5a5', '#d8b4fe', '#fdba74',
  '#67e8f9', '#bef264', '#f9a8d4', '#c4b5fd', '#fcd34d',
  '#5eead4', '#fde047', '#a5b4fc', '#f0abfc', '#86efac',
  '#fbbf24', '#93c5fd', '#d8b4fe', '#fda4af', '#6ee7b7',
];

export function applyGrouping(
  graph: AppGraph,
  adapter: GraphAdapter,
  groupingId: string,
  filters: Filters,
  theme: 'light' | 'dark',
): GroupingResult {
  const grouping =
    groupingId === 'none'
      ? NONE_GROUPING
      : adapter.groupings().find((g) => g.id === groupingId) ?? NONE_GROUPING;

  const groupMap = new Map<GroupId, { name: string; nodeIds: string[] }>();
  const nodeToGroup = new Map<string, GroupId | null>();

  graph.forEachNode((id, attrs: NodeAttrs) => {
    if (!isVisible(attrs, filters)) {
      nodeToGroup.set(id, null);
      return;
    }
    const key = grouping.keyOf(attrs);
    nodeToGroup.set(id, key);
    if (key == null) return;
    const bucket = groupMap.get(key) ?? { name: key, nodeIds: [] };
    bucket.nodeIds.push(id);
    groupMap.set(key, bucket);
  });

  const groups: GroupNode[] = [...groupMap.entries()]
    .map(([id, info]) => ({ id, name: info.name, count: info.nodeIds.length, nodeIds: info.nodeIds }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const palette = theme === 'dark' ? PALETTE_DARK : PALETTE_LIGHT;
  const colorByGroup = new Map<GroupId, string>();
  groups.forEach((g, i) => colorByGroup.set(g.id, palette[i % palette.length]));

  const fallback = theme === 'dark' ? '#52525b' : '#a1a1aa';
  return {
    groupingId,
    groups,
    nodeToGroup,
    colorOf: (groupId) => (groupId == null ? fallback : colorByGroup.get(groupId) ?? fallback),
  };
}
