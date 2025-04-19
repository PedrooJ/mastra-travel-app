import { z } from 'zod';

export const attractionInputSchema = z.object({
  city: z.string().describe('Nombre de la ciudad'),
  startDate: z.string().describe('Fecha inicio en formato YYYY-MM-DD'),
  endDate: z.string().describe('Fecha fin en formato YYYY-MM-DD'),
});

export const attractionOutputSchema = z.array(
  z.object({
    name: z.string(),
    description: z.string().optional(),
    address: z.string().optional(),
    rating: z.string().optional(),
    url: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
);
