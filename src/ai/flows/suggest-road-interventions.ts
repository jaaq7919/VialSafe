'use server';

/**
 * @fileOverview Recomendaciones de intervenciones viales basadas en IA a partir de datos históricos de accidentes.
 *
 * - suggestRoadInterventions - Una función que maneja el proceso de sugerencia de intervención vial.
 * - SuggestRoadInterventionsInput - El tipo de entrada para la función suggestRoadInterventions.
 * - SuggestRoadInterventionsOutput - El tipo de retorno para la función suggestRoadInterventions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRoadInterventionsInputSchema = z.object({
  accidentData: z.string().describe('Datos históricos de accidentes, incluyendo ubicación, hora y causa.'),
  criticalZoneAnalysis: z.string().describe('Análisis de zonas críticas con alta concentración de accidentes.'),
});
export type SuggestRoadInterventionsInput = z.infer<typeof SuggestRoadInterventionsInputSchema>;

const SuggestRoadInterventionsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      intervention: z.string().describe('Intervención vial recomendada (ej., semáforos, reductores de velocidad).'),
      justification: z.string().describe('Justificación de la intervención recomendada basada en patrones de datos de accidentes.'),
    })
  ).describe('Lista de intervenciones viales recomendadas con justificaciones.'),
});
export type SuggestRoadInterventionsOutput = z.infer<typeof SuggestRoadInterventionsOutputSchema>;

export async function suggestRoadInterventions(input: SuggestRoadInterventionsInput): Promise<SuggestRoadInterventionsOutput> {
  return suggestRoadInterventionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRoadInterventionsPrompt',
  input: {schema: SuggestRoadInterventionsInputSchema},
  output: {schema: SuggestRoadInterventionsOutputSchema},
  prompt: `Eres un experto analista de tráfico especializado en recomendar intervenciones viales para reducir accidentes en el contexto colombiano.

  Basado en los datos históricos de accidentes y el análisis de zonas críticas, proporciona una lista de intervenciones viales recomendadas con sus justificaciones.

  Datos Históricos de Accidentes: {{{accidentData}}}
  Análisis de Zonas Críticas: {{{criticalZoneAnalysis}}}

  Formatea tu respuesta como un objeto JSON con un campo 'recommendations'. Cada recomendación debe incluir la 'intervention' y 'justification'.
  `,
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
