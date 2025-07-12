// src/ai/flows/suggest-road-interventions.ts
'use server';

import { generateContent } from '@/ai/genkit';

export async function suggestRoadInterventions(data: any): Promise<{ recommendations: { location: string; intervention: string; justification: string; }[] }> {
  try {
    const prompt = `Responde única y exclusivamente con: "Buenos días, la conexión es exitosa."`;
    
    const result = await generateContent(prompt);
    
    // Devolvemos una estructura que la página espera, pero con la respuesta del test.
    return {
        recommendations: [{
            location: "Prueba de Conexión",
            intervention: "Respuesta de la IA",
            justification: result.trim()
        }]
    };
  } catch (error) {
    console.error('Error en suggestRoadInterventions:', error);
    throw new Error('Error al generar sugerencias de intervenciones');
  }
}
