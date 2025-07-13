import {z} from 'zod';

export const SuggestControlPostsInputSchema = z.object({
  accidentData: z.string().describe('Datos históricos de accidentes en formato CSV, incluyendo ubicación, fecha, hora, tipo, causa, latitud y longitud.'),
});
export type SuggestControlPostsInput = z.infer<typeof SuggestControlPostsInputSchema>;

const RecommendationSchema = z.object({
      location: z.string().describe('La ubicación recomendada para el puesto de control, ej: "Salida a Palmira".'),
      controlType: z.string().describe('El tipo de control más adecuado (ej., "Control de Velocidad", "Control de Alcoholemia", "Control de Documentos y SOAT").'),
      schedule: z.string().describe('El horario sugerido para el puesto de control (ej., "Viernes y Sábados, 10 PM - 2 AM").'),
      justification: z.string().describe('La justificación detallada de por qué se recomienda este puesto de control, basada en patrones de los datos (ej: "Alta frecuencia de accidentes nocturnos vinculados al exceso de velocidad en esta zona.").'),
    });

export const SuggestControlPostsOutputSchema = z.object({
  recommendations: z.array(RecommendationSchema).describe('Una lista de 2 a 4 recomendaciones estratégicas para puestos de control.'),
});
export type SuggestControlPostsOutput = z.infer<typeof SuggestControlPostsOutputSchema>;
