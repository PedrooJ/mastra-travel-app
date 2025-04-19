import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { getWeather } from '../tools/weather'; 
import { weatherAgent } from '../agents/weatherAgent';
const llm = openai('gpt-3.5-turbo');


// Paso que utiliza directamente la función getWeather
const fetchCurrentWeather = new Step({
  id: 'fetch-weather',
  description: 'Obtiene el clima actual para una ciudad',
  inputSchema: z.object({
    location: z.string().describe('La ciudad para obtener el clima'),
    startDate: z.string().describe('Start date in YYYY-MM-DD format'),
    endDate: z.string().describe('End date in YYYY-MM-DD format'),
  }),
  outputSchema: z.array(
    z.object({
      date: z.string(),
      maxTemp: z.number(),
      minTemp: z.number(),
      precipitationChance: z.number(),
      condition: z.string(),
      location: z.string(),
    })
  ),
  execute: async ({ context }) => {
    const triggerData = context?.getStepResult<{ location: string; startDate: string; endDate: string }>('trigger');

    if (!triggerData) {
      throw new Error('No se encontró la información de la ciudad en el trigger');
    }

    const weather = await getWeather(triggerData.location, triggerData.startDate, triggerData.endDate);
    return weather;
  },
});

const planActivities = new Step({
  id: 'plan-activities',
  description: 'Suggests activities based on current weather conditions',
  execute: async ({ context }) => {
    const weather = context?.getStepResult(fetchCurrentWeather);

    if (!weather) {
      throw new Error('Weather data not found');
    }

    const prompt = `Based on the following weather forecast for ${weather[0]?.location}, suggest appropriate activities:
      ${JSON.stringify(weather, null, 2)}
      `;

    const response = await weatherAgent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let activitiesText = '';
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      activitiesText += chunk;
    }

    return {
      activities: activitiesText,
    };
  },
});

const weatherWorkflow = new Workflow({
  name: 'weather-workflow',
  triggerSchema: z.object({
    location: z.string().describe('The city to get the weather for'),
    startDate: z.string().describe('Start date in YYYY-MM-DD format'),
    endDate: z.string().describe('End date in YYYY-MM-DD format'),
  }),
})
  .step(fetchCurrentWeather)
  .then(planActivities);

weatherWorkflow.commit();

export { weatherWorkflow };





