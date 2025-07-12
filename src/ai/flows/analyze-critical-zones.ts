'use server';

/**
 * @fileOverview Este flujo de IA analiza clusters de accidentes pre-identificados por DBSCAN para determinar zonas críticas.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AccidentClusterSchema = z.object({
  clusterId: z.number().describe('El ID del cluster identificado por DBSCAN.'),
  accidentCount: z.number().describe('El número de accidentes en este cluster.'),
  representativeLocation: z.string().describe('La dirección más común o representativa dentro del cluster.'),
  causeSummary: z.string().describe('Un resumen de las causas más frecuentes en este cluster (ej: 3 por exceso de velocidad, 2 por no respetar señal).'),
  period: z.string().describe('El rango de fechas de los accidentes en este cluster (ej: 2024-01-15 a 2024-03-22).'),
});

const AnalyzeCriticalZonesInputSchema = z.object({
  accidentClusters: z.array(AccidentClusterSchema).describe('Una lista de clusters de accidentes ya identificados mediante un algoritmo espacial como DBSCAN.'),
  analysisPeriod: z.string().describe('El período de tiempo general que se está analizando, ej: "últimos 90 días".')
});

export type AnalyzeCriticalZonesInput = z.infer<
  typeof AnalyzeCriticalZonesInputSchema
>;

const CriticalZoneSchema = z.object({
    location: z.string().describe('La intersección o ubicación de la zona crítica, ej., "Calle 10 con Carrera 5".'),
    accidentCount: z.number().describe('El número total de accidentes contados en esta zona.'),
    reason: z.string().describe('Una breve explicación de por qué esta zona es considerada crítica, basada en la frecuencia y las causas.')
});

const AnalyzeCriticalZonesOutputSchema = z.object({
  criticalZones: z.array(CriticalZoneSchema).describe('Una lista estructurada de las zonas críticas identificadas.'),
  summary: z.string().describe('Un resumen general del análisis, con observaciones sobre las tendencias generales y recomendaciones.'),
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
  prompt: `Eres un experto analista de seguridad vial para la secretaría de tránsito de Florida, Valle del Cauca, Colombia. Tu tarea es analizar clusters de accidentes, que ya han sido agrupados geográficamente por un algoritmo espacial (DBSCAN), para identificar y reportar las zonas más críticas.

El periodo de análisis general es: {{{analysisPeriod}}}.

Aquí están los clusters de accidentes identificados:
{{#each accidentClusters}}
- Cluster ID: {{clusterId}}
  - Cantidad de accidentes: {{accidentCount}}
  - Ubicación representativa: "{{representativeLocation}}"
  - Resumen de causas: {{causeSummary}}
  - Fechas de los accidentes: {{period}}
{{/each}}

Sigue estos pasos para tu análisis:
1.  **Evalúa cada Cluster:** Revisa cada cluster proporcionado. Un cluster con 2 o más accidentes ya es relevante. Un cluster con 3 o más es definitivamente una zona crítica.
2.  **Identifica las Zonas Críticas:** Selecciona los clusters más significativos basándote en la cantidad de accidentes. Prioriza los que tengan mayor número.
3.  **Genera el Reporte:** Estructura tu respuesta en el formato JSON solicitado.
    - Para cada zona crítica que identifiques, extrae la ubicación, el conteo de accidentes y redacta una razón clara y concisa. La razón debe basarse en el resumen de causas y la alta frecuencia. Por ejemplo: "Alta concentración de accidentes ({{accidentCount}}) principalmente por exceso de velocidad en un corto período."
    - Proporciona un resumen final con observaciones y recomendaciones generales. Si notas patrones (ej: "muchos accidentes nocturnos por CBI"), menciónalos.`,
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
