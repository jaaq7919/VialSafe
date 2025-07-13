/**
 * @fileOverview Initializes and exports the Genkit AI instance.
 *
 * This file sets up the core Genkit object with the necessary plugins,
 * in this case, the Google AI plugin. The exported 'ai' object is
 * a singleton that will be used throughout the application to define
 * and run AI flows, prompts, and tools.
 */

// import {genkit} from '@genkit-ai/ai';
// import {googleAI} from '@genkit-ai/googleai';

// if (!process.env.GOOGLE_GENAI_API_KEY) {
//   throw new Error(
//     'The GOOGLE_GENAI_API_KEY environment variable is not set.'
//   );
// }

// // Initialize Genkit with the Google AI plugin.
// // This `ai` object is the central point for all Genkit operations.
// export const ai = genkit({
//   plugins: [googleAI({apiVersion: 'v1beta'})],
// });

import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GOOGLE_GENAI_API_KEY) {
  throw new Error('GOOGLE_GENAI_API_KEY no está configurada');
}

// Inicializa Google AI directamente
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

// Función helper para generar contenido
export async function generateContent(prompt: string, model: string = 'gemini-1.5-flash') {
  try {
    const generativeModel = genAI.getGenerativeModel({ model });
    const result = await generativeModel.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generando contenido:', error);
    throw error;
  }
}

// Función para generar contenido con configuración personalizada
export async function generateWithConfig(prompt: string, config: {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}) {
  try {
    const generativeModel = genAI.getGenerativeModel({ 
      model: config.model || 'gemini-1.5-flash',
      generationConfig: {
        temperature: config.temperature || 0.7,
        maxOutputTokens: config.maxOutputTokens || 1000,
      }
    });
    
    const result = await generativeModel.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generando contenido con config:', error);
    throw error;
  }
}

export { genAI };