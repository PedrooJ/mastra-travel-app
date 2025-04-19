import { createTool } from "@mastra/core/tools";
import axios from "axios";
import { z } from "zod";

export interface Hotel {
  name: string;
  address: string;
  price?: string;
  stars?: number;
  url: string;
  image?: string;
}

const hotelSchema = z.array(z.object({
  name: z.string(),
  address: z.string(),
  price: z.string().optional(),
  stars: z.number().optional(),
  url: z.string(),
  image: z.string().optional(),
}));

export const hotelsTool = createTool({
  id: "get-booking-hotels",
  description: "Get available hotels from Booking.com using RapidAPI",
  inputSchema: z.object({
    city: z.string().describe("City name"),
    checkInDate: z.string().describe("Start date in YYYY-MM-DD format"),
    checkOutDate: z.string().describe("End date in YYYY-MM-DD format"),
    adults: z.number().describe("Number of adults"),
  }),
  outputSchema: hotelSchema,
  execute: async ({ context }) => {
    const { city, checkInDate, checkOutDate, adults } = context;
    return await getHotels(city, checkInDate, checkOutDate, adults);
  },
});

export async function getHotels(
  city: string,
  checkInDate: string,
  checkOutDate: string,
  adults: number
): Promise<Hotel[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = "booking-com15.p.rapidapi.com";

  // Paso 1: Obtener destino
  const locationRes = await axios.get("https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination", {
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": apiHost,
    },
    params: {
      query: city,
      languagecode: "en-us",
    },
  });

  const location = locationRes.data.data[0];

  if (!location) {
    return [{
      name: "No se encontró la ciudad",
      address: city,
      url: "",
    }];
  }

  const dest_id = location.dest_id;

  // Paso 2: Buscar hoteles
  const response = await axios.get("https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels", {
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": apiHost,
    },
    params: {
      dest_id,
      search_type: "CITY",
      arrival_date: checkInDate,
      departure_date: checkOutDate,
      adults,
      room_qty: 1,
      page_number: 1,
      units: "metric",
      temperature_unit: "c",
      languagecode: "en-us",
      currency_code: "EUR",
    },
  });

  const hotels = response.data.data.hotels || [];

  if (hotels.length === 0) {
    return [{
      name: "No se encontraron alojamientos disponibles",
      address: city,
      url: "",
    }];
  }

  return hotels.map((hotel: any) => {
    const property = hotel.property;

    return {
      name: property.name,
      address: city,
      price: property.priceBreakdown?.grossPrice?.value
        ? `${property.priceBreakdown.grossPrice.value.toFixed(2)} ${property.priceBreakdown.grossPrice.currency} (Total for stay)`
        : undefined,
      stars: property.propertyClass || undefined,
      url: `https://www.booking.com/hotel/${property.id}.html`,
      checkinTime: property.checkin?.fromTime && property.checkin?.untilTime
        ? `From ${property.checkin.fromTime} to ${property.checkin.untilTime}`
        : undefined,
      checkoutTime: property.checkout?.fromTime && property.checkout?.untilTime
        ? `From ${property.checkout.fromTime} to ${property.checkout.untilTime}`
        : undefined,
      rating: property.reviewScore
        ? `${property.reviewScore} - ${property.reviewScoreWord} (${property.reviewCount} reviews)`
        : undefined,
      latitude: property.latitude,
      longitude: property.longitude,
    };
  });
}
