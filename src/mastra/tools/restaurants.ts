import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const restaurantSchema = z.array(
  z.object({
    name: z.string(),
    address: z.string(),
    rating: z.number().optional(),
    openingHours: z.array(z.string()).optional(),
    priceLevel: z.string().optional(), // Ahora en formato "2/4 - Moderado"
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
);

export const restaurantsTool = createTool({
  id: 'get-restaurants',
  description: 'Get best-rated restaurants with opening hours and price range using Google Places API',
  inputSchema: z.object({
    location: z.string().describe('Name of the city or "lat,lng" coordinates'),
  }),
  outputSchema: restaurantSchema,
  execute: async ({ context }) => {
    const { location } = context;
    return await getRestaurants(location);
  },
});

export const getRestaurants = async (location: string) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    `restaurants in ${location}`,
  )}&type=restaurant&rankby=prominence&key=${apiKey}`;

  const searchResponse = await fetch(searchUrl);
  const searchData = await searchResponse.json();

  if (!searchData.results) {
    throw new Error('No restaurants found');
  }

  const topResults = searchData.results.slice(0, 15);

  const enrichedResults = await Promise.all(
    topResults.map(async (place: any) => {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,rating,opening_hours,price_level,geometry&key=${apiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      const result = detailsData.result;
      const priceLevel = result.price_level;

      return {
        name: result.name,
        address: result.formatted_address,
        rating: result.rating,
        openingHours: result.opening_hours?.weekday_text ?? [],
        priceLevel: getPriceDescriptionFormatted(priceLevel),
        lat: result.geometry?.location?.lat,
        lng: result.geometry?.location?.lng,
      };
    }),
  );

  return enrichedResults;
};

// Devuelve el nivel de precio con formato "2/4 - Moderado"
const getPriceDescriptionFormatted = (level?: number): string | undefined => {
  if (level === undefined) return undefined;
  const descriptions = ['0/4 - Gratis', '1/4 - Económico', '2/4 - Moderado', '3/4 - Caro', '4/4 - Muy caro'];
  return descriptions[level] ?? 'Desconocido';
};
