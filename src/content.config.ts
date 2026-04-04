import { defineCollection, z } from 'astro:content';

const scholars = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    photo: z.string(),
    university: z.string(),
    degree: z.string(),
  }),
});

export const collections = { scholars };
