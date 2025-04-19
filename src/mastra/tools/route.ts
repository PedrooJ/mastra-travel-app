import { createTool } from "@mastra/core/tools";
import axios from "axios";
import { z } from "zod";

export interface RouteResult {
  distance: string; // e.g. "3 km 250 m"
  duration: string; // e.g. "0h 35m 20s"
}

export const routeSchema = z.object({
  car: z.object({
    distance: z.string().describe("Distancia total del trayecto en coche (ej: '3 km 250 m')"),
    duration: z.string().describe("Duración estimada del trayecto en coche (ej: '0h 35m 20s')"),
  }),
  walk: z.object({
    distance: z.string().describe("Distancia total del trayecto andando (ej: '2 km 800 m')"),
    duration: z.string().describe("Duración estimada del trayecto andando (ej: '0h 42m 10s')"),
  }),
});

export const routeTool = createTool({
  id: "get-route-between-coordinates",
  description: "Get route distance and duration between two coordinates using OpenRouteService API (for both car and walking)",
  inputSchema: z.object({
    startLat: z.string().describe("Latitude of the starting point (e.g. '41.403423')"),
    startLng: z.string().describe("Longitude of the starting point (e.g. '2.174611')"),
    endLat: z.string().describe("Latitude of the destination (e.g. '41.391712')"),
    endLng: z.string().describe("Longitude of the destination (e.g. '2.164824')"),
  }),
  outputSchema: routeSchema,
  execute: async ({ context }) => {
    return await getBothRoutes(context);
  },
});

async function getRoute({
  startLat,
  startLng,
  endLat,
  endLng,
  profile,
}: {
  startLat: string;
  startLng: string;
  endLat: string;
  endLng: string;
  profile: string;
}): Promise<{ distance: number; duration: number }> {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  const url = `https://api.openrouteservice.org/v2/directions/${profile}`;

  try {
    const response = await axios.post(
      url,
      {
        coordinates: [
          [parseFloat(startLng), parseFloat(startLat)],
          [parseFloat(endLng), parseFloat(endLat)],
        ],
      },
      {
        headers: {
          Authorization: apiKey!,
          "Content-Type": "application/json",
        },
      }
    );

    const summary = response.data.routes[0].summary;
    return {
      distance: summary.distance,
      duration: summary.duration,
    };
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.response.statusText;
      throw new Error(`Error ${status} - ${message}`);
    } else if (error.request) {
      throw new Error("No response received from OpenRouteService");
    } else {
      throw new Error(`Unexpected error: ${error.message}`);
    }
  }
}

function formatDistance(meters: number): string {
  const km = Math.floor(meters / 1000);
  const m = Math.round(meters % 1000);
  return `${km} km ${m} m`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

async function getBothRoutes({
  startLat,
  startLng,
  endLat,
  endLng,
}: {
  startLat: string;
  startLng: string;
  endLat: string;
  endLng: string;
}): Promise<{
  car: RouteResult;
  walk: RouteResult;
}> {
  const [carRaw, walkRaw] = await Promise.all([
    getRoute({ startLat, startLng, endLat, endLng, profile: "driving-car" }),
    getRoute({ startLat, startLng, endLat, endLng, profile: "foot-walking" }),
  ]);

  const car: RouteResult = {
    distance: formatDistance(carRaw.distance),
    duration: formatDuration(carRaw.duration),
  };

  const walk: RouteResult = {
    distance: formatDistance(walkRaw.distance),
    duration: formatDuration(walkRaw.duration),
  };

  return { car, walk };
}
