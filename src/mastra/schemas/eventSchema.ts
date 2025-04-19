import { z } from 'zod';

export const eventInputSchema = z.object({
  city: z.string().describe('Nombre de la ciudad'),
  startDate: z.string().describe('Fecha de inicio en formato YYYY-MM-DD'),
  endDate: z.string().describe('Fecha de fin en formato YYYY-MM-DD'),
});

export const eventOutputSchema = z.array(
  z.object({
    name: z.string(),
    url: z.string(),
    startDate: z.string(),
    venue: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
);