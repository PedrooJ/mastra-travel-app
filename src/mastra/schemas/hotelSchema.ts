import { z } from 'zod';

export const hotelInputSchema = z.object({
  city: z.string().describe("City name"),
  checkInDate: z.string().describe("Start date in YYYY-MM-DD format"),
  checkOutDate: z.string().describe("End date in YYYY-MM-DD format"),
  adults: z.number().describe("Number of adults"),
});

export const hotelOutputSchema = z.array(z.object({
  name: z.string(),
  address: z.string(),
  price: z.string().optional(),
  stars: z.number().optional(),
  url: z.string(),
  image: z.string().optional(),
}));
