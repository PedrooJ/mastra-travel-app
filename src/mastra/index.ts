
// Import required dependencies
import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { weatherWorkflow } from './workflows';
import { weatherAgent } from './agents';
import { travelWorkflow } from './workflows/travel-workflow';
import { routeAgent } from './agents/routeAgent';
// Create and export a new Mastra instance
export const mastra = new Mastra({
  // Register the weather workflow that orchestrates weather-related tasks
  workflows: { weatherWorkflow, travelWorkflow },
  
  // Register the weather agent that handles weather queries and responses
  agents: { weatherAgent, routeAgent },


  // Configure logging with name 'Mastra' and info level
  logger: createLogger({
    name: 'Mastra', // Logger name for identification
    level: 'info',  // Log level set to info - will show info, warn and error logs
  }),
});
