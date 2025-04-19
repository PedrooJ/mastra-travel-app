import { z } from 'zod';

export const restaurantInputSchema = z.object({
  location: z.string().describe('Name of the city or "lat,lng" coordinates'),
});

export const restaurantOutputSchema = z.array(
  z.object({
    name: z.string(),
    address: z.string(),
    rating: z.number().optional(),
    openingHours: z.array(z.string()).optional(),
    priceLevel: z.string().optional(), // Formato "2/4 - Moderado"
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
);
