import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

export const travelAgent = new Agent({
  name: 'Travel Agent',
  model: openai('gpt-4o'),
  instructions: `
        You are a local activities and travel expert. Analyze the weather data, attractions, restaurants, events and hotels to plan the best activities and travel for the user. Give the user a detailed plan of the activities and travel.
      `,
});
