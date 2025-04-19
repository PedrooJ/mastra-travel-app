import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { hotelsTool } from '../tools/hotels';
import { attractionsTool } from '../tools/attractions';
import { routeTool } from '../tools/route';

export const routeAgent = new Agent({
  name: 'Route Agent',
  model: openai('gpt-3.5-turbo'),
  instructions: `
        Te voy a dar una ciudad y me tienes que devolver 3 parejas de hoteles con su atraccion mas cercana y la distancia en km y el tiempo en minutos para ir de un punto a otro en coche y andando.
      `,
      
  tools: { hotelsTool, attractionsTool, routeTool },
});
