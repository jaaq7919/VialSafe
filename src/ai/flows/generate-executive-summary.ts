
'use server';

/**
 * @fileOverview Este flujo de IA genera un resumen ejecutivo para directivos.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ExecutiveSummaryInputSchema = z.object({
  criticalZonesAnalysis: z.string().describe('Análisis JSON de zonas críticas con alta concentración de accidentes.'),
  interventionRecommendations: z.string().describe('Recomendaciones JSON de intervenciones viales (semáforos, reductores, etc.).'),
  controlPostRecommendations: z.string().describe('Recomendaciones JSON de puestos de control (velocidad, alcoholemia, etc.).'),
});
export type ExecutiveSummaryInput = z.infer<typeof ExecutiveSummaryInputSchema>;

const ExecutiveSummaryOutputSchema = z.object({
  summary: z.string().describe('El texto del resumen ejecutivo redactado en formato markdown.'),
});
export type ExecutiveSummaryOutput = z.infer<typeof ExecutiveSummaryOutputSchema>;


export async function generateExecutiveSummary(input: ExecutiveSummaryInput): Promise<ExecutiveSummaryOutput> {
  return generateExecutiveSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExecutiveSummaryPrompt',
  input: {schema: ExecutiveSummaryInputSchema},
  output: {schema: ExecutiveSummaryOutputSchema},
  prompt: `Eres un asesor experto para la Secretaría de Tránsito de Florida, Valle del Cauca. Tu tarea es redactar un resumen ejecutivo claro, conciso y profesional para la dirección, basado en los análisis técnicos de la plataforma Centinela Vial.

Utiliza los siguientes datos JSON para construir tu informe. No inventes información; basa tus conclusiones únicamente en los datos proporcionados.

1.  **Análisis de Zonas Críticas:** {{{criticalZonesAnalysis}}}
2.  **Recomendaciones de Intervención Vial:** {{{interventionRecommendations}}}
3.  **Recomendaciones de Puestos de Control:** {{{controlPostRecommendations}}}

**Instrucciones para el Resumen Ejecutivo:**

*   **Formato:** Usa Markdown para la estructura (títulos, listas, negritas).
*   **Tono:** Profesional, directo y orientado a la acción.
*   **Estructura Sugerida:**
    1.  **Encabezado:** "Resumen Ejecutivo: Estado de la Seguridad Vial y Acciones Recomendadas".
    2.  **Introducción (1-2 frases):** Resume el propósito del informe (presentar hallazgos clave y recomendaciones).
    3.  **Principales Hallazgos (lista de viñetas):** Menciona las zonas críticas más importantes identificadas en el análisis. Sé específico (ej: "La intersección de la Calle 10 con Carrera 5 se ha identificado como el punto de mayor criticidad con X accidentes.").
    4.  **Recomendaciones Estratégicas (lista de viñetas):** Agrupa y resume las intervenciones y puestos de control más importantes sugeridos por la IA. (ej: "Se recomienda la instalación de reductores de velocidad en la zona X debido a la alta incidencia de accidentes por esta causa.").
    5.  **Conclusión y Próximos Pasos (1-2 frases):** Concluye reafirmando la importancia de actuar sobre estas recomendaciones para mejorar la seguridad vial.

Tu respuesta final debe ser un único objeto JSON con la clave "summary" conteniendo el informe completo.`,
});

const generateExecutiveSummaryFlow = ai.defineFlow(
  {
    name: 'generateExecutiveSummaryFlow',
    inputSchema: ExecutiveSummaryInputSchema,
    outputSchema: ExecutiveSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
