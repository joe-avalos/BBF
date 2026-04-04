import { defineCollection, z } from 'astro:content';

const scholars = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    photo: z.string().default(''),
    university: z.string().default(''),
    degree: z.string().default(''),
    status: z.enum(['Active', 'Graduated']).default('Active'),
    cohortYear: z.number().optional(),
  }),
});

export const collections = { scholars };
