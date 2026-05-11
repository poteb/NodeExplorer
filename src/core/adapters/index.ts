import type { GraphAdapter } from '../adapter';
import { csharpAdapter } from './csharp';
import { genericAdapter } from './generic';

export const ADAPTERS: GraphAdapter[] = [csharpAdapter, genericAdapter];

export function selectAdapter(raw: unknown, preferred?: string): GraphAdapter {
  if (preferred) {
    const found = ADAPTERS.find((a) => a.id === preferred);
    if (found) return found;
  }
  for (const adapter of ADAPTERS) {
    if (adapter.detect?.(raw)) return adapter;
  }
  return genericAdapter;
}

export { csharpAdapter, genericAdapter };
