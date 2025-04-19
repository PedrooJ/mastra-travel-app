import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { getWeather } from '../tools/weather'; 
import { getAttractions } from '../tools/attractions';
import { getEvents } from '../tools/events';
import { getHotels } from '../tools/hotels';
import { getRestaurants } from '../tools/restaurants';
import { travelAgent } from '../agents/travelAgent';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import {
  weatherInputSchema,
  weatherOutputSchema,
  eventInputSchema,
  eventOutputSchema,
  attractionInputSchema,
  attractionOutputSchema,
  hotelInputSchema,
  hotelOutputSchema,
  restaurantInputSchema,
  restaurantOutputSchema,
} from '../schemas';


/**
 * Fetches weather forecast from Open-Meteo API for a given city and date range
 */
const fetchWeather = new Step({
  id: 'fetch-weather',
  description: 'Obtiene el pronóstico del clima para una ciudad y rango de fechas usando Open-Meteo',
  inputSchema: weatherInputSchema,
  outputSchema: weatherOutputSchema,
  execute: async ({ context }) => {
    const triggerData = context?.getStepResult<{ city: string; startDate: string; endDate: string }>('trigger');

    if (!triggerData) {
      throw new Error('No se encontró la información del trigger');
    }

    const weather = await getWeather(triggerData.city, triggerData.startDate, triggerData.endDate);
    return weather;
  },
});

/**
 * Fetches public events from Ticketmaster API for a given city and date range
 */
const fetchEvents = new Step({
  id: 'fetch-events',
  description: 'Obtiene eventos públicos desde Ticketmaster para una ciudad y fechas dadas',
  inputSchema: eventInputSchema,
  outputSchema: eventOutputSchema,
  execute: async ({ context }) => {
    const triggerData = context?.getStepResult<{ city: string; startDate: string; endDate: string }>('trigger');

    if (!triggerData) {
      throw new Error('No se encontró la información del trigger');
    }

    const events = await getEvents(triggerData.city, triggerData.startDate, triggerData.endDate);
    return events;
  },
});

/**
 * Fetches tourist attractions from TripAdvisor for a given city and date range
 */
const fetchAttractions = new Step({
  id: 'fetch-attractions',
  description: 'Obtiene atracciones turísticas desde TripAdvisor para una ciudad y fechas dadas',
  inputSchema: attractionInputSchema,
  outputSchema: attractionOutputSchema,
  execute: async ({ context }) => {
    const triggerData = context?.getStepResult<{ city: string; startDate: string; endDate: string }>('trigger');

    if (!triggerData) {
      throw new Error('No se encontró la información del trigger');
    }

    const attractions = await getAttractions(triggerData.city, triggerData.startDate, triggerData.endDate);
    return attractions;
  },
});

/**
 * Fetches hotel availability from Booking.com for a given city and date range
 */
const fetchHotels = new Step({
  id: 'fetch-hotels',
  description: 'Obtiene alojamientos disponibles desde Booking.com para una ciudad, fechas y cantidad de adultos',
  inputSchema: hotelInputSchema,
  outputSchema: hotelOutputSchema,
  execute: async ({ context }) => {
    const triggerData = context?.getStepResult<{ city: string; startDate: string; endDate: string; adults: number }>('trigger');

    if (!triggerData) {
      throw new Error('No se encontró la información del trigger');
    }

    const hotels = await getHotels(
      triggerData.city,
      triggerData.startDate,
      triggerData.endDate,
      triggerData.adults
    );

    return hotels;
  },
});

/**
 * Fetches top-rated restaurants with details from Google Places API for a given city
 */
const fetchRestaurants = new Step({
  id: 'fetch-restaurants',
  description: 'Obtiene restaurantes mejor valorados con horarios de apertura y rango de precios desde Google Places API',
  inputSchema: restaurantInputSchema,
  outputSchema: restaurantOutputSchema,
  execute: async ({ context }) => {
    const triggerData = context?.getStepResult<{ city: string }>('trigger');

    if (!triggerData) {
      throw new Error('No se encontró la información del trigger');
    }

    const restaurants = await getRestaurants(triggerData.city);
    return restaurants;
  },
});

/**
 * Plan activities based on the output of all previous steps
 */
const planActivities = new Step({
  id: 'plan-activities',
  description: 'Sugiere actividades y genera un PDF con el itinerario basado en clima, eventos, atracciones, hoteles y restaurantes disponibles',
  execute: async ({ context }) => {
    const weather = context?.getStepResult('fetch-weather');
    const events = context?.getStepResult('fetch-events');
    const attractions = context?.getStepResult('fetch-attractions');
    const hotels = context?.getStepResult('fetch-hotels');
    const restaurants = context?.getStepResult('fetch-restaurants');

    if (!weather || !events || !attractions || !hotels || !restaurants) {
      throw new Error('Faltan datos de uno o más pasos anteriores');
    }

    const prompt = `
      Eres un asistente de viajes. Con base en la siguiente información, sugiere un itinerario con actividades personalizadas:

      🌤️ **Clima pronosticado**:
      ${JSON.stringify(weather, null, 2)}

      🎭 **Eventos disponibles**:
      ${JSON.stringify(events, null, 2)}

      📸 **Atracciones turísticas**:
      ${JSON.stringify(attractions, null, 2)}

      🏨 **Hoteles sugeridos**:
      ${JSON.stringify(hotels, null, 2)}

      🍽️ **Restaurantes recomendados**:
      ${JSON.stringify(restaurants, null, 2)}

      Por favor sugiere un itinerario atractivo considerando el clima, los gustos comunes de los turistas y la disponibilidad de actividades.
    `;

    const response = await travelAgent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let activitiesText = '';
    for await (const chunk of response.textStream) {
      // process.stdout.write(chunk);
      activitiesText += chunk;
    }
    // Crear el PDF
    const doc = new PDFDocument();
    const pdfFileName = `travel-itinerary-${Date.now()}.pdf`;
    const outputDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const pdfFilePath = path.join(outputDir, pdfFileName);

    doc.pipe(fs.createWriteStream(pdfFilePath));

    doc.fontSize(20).text('🧳 Itinerario de Viaje Personalizado', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(activitiesText, { align: 'left' });

    doc.end();
    console.log("Itinerario generado exitosamente en: ", pdfFilePath);
    return {
      message: 'Itinerario generado exitosamente',
      pdfPath: pdfFilePath,
    };
  },
});

/**
 * Travel planning workflow
 */
const travelWorkflow = new Workflow({
  name: 'travel-workflow',
  triggerSchema: z.object({
    city: z.string().describe('The city to make the travel plan for'),
    startDate: z.string().describe('Start date in YYYY-MM-DD format'),
    endDate: z.string().describe('End date in YYYY-MM-DD format'),
    adults: z.number().describe('Number of adults'),
  }),
})
  .step(fetchWeather)
  .then(fetchEvents)
  .then(fetchRestaurants)
  .then(fetchHotels)
  .then(fetchAttractions)
  .then(planActivities);

travelWorkflow.commit();

export { travelWorkflow };
