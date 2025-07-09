'use server';

/**
 * @fileOverview Analiza zonas críticas con alta concentración de accidentes utilizando datos históricos.
 *
 * - analyzeCriticalZones - Una función que maneja el análisis de zonas críticas.
 * - AnalyzeCriticalZonesInput - El tipo de entrada para la función analyzeCriticalZones.
 * - AnalyzeCriticalZonesOutput - El tipo de retorno para la función analyzeCriticalZones.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCriticalZonesInputSchema = z.object({
  historicalAccidentData: z
    .string()
    .describe('Datos históricos de accidentes, preferiblemente en formato CSV.'),
  criteria: z
    .string()
    .optional()
    .describe(
      'Criterios opcionales para identificar zonas críticas, ej., umbral de densidad de accidentes.'
    ),
});

export type AnalyzeCriticalZonesInput = z.infer<
  typeof AnalyzeCriticalZonesInputSchema
>;

const AnalyzeCriticalZonesOutputSchema = z.object({
  criticalZones: z
    .string()
    .describe(
      'Una descripción de las zonas críticas identificadas con alta concentración de accidentes.'
    ),
  recommendations: z
    .string()
    .describe(
      'Recomendaciones para intervención en las zonas críticas identificadas.'
    ),
});

export type AnalyzeCriticalZonesOutput = z.infer<
  typeof AnalyzeCriticalZonesOutputSchema
>;

export async function analyzeCriticalZones(
  input: AnalyzeCriticalZonesInput
): Promise<AnalyzeCriticalZonesOutput> {
  return analyzeCriticalZonesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCriticalZonesPrompt',
  input: {schema: AnalyzeCriticalZonesInputSchema},
  output: {schema: AnalyzeCriticalZonesOutputSchema},
  prompt: `Eres un analista de tráfico encargado de identificar zonas críticas con alta concentración de accidentes en Colombia, específicamente en Florida, Valle del Cauca, utilizando datos históricos.

Analiza los siguientes datos históricos de accidentes para identificar zonas críticas:

Datos Históricos de Accidentes: {{{historicalAccidentData}}}

Criterios Opcionales: {{{criteria}}}

Basado en los datos, identifica y describe las zonas críticas con alta concentración de accidentes y proporciona recomendaciones para intervenir en estas zonas.

Formatea la salida como un objeto JSON con los campos "criticalZones" y "recommendations".`,
});

const analyzeCriticalZonesFlow = ai.defineFlow(
  {
    name: 'analyzeCriticalZonesFlow',
    inputSchema: AnalyzeCriticalZonesInputSchema,
    outputSchema: AnalyzeCriticalZonesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
