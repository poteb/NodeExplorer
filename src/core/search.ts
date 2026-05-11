import MiniSearch, { type SearchResult } from 'minisearch';
import type { AppGraph } from './graph';

export interface SearchHit {
  id: string;
  label: string;
  score: number;
  match: Record<string, string[]>;
}

export interface SearchIndex {
  search: (query: string, limit?: number) => SearchHit[];
  size: number;
}

const FIELDS = ['label', 'id', 'className', 'namespace', 'member', 'file'] as const;
const STORE_FIELDS = ['label'] as const;

export function buildSearchIndex(graph: AppGraph): SearchIndex {
  const ms = new MiniSearch({
    fields: [...FIELDS],
    storeFields: [...STORE_FIELDS],
    idField: 'id',
    searchOptions: {
      prefix: true,
      fuzzy: 0.15,
      boost: { label: 3, member: 2, className: 2 },
    },
  });

  const docs: { id: string; label: string; className?: string; namespace?: string; member?: string; file?: string }[] = [];
  graph.forEachNode((id, attrs) => {
    docs.push({
      id,
      label: attrs.label,
      className: attrs.className as string | undefined,
      namespace: attrs.namespace as string | undefined,
      member: attrs.member as string | undefined,
      file: attrs.file,
    });
  });
  ms.addAll(docs);

  return {
    size: docs.length,
    search: (query, limit = 50) => {
      if (!query.trim()) return [];
      const results = ms.search(query) as (SearchResult & { label: string })[];
      return results.slice(0, limit).map((r) => ({
        id: String(r.id),
        label: r.label,
        score: r.score,
        match: r.match,
      }));
    },
  };
}
