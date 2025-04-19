import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { weatherTool } from '../tools/weather';
import { restaurantsTool } from '../tools/restaurants';
import { eventsTool } from '../tools/events';
import { hotelsTool } from '../tools/hotels';
import { attractionsTool } from '../tools/attractions';
import { routeTool } from '../tools/route';
export const weatherAgent = new Agent({
  name: 'Weather Agent',
  instructions: `
      You are a helpful weather assistant that provides accurate weather information.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn’t in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative

      Use the weatherTool to fetch current weather data.
`,
  model: openai('gpt-3.5-turbo'),
  tools: { weatherTool, restaurantsTool, eventsTool, hotelsTool, attractionsTool, routeTool },
});
