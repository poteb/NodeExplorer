import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/state/store';

export function SearchBox() {
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const searchIndex = useAppStore((s) => s.searchIndex);
  const setSelectedNode = useAppStore((s) => s.setSelectedNode);
  const storeQuery = useAppStore((s) => s.searchQuery);
  const [draft, setDraft] = useState(storeQuery);

  // Debounce input -> store updates
  useEffect(() => {
    const handle = setTimeout(() => {
      if (draft !== storeQuery) setSearchQuery(draft);
    }, 120);
    return () => clearTimeout(handle);
  }, [draft, storeQuery, setSearchQuery]);

  const results = useMemo(() => {
    if (!searchIndex || !draft.trim()) return [];
    return searchIndex.search(draft, 12);
  }, [searchIndex, draft]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search nodes…"
          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs placeholder:text-neutral-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        {draft && (
          <button
            type="button"
            onClick={() => {
              setDraft('');
              setSearchQuery('');
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded px-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="Clear"
          >
            ×
          </button>
        )}
      </div>
      {results.length > 0 && (
        <ul className="max-h-48 overflow-y-auto rounded-md border border-neutral-200 bg-white text-xs shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          {results.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                onClick={() => setSelectedNode(hit.id)}
                className="block w-full truncate px-2 py-1 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title={hit.id}
              >
                {hit.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
