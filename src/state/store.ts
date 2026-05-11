import { create } from 'zustand';
import type { AppGraph } from '@/core/graph';
import type { GraphAdapter } from '@/core/adapter';
import type { SearchIndex } from '@/core/search';
import type { FacetCounts } from '@/core/filters';
import { buildSearchIndex } from '@/core/search';
import { computeFacets, emptyFilters, type Filters } from '@/core/filters';
import type { SizingMode } from '@/core/sizing';

export type ViewMode = 'overview' | 'focus' | 'path';
export type Theme = 'light' | 'dark';

export interface AppState {
  graph: AppGraph | null;
  adapter: GraphAdapter | null;
  source: { name: string; size: number } | null;
  loadError: string | null;
  loading: boolean;

  searchIndex: SearchIndex | null;
  facets: FacetCounts;

  mode: ViewMode;
  selectedNodeId: string | null;
  theme: Theme;
  epoch: number;

  // Filtering / grouping / search / sizing
  searchQuery: string;
  filters: Filters;
  groupBy: string; // grouping id, 'none' or one from adapter.groupings()
  sizingMode: SizingMode;

  setLoading: (loading: boolean) => void;
  setLoadError: (error: string | null) => void;
  setGraph: (payload: { graph: AppGraph; adapter: GraphAdapter; source: { name: string; size: number } }) => void;
  clearGraph: () => void;
  setMode: (mode: ViewMode) => void;
  setSelectedNode: (id: string | null) => void;
  toggleTheme: () => void;

  setSearchQuery: (query: string) => void;
  toggleKindFilter: (kind: string) => void;
  toggleProjectFilter: (project: string) => void;
  toggleNamespaceFilter: (namespace: string) => void;
  resetFilters: () => void;
  setGroupBy: (groupingId: string) => void;
  setSizingMode: (mode: SizingMode) => void;
}

const STORAGE_KEY = 'node-explorer:prefs';

interface PersistedPrefs {
  theme?: Theme;
  groupBy?: string;
  sizingMode?: SizingMode;
}

function loadPrefs(): PersistedPrefs {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedPrefs) : {};
  } catch {
    return {};
  }
}

function savePrefs(prefs: PersistedPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // storage unavailable (e.g. private mode); preferences just don't persist
  }
}

const initialPrefs = loadPrefs();
const initialTheme: Theme = initialPrefs.theme ?? (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

function toggleSetEntry(set: ReadonlySet<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export const useAppStore = create<AppState>((set, get) => ({
  graph: null,
  adapter: null,
  source: null,
  loadError: null,
  loading: false,

  searchIndex: null,
  facets: { kinds: [], projects: [], namespaces: [] },

  mode: 'overview',
  selectedNodeId: null,
  theme: initialTheme,
  epoch: 0,

  searchQuery: '',
  filters: emptyFilters,
  groupBy: initialPrefs.groupBy ?? 'none',
  sizingMode: initialPrefs.sizingMode ?? 'uniform',

  setLoading: (loading) => set({ loading }),
  setLoadError: (loadError) => set({ loadError, loading: false }),
  setGraph: ({ graph, adapter, source }) => {
    const facets = computeFacets(graph);
    const searchIndex = buildSearchIndex(graph);
    set((s) => ({
      graph,
      adapter,
      source,
      facets,
      searchIndex,
      loadError: null,
      loading: false,
      selectedNodeId: null,
      searchQuery: '',
      filters: emptyFilters,
      epoch: s.epoch + 1,
    }));
  },
  clearGraph: () =>
    set((s) => ({
      graph: null,
      adapter: null,
      source: null,
      searchIndex: null,
      facets: { kinds: [], projects: [], namespaces: [] },
      selectedNodeId: null,
      searchQuery: '',
      filters: emptyFilters,
      epoch: s.epoch + 1,
    })),
  setMode: (mode) => set({ mode }),
  setSelectedNode: (selectedNodeId) => set({ selectedNodeId }),
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    savePrefs({ ...loadPrefs(), theme: next });
    set({ theme: next });
  },

  setSearchQuery: (searchQuery) => {
    const { searchIndex } = get();
    let searchHits: ReadonlySet<string> | null = null;
    if (searchIndex && searchQuery.trim()) {
      const hits = searchIndex.search(searchQuery, 200);
      searchHits = new Set(hits.map((h) => h.id));
    }
    set((s) => ({
      searchQuery,
      filters: { ...s.filters, searchHits },
      epoch: s.epoch + 1,
    }));
  },
  toggleKindFilter: (kind) =>
    set((s) => ({ filters: { ...s.filters, kinds: toggleSetEntry(s.filters.kinds, kind) }, epoch: s.epoch + 1 })),
  toggleProjectFilter: (project) =>
    set((s) => ({ filters: { ...s.filters, projects: toggleSetEntry(s.filters.projects, project) }, epoch: s.epoch + 1 })),
  toggleNamespaceFilter: (namespace) =>
    set((s) => ({ filters: { ...s.filters, namespaces: toggleSetEntry(s.filters.namespaces, namespace) }, epoch: s.epoch + 1 })),
  resetFilters: () => set((s) => ({ filters: emptyFilters, searchQuery: '', epoch: s.epoch + 1 })),
  setGroupBy: (groupingId) => {
    savePrefs({ ...loadPrefs(), groupBy: groupingId });
    set((s) => ({ groupBy: groupingId, epoch: s.epoch + 1 }));
  },
  setSizingMode: (sizingMode) => {
    savePrefs({ ...loadPrefs(), sizingMode });
    set((s) => ({ sizingMode, epoch: s.epoch + 1 }));
  },
}));
