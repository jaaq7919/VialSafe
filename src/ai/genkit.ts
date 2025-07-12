// src/ai/genkit.ts - Configuración directa con Google AI
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
