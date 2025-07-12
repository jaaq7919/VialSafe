
'use server';

/**
 * @fileOverview Este flujo de IA sugiere intervenciones viales específicas basadas en un análisis de zonas críticas y datos de accidentes.
 */

import {ai, z} from '@/ai/genkit';

const SuggestRoadInterventionsInputSchema = z.object({
  criticalZoneAnalysis: z
    .string()
    .describe(
      'Análisis JSON de las zonas críticas identificadas, con su ubicación, conteo y causas de accidentes.'
    ),
  accidentData: z
    .string()
    .describe(
      'Datos históricos de accidentes en formato CSV, incluyendo detalles como causa, hora y ubicación exacta.'
    ),
});

export type SuggestRoadInterventionsInput = z.infer<
  typeof SuggestRoadInterventionsInputSchema
>;

const InterventionRecommendationSchema = z.object({
  location: z
    .string()
    .describe('La ubicación específica de la intervención recomendada.'),
  intervention: z
    .string()
    .describe(
      'El tipo de intervención sugerida (ej. "Instalación de Semáforo", "Reductores de velocidad", "Mejorar señalización").'
    ),
  justification: z
    .string()
    .describe(
      'Una explicación detallada de por qué se recomienda esta intervención, basada en los datos proporcionados.'
    ),
});

const SuggestRoadInterventionsOutputSchema = z.object({
  recommendations: z
    .array(InterventionRecommendationSchema)
    .describe(
      'Una lista de recomendaciones de intervenciones viales estructuradas.'
    ),
});

export type SuggestRoadInterventionsOutput = z.infer<
  typeof SuggestRoadInterventionsOutputSchema
>;

export async function suggestRoadInterventions(
  input: SuggestRoadInterventionsInput
): Promise<SuggestRoadInterventionsOutput> {
  return suggestRoadInterventionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRoadInterventionsPrompt',
  input: {schema: SuggestRoadInterventionsInputSchema},
  output: {schema: SuggestRoadInterventionsOutputSchema},
  prompt: `Eres un experto planificador de tráfico y seguridad vial para la secretaría de tránsito de Florida, Valle del Cauca, Colombia. Tu tarea es analizar los puntos críticos de accidentes y sugerir intervenciones viales efectivas y justificadas.

Basado en el siguiente análisis de zonas críticas y los datos históricos de accidentes, genera recomendaciones de intervención.

**1. Análisis de Zonas Críticas (Resumen de alto nivel):**
{{{criticalZoneAnalysis}}}

**2. Datos Históricos de Accidentes (Detalles en CSV):**
{{{accidentData}}}

**Instrucciones:**
1.  **Analiza Cada Zona Crítica:** Para cada zona identificada en el análisis, revisa los datos históricos de accidentes para entender los detalles: ¿a qué horas ocurren?, ¿cuáles son las causas exactas (ej. "exceso-velocidad", "no-respeta-pare")?, ¿hay un patrón?
2.  **Sugiere Intervenciones Específicas:** Para cada zona, recomienda la intervención más adecuada. Sé concreto.
    *   Si la causa es 'exceso-velocidad', sugiere 'Reductores de velocidad'.
    *   Si es 'no-respeta-pare' en una intersección con muchos accidentes, sugiere 'Instalación de Semáforo' o 'Mejorar señal de PARE'.
    *   Si los accidentes son nocturnos, considera 'Mejorar iluminación'.
    *   Si son choques por alcance, 'Señalización preventiva' puede ser la solución.
3.  **Justifica cada recomendación:** Tu justificación debe ser sólida y basada en los datos. Por ejemplo: "Se recomienda instalar un semáforo debido a la alta incidencia de colisiones (X casos) causadas por no respetar la señal de PARE existente, especialmente en horas pico."
4.  **Formatea la Respuesta:** Devuelve una lista de recomendaciones en el formato JSON especificado. Genera al menos una recomendación para cada zona crítica identificada.`,
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
