import { createTool } from "@mastra/core/tools";
import axios from "axios";
import { z } from "zod";

export interface Attraction {
  name: string;
  description?: string;
  address?: string;
  rating?: string;
  url?: string;
  image?: string;
  latitude?: number;
  longitude?: number;
}

const attractionSchema = z.array(
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

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const attractionsTool = createTool({
  id: "get-tripadvisor-attractions",
  description: "Obtiene sitios turísticos desde TripAdvisor usando RapidAPI",
  inputSchema: z.object({
    city: z.string().describe("Nombre de la ciudad"),
    startDate: z.string().describe("Fecha inicio en formato YYYY-MM-DD"),
    endDate: z.string().describe("Fecha fin en formato YYYY-MM-DD"),
  }),
  outputSchema: attractionSchema,
  execute: async ({ context }) => {
    const { city, startDate, endDate } = context;
    return await getAttractions(city, startDate, endDate);
  },
});

export async function getAttractions(
  city: string,
  startDate: string,
  endDate: string
): Promise<Attraction[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = "tripadvisor-com1.p.rapidapi.com";

  const headers = {
    "x-rapidapi-key": apiKey!,
    "x-rapidapi-host": apiHost,
  };

  // Paso 1: Obtener geoId
  const geoResponse = await axios.get("https://tripadvisor-com1.p.rapidapi.com/auto-complete", {
    headers,
    params: {
      query: city,
      lang: "es_ES",
    },
  });

  const results = geoResponse.data?.data ?? [];
  const cityItem = results.find(
    (item: any) =>
      item.__typename === "AppPresentation_TypeaheadResult" &&
      item.trackingItems?.dataType === "LOCATION" &&
      item.geoId
  );

  const geoId = cityItem?.geoId;
  if (!geoId) {
    return [
      {
        name: `No se pudo obtener geoId para la ciudad "${city}"`,
      },
    ];
  }

  // Paso 2: Obtener atracciones
  const attractionsResponse = await axios.get(
    "https://tripadvisor-com1.p.rapidapi.com/attractions/search",
    {
      headers,
      params: {
        geoId,
        lang: "es_ES",
        startDate,
        endDate,
      },
    }
  );

  const attractions = attractionsResponse.data?.data?.attractions ?? [];
  if (attractions.length === 0) {
    return [
      {
        name: "No se encontraron atracciones turísticas.",
      },
    ];
  }

  // Tomar solo las primeras 15 atracciones
  const limitedAttractions = attractions.slice(0, 15);

  // Paso 3: Enriquecer cada atracción con lat/lng usando el contentId con delay de 300ms
  const detailedAttractions: Attraction[] = [];

  for (const item of limitedAttractions) {
    const contentId = item?.cardLink?.route?.params?.contentId;
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (contentId) {
      try {
        const detailRes = await axios.get(
          "https://tripadvisor-com1.p.rapidapi.com/attractions/details",
          {
            headers,
            params: {
              contentId,
              units: "miles",
              startDate,
              endDate,
            },
          }
        );

        const locationSection = detailRes.data?.data?.sections?.find(
          (section: any) => section.__typename === "AppPresentation_PoiLocationV2"
        );

        latitude = locationSection?.address?.geoPoint?.latitude;
        longitude = locationSection?.address?.geoPoint?.longitude;

      } catch (error) {
        console.error("Error fetching details for contentId", contentId, error?.response?.status || error.message);
      }

      // Esperar 300 ms antes de la próxima solicitud (máx ~3.3 req/s)
      await delay(300);
    }

    // Solo incluir atracciones que tengan lat y lng definidos
    if (latitude != null && longitude != null) {
      detailedAttractions.push({
        name: item?.cardTitle?.string ?? "Sin nombre",
        description: item?.descriptiveText?.text,
        address: item?.distance?.text,
        rating: item?.bubbleRating?.rating
          ? `${item.bubbleRating.rating}/5`
          : undefined,
        url: item?.cardLink?.route?.url,
        latitude,
        longitude,
      });
    }
  }

  return detailedAttractions;

}
