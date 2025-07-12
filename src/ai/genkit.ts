// src/ai/genkit.ts
'use server';

import {genkit, configureGenkit} from '@genkit-ai/core';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'zod';

if (!process.env.GOOGLE_GENAI_API_KEY) {
  throw new Error('GOOGLE_GENAI_API_KEY no está configurada');
}

configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export {genkit as ai, z};
