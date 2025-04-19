import { createTool } from "@mastra/core/tools";
import axios from "axios";
import { z } from "zod";

export interface Event {
  name: string;
  description?: string;
  url: string;
  startDate: string;
  venue: string;
  latitude?: number;
  longitude?: number;
  image?: string;
}

const eventSchema = z.array(z.object({
  name: z.string(),
  url: z.string(),
  startDate: z.string(),
  venue: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
}));

export const eventsTool = createTool({
  id: "get-ticketmaster-events",
  description: "Get public events by city and date using Ticketmaster API",
  inputSchema: z.object({
    city: z.string().describe("Name of the city"),
    startDate: z.string().describe("Start date in YYYY-MM-DD format"),
    endDate: z.string().describe("End date in YYYY-MM-DD format"),
  }),
  outputSchema: eventSchema,
  execute: async ({ context }) => {
    const { city, startDate, endDate } = context;
    return await getEvents(city, startDate, endDate);
  },
});

export async function getEvents(
  city: string,
  startDate: string,
  endDate: string
): Promise<Event[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  const startDateTime = `${startDate}T00:00:00Z`;
  const endDateTime = `${endDate}T23:59:59Z`;

  const response = await axios.get("https://app.ticketmaster.com/discovery/v2/events.json", {
    params: {
      apikey: apiKey,
      city,
      startDateTime,
      endDateTime,
      sort: "date,asc",
    },
  });

  const events = response.data._embedded?.events || [];

  if (events.length === 0) {
    return [{
      name: "No hay eventos especiales programados para esas fechas",
      url: "",
      startDate: "",
      venue: city,
    }];
  }

  return events.map((e: any) => {
    const venue = e._embedded.venues[0];
    return {
      name: e.name,
      url: e.url,
      startDate: e.dates.start.dateTime,
      venue: venue.name,
      latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : undefined,
      longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : undefined,
    };
  });
}
