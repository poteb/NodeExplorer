import type { AppGraph } from './graph';
import type { NodeAttrs } from './adapter';

export interface Filters {
  kinds: ReadonlySet<string>;          // empty = no restriction
  projects: ReadonlySet<string>;       // empty = no restriction
  namespaces: ReadonlySet<string>;     // empty = no restriction
  searchHits: ReadonlySet<string> | null; // null = no search active; set = restrict to these node ids
}

export const emptyFilters: Filters = {
  kinds: new Set(),
  projects: new Set(),
  namespaces: new Set(),
  searchHits: null,
};

export function isVisible(node: NodeAttrs, filters: Filters): boolean {
  if (filters.searchHits && !filters.searchHits.has(node.id)) return false;
  if (filters.kinds.size > 0 && (!node.kind || !filters.kinds.has(node.kind))) return false;
  if (filters.projects.size > 0) {
    const project = node.project as string | undefined;
    if (!project || !filters.projects.has(project)) return false;
  }
  if (filters.namespaces.size > 0) {
    const ns = node.namespace as string | undefined;
    if (!ns || !filters.namespaces.has(ns)) return false;
  }
  return true;
}

export interface FacetCounts {
  kinds: { value: string; count: number }[];
  projects: { value: string; count: number }[];
  namespaces: { value: string; count: number }[];
}

export function computeFacets(graph: AppGraph): FacetCounts {
  const kinds = new Map<string, number>();
  const projects = new Map<string, number>();
  const namespaces = new Map<string, number>();
  graph.forEachNode((_id, attrs) => {
    if (attrs.kind) kinds.set(attrs.kind, (kinds.get(attrs.kind) ?? 0) + 1);
    const project = attrs.project as string | undefined;
    if (project) projects.set(project, (projects.get(project) ?? 0) + 1);
    const ns = attrs.namespace as string | undefined;
    if (ns) namespaces.set(ns, (namespaces.get(ns) ?? 0) + 1);
  });
  const toSorted = (map: Map<string, number>): { value: string; count: number }[] =>
    [...map.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  return {
    kinds: toSorted(kinds),
    projects: toSorted(projects),
    namespaces: toSorted(namespaces),
  };
}
