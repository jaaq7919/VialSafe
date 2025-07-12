'use server';
/**
 * @fileOverview Initializes and exports the Genkit AI instance.
 *
 * This file sets up the core Genkit object with the necessary plugins,
 * in this case, the Google AI plugin. The exported 'ai' object is
 * a singleton that will be used throughout the application to define
 * and run AI flows, prompts, and tools.
 */

import {genkit} from '@genkit-ai/ai';
import {googleAI} from '@genkit-ai/googleai';

if (!process.env.GOOGLE_GENAI_API_KEY) {
  throw new Error(
    'The GOOGLE_GENAI_API_KEY environment variable is not set.'
  );
}

// Initialize Genkit with the Google AI plugin.
// This `ai` object is the central point for all Genkit operations.
export const ai = genkit({
  plugins: [googleAI({apiVersion: 'v1beta'})],
});
