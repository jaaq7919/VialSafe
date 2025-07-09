'use server';

/**
 * @fileOverview This AI flow suggests road interventions based on accident data.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SuggestRoadInterventionsInputSchema = z.object({
  accidentData: z.string().describe('Datos históricos de accidentes en formato CSV, incluyendo ubicación, fecha, hora y causa.'),
  criticalZoneAnalysis: z.string().describe('Análisis JSON de zonas críticas con alta concentración de accidentes, para dar contexto.'),
});
export type SuggestRoadInterventionsInput = z.infer<typeof SuggestRoadInterventionsInputSchema>;

const RecommendationSchema = z.object({
      location: z.string().describe('La ubicación donde se recomienda la intervención, ej: "Carrera 7 con Calle 11".'),
      intervention: z.string().describe('La intervención vial recomendada (ej., "Instalación de Semáforo", "Implementar Reductores de Velocidad", "Mejorar Señal de PARE").'),
      justification: z.string().describe('La justificación detallada de por qué se recomienda esta intervención, basada en los patrones de los datos de accidentes (ej: "Alta frecuencia de colisiones nocturnas debido a exceso de velocidad.").'),
    });

const SuggestRoadInterventionsOutputSchema = z.object({
  recommendations: z.array(RecommendationSchema).describe('Una lista de 2 a 4 intervenciones viales recomendadas con sus justificaciones.'),
});
export type SuggestRoadInterventionsOutput = z.infer<typeof SuggestRoadInterventionsOutputSchema>;

export async function suggestRoadInterventions(input: SuggestRoadInterventionsInput): Promise<SuggestRoadInterventionsOutput> {
  return suggestRoadInterventionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRoadInterventionsPrompt',
  input: {schema: SuggestRoadInterventionsInputSchema},
  output: {schema: SuggestRoadInterventionsOutputSchema},
  prompt: `Eres un experto analista de tráfico para la secretaría de tránsito de Florida, Valle del Cauca, Colombia. Tu tarea es recomendar intervenciones viales para reducir accidentes.

  Basado en los siguientes datos históricos de accidentes y el análisis previo de zonas críticas, proporciona una lista de intervenciones viales recomendadas y bien justificadas.

  - **Datos Históricos de Accidentes (en formato CSV):**
  {{{accidentData}}}

  - **Análisis de Zonas Críticas Previo (en formato JSON para dar contexto):**
  {{{criticalZoneAnalysis}}}

  **Instrucciones:**
  1.  Revisa cuidadosamente las zonas críticas identificadas y los datos crudos de accidentes para encontrar patrones.
  2.  Para las zonas más críticas, o para patrones generales que identifiques, sugiere una intervención vial concreta y apropiada. Ejemplos de intervenciones: "Instalación de Semáforo", "Implementar Reductores de Velocidad", "Mejorar Señal de PARE", "Añadir Iluminación Pública", "Pintar Cebra Peatonal".
  3.  Justifica cada recomendación de forma clara y concisa, basándote en la evidencia de los datos (ej: "Alta frecuencia de colisiones nocturnas", "Exceso de velocidad recurrente", "Atropellos de peatones en esta esquina").
  4.  Genera entre 2 y 4 recomendaciones clave.
  5.  Formatea tu respuesta final como un objeto JSON que se ajuste al esquema solicitado.`,
});

const suggestRoadInterventionsFlow = ai.defineFlow(
  {
    name: 'suggestRoadInterventionsFlow',
    inputSchema: SuggestRoadInterventionsInputSchema,
    outputSchema: SuggestRoadInterventionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
