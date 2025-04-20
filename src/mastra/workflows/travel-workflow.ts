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
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  description: 'Genera un itinerario en texto basado en clima, eventos, atracciones, hoteles y restaurantes disponibles',
  execute: async ({ context }) => {
    const weather = context?.getStepResult('fetch-weather');
    const events = context?.getStepResult('fetch-events');
    const attractions = context?.getStepResult('fetch-attractions');
    const hotels = context?.getStepResult('fetch-hotels');
    const restaurants = context?.getStepResult('fetch-restaurants');
    const triggerData = context?.getStepResult<{ city: string; startDate: string; endDate: string; adults: number; price: number }>('trigger');

    if (!weather || !events || !attractions || !hotels || !restaurants || !triggerData) {
      throw new Error('Faltan datos de uno o más pasos anteriores');
    }

    const prompt = `
      Información disponible:
      -Precio máximo: ${triggerData.price}
      -Ciudad destino: ${triggerData.city}
      -Fecha de inicio: ${triggerData.startDate}
      -Fecha de fin: ${triggerData.endDate}
      -Cantidad de adultos: ${triggerData.adults}

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
    `;

    const response = await travelAgent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let activitiesText = '';
    for await (const chunk of response.textStream) {
      activitiesText += chunk;
    }

    return {
      message: 'Itinerario generado en texto',
      itineraryText: activitiesText,
    };
  },
});



/**
 * Generates a PDF with formatted itinerary text.
 */
const generateItineraryPdf = new Step({
  id: 'generate-itinerary-pdf',
  description: 'Genera un PDF estéticamente mejorado a partir del itinerario en texto enriquecido',
  execute: async ({ context }) => {
    const itineraryText = context?.getStepResult('plan-activities')?.itineraryText;

    if (!itineraryText) throw new Error('No se encontró el texto del itinerario');

    const PDFDocument = require('pdfkit');
    const fs = require('fs');
    const path = require('path');

    const outputDir = path.resolve(__dirname, '../../src/pdf');
    const fontsDir = path.resolve(__dirname, '../../src/fonts');

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const pdfFileName = `travel-itinerary-${Date.now()}.pdf`;
    const pdfFilePath = path.join(outputDir, pdfFileName);
    const regularFont = path.join(fontsDir, 'NotoSans-Regular.ttf');
    const boldFont = path.join(fontsDir, 'NotoSans-Bold.ttf');

    const doc = new PDFDocument({ margin: 50 });

    doc.registerFont('Regular', regularFont);
    doc.registerFont('Bold', boldFont);
    doc.pipe(fs.createWriteStream(pdfFilePath));

    // Título principal
    doc.font('Bold').fontSize(26).fillColor('#2c3e50').text('Itinerario de Viaje Personalizado', { align: 'center' });
    doc.moveDown(1.5);

    const lines = itineraryText.split('\n');

    for (let rawLine of lines) {
      const line = rawLine.trim();

      if (line === '') {
        doc.moveDown(0.7);
        continue;
      }

      if (line === '---') {
        doc.moveDown(0.5);
        doc.lineWidth(0.5).strokeColor('#cccccc')
          .moveTo(doc.page.margins.left, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .stroke();
        doc.moveDown(0.5);
        continue;
      }      

      if (/^\*\*(.+?)\*\*$/.test(line)) {
        const match = line.match(/^\*\*(.+?)\*\*$/);
        const content = match[1];
        const isDia = content.trim().toUpperCase().startsWith("DIA");
      
        doc.moveDown(0.4);
      
        if (isDia) {
          doc.font('Bold').fontSize(14).fillColor('#1a73e8').text(content.toUpperCase());
          doc.moveDown(0.2);
          doc.lineWidth(1).strokeColor('#1a73e8')
            .moveTo(doc.page.margins.left, doc.y)
            .lineTo(doc.page.width - doc.page.margins.right, doc.y)
            .stroke();
        } else {
          doc.font('Bold').fontSize(12).fillColor('#000000').text(content.toUpperCase());
          doc.moveDown(0.3);
        }
        continue;
      }

      // Viñetas
      if (line.startsWith('• ') || line.startsWith('- ')) {
        const content = line.slice(2).trim();
        
        if (content.includes(':')) {
          const [beforeColon, afterColon] = content.split(/:(.*)/); // divide solo en la primera aparición de :
          doc.font('Bold').fontSize(10).fillColor('#2c3e50').text('• ' + beforeColon + ':', { continued: true, indent: 20 });
          doc.font('Regular').fontSize(10).fillColor('#2c3e50').text(' ' + afterColon.trim());
        } else {
          doc.font('Regular').fontSize(10).fillColor('#2c3e50').text('• ' + content, { indent: 20 });
        }
      
        continue;
      }
      

      // Texto enriquecido: negrita en línea
      const parts = line.split(/(\*\*.+?\*\*)/);
      doc.fontSize(11).fillColor('#333333');
      for (const part of parts) {
        if (/^\*\*(.+?)\*\*$/.test(part)) {
          doc.font('Bold').text(part.replace(/\*\*/g, ''), { continued: true });
        } else {
          doc.font('Regular').text(part, { continued: true });
        }
      }
      doc.text('', { continued: false });
    }

    doc.end();
    console.log("Itinerario PDF embellecido generado en: ", pdfFilePath);

    return {
      message: 'PDF con formato mejorado generado exitosamente',
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
    price: z.string().describe('Price range for the travel plan'),
  }),
})
  .step(fetchWeather)
  .then(fetchEvents)
  .then(fetchRestaurants)
  .then(fetchHotels)
  .then(fetchAttractions)
  .then(planActivities)
  .then(generateItineraryPdf);

travelWorkflow.commit();

export { travelWorkflow };
