import { z } from 'zod';

export const skillMetadataSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  project_context: z
    .object({
      recommended: z.array(z.string()).optional().default([]),
    })
    .optional()
    .default({ recommended: [] }),
});

export const engineeringManifestSchema = z.object({
  version: z.literal(1),
  registry: z.object({
    type: z.enum(['local', 'git']),
    path: z.string().optional(),
    url: z.string().optional(),
    ref: z.string().optional(),
  }),
  skills: z.record(z.string(), z.string()),
  context: z.record(z.string(), z.string()).optional().default({}),
});
