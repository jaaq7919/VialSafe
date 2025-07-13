import {z} from 'zod';

export const ExecutiveSummaryInputSchema = z.object({
  criticalZonesAnalysis: z.string().describe('Análisis JSON de zonas críticas con alta concentración de accidentes.'),
  interventionRecommendations: z.string().describe('Recomendaciones JSON de intervenciones viales (semáforos, reductores, etc.).'),
  controlPostRecommendations: z.string().describe('Recomendaciones JSON de puestos de control (velocidad, alcoholemia, etc.).'),
});
export type ExecutiveSummaryInput = z.infer<typeof ExecutiveSummaryInputSchema>;

export const ExecutiveSummaryOutputSchema = z.object({
  summary: z.string().describe('El texto del resumen ejecutivo redactado en formato markdown.'),
});
export type ExecutiveSummaryOutput = z.infer<typeof ExecutiveSummaryOutputSchema>;
