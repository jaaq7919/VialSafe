
'use server';
/**
 * @fileOverview Este flujo de IA sugiere intervenciones viales específicas para zonas críticas.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SuggestRoadInterventionsInputSchema = z.object({
  criticalZoneAnalysis: z.string().describe('Análisis JSON de zonas críticas previamente identificadas, con detalles de ubicación, conteo y causas de accidentes.'),
  accidentData: z.string().describe('Datos históricos de todos los accidentes en formato CSV para contexto adicional.'),
});
export type SuggestRoadInterventionsInput = z.infer<typeof SuggestRoadInterventionsInputSchema>;

const InterventionSchema = z.object({
  location: z.string().describe('La ubicación exacta de la intervención, ej. "Calle 10 con Carrera 5".'),
  intervention: z.string().describe('La intervención específica recomendada (ej. "Instalación de Semáforo", "Implementar Reductor de Velocidad", "Mejorar Señalización Vertical").'),
  justification: z.string().describe('La razón detallada por la que se recomienda esta intervención, basada en el análisis de las causas y la frecuencia de los accidentes en esa zona.'),
});

const SuggestRoadInterventionsOutputSchema = z.object({
  recommendations: z.array(InterventionSchema).describe('Una lista de recomendaciones de intervención vial.'),
});
export type SuggestRoadInterventionsOutput = z.infer<typeof SuggestRoadInterventionsOutputSchema>;

export async function suggestRoadInterventions(input: SuggestRoadInterventionsInput): Promise<SuggestRoadInterventionsOutput> {
  return suggestRoadInterventionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRoadInterventionsPrompt',
  input: {schema: SuggestRoadInterventionsInputSchema},
  output: {schema: SuggestRoadInterventionsOutputSchema},
  prompt: `Eres un experto en ingeniería y seguridad vial para la secretaría de tránsito de Florida, Valle del Cauca. Tu misión es analizar las zonas críticas de accidentes y proponer intervenciones viales efectivas para reducir la siniestralidad.

Aquí tienes los datos que debes usar:

1.  **Análisis de Zonas Críticas (tu fuente principal):**
    {{{criticalZoneAnalysis}}}

2.  **Datos Crudos de Accidentes (para contexto si lo necesitas):**
    {{{accidentData}}}

**Tus Instrucciones:**

1.  **Analiza Cada Zona Crítica:** Para cada zona identificada en el análisis, revisa cuidadosamente la ubicación, la cantidad de accidentes y, lo más importante, el resumen de causas.
2.  **Sugiere Intervenciones Específicas:** Basado en las causas, recomienda la intervención más lógica y efectiva. No seas genérico.
    *   Si la causa es "exceso de velocidad", recomienda "Implementar Reductores de Velocidad" o "Instalar radar de velocidad con señalización".
    *   Si la causa es "no respetar señal de pare/cruce", recomienda "Instalación de Semáforo" o "Mejorar visibilidad de la señalización vertical".
    *   Si son colisiones en un cruce, un "Semáforo" es una opción fuerte.
    *   Si hay problemas de visibilidad nocturna, sugiere "Mejorar iluminación pública".
3.  **Justifica Cada Recomendación:** Para cada sugerencia, escribe una justificación clara y concisa que enlace directamente la causa del problema con la solución propuesta. Por ejemplo: "Se recomienda la instalación de un semáforo debido a la alta frecuencia de colisiones (X accidentes) causadas por el incumplimiento de la señal de PARE en esta intersección."
4.  **Genera una recomendación para cada zona crítica identificada en el análisis.**
5.  **Formatea tu respuesta final como un objeto JSON que se ajuste al esquema solicitado.**`,
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
