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

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    titleEs: z.string().optional(),
    date: z.date(),
    excerpt: z.string(),
    excerptEs: z.string().optional(),
    image: z.string().optional(),
    author: z.string().default('BBF'),
  }),
});

export const collections = { scholars, blog };
