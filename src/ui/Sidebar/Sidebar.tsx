import { SearchBox } from './SearchBox';
import { FilterPanel } from './FilterPanel';
import { GroupingTree } from './GroupingTree';

export function Sidebar() {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-neutral-200 bg-white/70 p-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70">
      <SearchBox />
      <GroupingTree />
      <FilterPanel />
    </aside>
  );
}
