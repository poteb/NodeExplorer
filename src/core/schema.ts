import { z } from 'zod';

export const RawNodeSchema = z.object({
  id: z.string(),
  kind: z.string().optional(),
  file: z.string().optional(),
  line: z.number().optional(),
}).passthrough();

export const RawEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  file: z.string().optional(),
  line: z.number().optional(),
}).passthrough();

export const RawGraphSchema = z.object({
  nodes: z.array(RawNodeSchema),
  edges: z.array(RawEdgeSchema),
}).passthrough();

export type RawNode = z.infer<typeof RawNodeSchema>;
export type RawEdge = z.infer<typeof RawEdgeSchema>;
export type RawGraph = z.infer<typeof RawGraphSchema>;
