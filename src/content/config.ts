import { defineCollection, z } from 'astro:content';

const services = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title:        z.string(),
    slug:         z.string(),
    description:  z.string(),
    serviceArea:  z.array(z.string()),
    featuredImage: image().optional(),
    order:        z.number(),
    featured:     z.boolean().default(false),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title:         z.string(),
    slug:          z.string(),
    clientType:    z.enum(['residential', 'commercial', 'custom-home', 'remodel']),
    services:      z.array(z.string()),
    location:      z.string(),
    completionDate: z.string(), // YYYY-MM format
    heroImage:     image(),
    gallery:       z.array(image()).optional(),
    description:   z.string(),
    featured:      z.boolean().default(false),
  }),
});

const locations = defineCollection({
  type: 'content',
  schema: z.object({
    city:         z.string(),
    slug:         z.string(),
    state:        z.string(),
    county:       z.string(),
    description:  z.string(),
    localSignals: z.array(z.string()),
    services:     z.array(z.string()),
    featured:     z.boolean().default(false),
  }),
});

const faqs = defineCollection({
  type: 'content',
  schema: z.object({
    question: z.string(),
    answer:   z.string(),
    category: z.string(),
    order:    z.number(),
  }),
});

const testimonials = defineCollection({
  type: 'data',
  schema: z.object({
    name:     z.string(),
    location: z.string(),
    service:  z.string(),
    quote:    z.string(),
    rating:   z.number().min(1).max(5),
    date:     z.string(),
    source:   z.enum(['google', 'direct', 'yelp', 'houzz']),
    verified: z.boolean().default(true),
    featured: z.boolean().default(false),
    audiences: z.array(z.enum(['residential', 'builder'])).default(['residential']),
  }),
});

export const collections = { services, projects, locations, faqs, testimonials };
