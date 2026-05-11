import { useState } from 'react';
import { useAppStore } from '@/state/store';

interface SectionProps {
  title: string;
  options: { value: string; count: number }[];
  active: ReadonlySet<string>;
  onToggle: (value: string) => void;
  initialLimit?: number;
}

function FilterSection({ title, options, active, onToggle, initialLimit = 8 }: SectionProps) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? options : options.slice(0, initialLimit);

  if (options.length === 0) return null;

  return (
    <section className="space-y-1">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{title}</h3>
      <ul className="space-y-0.5">
        {visible.map((opt) => {
          const checked = active.has(opt.value);
          return (
            <li key={opt.value}>
              <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <input
                  type="checkbox"
                  className="accent-sky-500"
                  checked={checked}
                  onChange={() => onToggle(opt.value)}
                />
                <span className="flex-1 truncate" title={opt.value}>
                  {opt.value}
                </span>
                <span className="font-mono text-[10px] text-neutral-500">{opt.count}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {options.length > initialLimit && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-[11px] text-sky-600 hover:underline dark:text-sky-400"
        >
          {showAll ? 'Show less' : `Show all ${options.length}`}
        </button>
      )}
    </section>
  );
}

export function FilterPanel() {
  const facets = useAppStore((s) => s.facets);
  const filters = useAppStore((s) => s.filters);
  const toggleKind = useAppStore((s) => s.toggleKindFilter);
  const toggleProject = useAppStore((s) => s.toggleProjectFilter);
  const toggleNamespace = useAppStore((s) => s.toggleNamespaceFilter);
  const reset = useAppStore((s) => s.resetFilters);

  const hasActive =
    filters.kinds.size > 0 ||
    filters.projects.size > 0 ||
    filters.namespaces.size > 0 ||
    !!filters.searchHits;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold">Filters</h2>
        {hasActive && (
          <button
            type="button"
            onClick={reset}
            className="text-[11px] text-sky-600 hover:underline dark:text-sky-400"
          >
            Reset
          </button>
        )}
      </div>
      <FilterSection title="Kind" options={facets.kinds} active={filters.kinds} onToggle={toggleKind} />
      <FilterSection title="Project" options={facets.projects} active={filters.projects} onToggle={toggleProject} />
      <FilterSection title="Namespace" options={facets.namespaces} active={filters.namespaces} onToggle={toggleNamespace} />
    </div>
  );
}
