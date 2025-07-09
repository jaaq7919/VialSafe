'use server';

/**
 * @fileOverview This AI flow suggests strategic locations and times for traffic control posts.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SuggestControlPostsInputSchema = z.object({
  accidentData: z.string().describe('Datos históricos de accidentes en formato CSV, incluyendo ubicación, fecha, hora, tipo y causa.'),
});
export type SuggestControlPostsInput = z.infer<typeof SuggestControlPostsInputSchema>;

const RecommendationSchema = z.object({
      location: z.string().describe('La ubicación recomendada para el puesto de control, ej: "Salida a Palmira".'),
      controlType: z.string().describe('El tipo de control más adecuado (ej., "Control de Velocidad", "Control de Alcoholemia", "Control de Documentos y SOAT").'),
      schedule: z.string().describe('El horario sugerido para el puesto de control (ej., "Viernes y Sábados, 10 PM - 2 AM").'),
      justification: z.string().describe('La justificación detallada de por qué se recomienda este puesto de control, basada en patrones de los datos (ej: "Alta frecuencia de accidentes nocturnos vinculados al exceso de velocidad en esta zona.").'),
    });

const SuggestControlPostsOutputSchema = z.object({
  recommendations: z.array(RecommendationSchema).describe('Una lista de 2 a 4 recomendaciones estratégicas para puestos de control.'),
});
export type SuggestControlPostsOutput = z.infer<typeof SuggestControlPostsOutputSchema>;

export async function suggestControlPosts(input: SuggestControlPostsInput): Promise<SuggestControlPostsOutput> {
  return suggestControlPostsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestControlPostsPrompt',
  input: {schema: SuggestControlPostsInputSchema},
  output: {schema: SuggestControlPostsOutputSchema},
  prompt: `Eres un experto estratega de seguridad vial para la secretaría de tránsito de Florida, Valle del Cauca, Colombia. Tu tarea es recomendar la ubicación y el tipo de puestos de control para maximizar la prevención de accidentes.

  Basado en los siguientes datos históricos de accidentes, proporciona una lista de recomendaciones para puestos de control.

  - **Datos Históricos de Accidentes (en formato CSV):**
  {{{accidentData}}}

  **Instrucciones:**
  1.  **Analiza los Patrones:** Revisa los datos para encontrar patrones clave. Busca concentraciones de accidentes por:
      - **Ubicación:** ¿Dónde ocurren más accidentes?
      - **Causa:** ¿Qué causas son más comunes en esas ubicaciones (exceso de velocidad, alcohol, etc.)?
      - **Horario:** ¿Hay picos de accidentalidad en ciertos días de la semana o rangos horarios (ej. noches de fin de semana, horas pico)?

  2.  **Sugiere Puestos de Control:** Para los patrones más claros, recomienda un puesto de control. Cada recomendación debe incluir:
      - **Ubicación:** El lugar preciso para el control.
      - **Tipo de Control:** El control más relevante para la causa principal (ej. "Control de Velocidad" para zonas con esa causa, "Control de Alcoholemia" si la causa es CBI).
      - **Horario Sugerido:** El horario donde el control sería más efectivo según los datos.
      - **Justificación:** Una explicación clara de por qué esa ubicación, horario y tipo de control son los adecuados.

  3.  **Genera 2 a 4 recomendaciones clave.** No más de 4.
  4.  Formatea tu respuesta final como un objeto JSON que se ajuste al esquema solicitado.`,
});

const suggestControlPostsFlow = ai.defineFlow(
  {
    name: 'suggestControlPostsFlow',
    inputSchema: SuggestControlPostsInputSchema,
    outputSchema: SuggestControlPostsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
