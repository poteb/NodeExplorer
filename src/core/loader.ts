import { RawGraphSchema, type RawGraph } from './schema';
import { selectAdapter } from './adapters';
import type { GraphAdapter } from './adapter';
import { buildGraph, type AppGraph } from './graph';
import { applyForceAtlas2Layout } from './layout';

export interface LoadResult {
  graph: AppGraph;
  adapter: GraphAdapter;
  raw: RawGraph;
  source: { name: string; size: number };
}

export async function loadGraphFromFile(file: File, preferredAdapterId?: string): Promise<LoadResult> {
  const text = await file.text();
  return parseAndBuild(text, { name: file.name, size: file.size }, preferredAdapterId);
}

export function parseAndBuild(
  text: string,
  source: { name: string; size: number },
  preferredAdapterId?: string,
): LoadResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON in ${source.name}: ${(err as Error).message}`);
  }

  const validated = RawGraphSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `${source.name} does not match expected {nodes, edges} shape: ${validated.error.issues
        .slice(0, 3)
        .map((i) => i.message)
        .join('; ')}`,
    );
  }

  const adapter = selectAdapter(validated.data, preferredAdapterId);
  const graph = buildGraph(validated.data, adapter);
  applyForceAtlas2Layout(graph);

  return { graph, adapter, raw: validated.data, source };
}
