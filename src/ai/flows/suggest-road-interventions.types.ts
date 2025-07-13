import {z} from 'zod';

export const SuggestRoadInterventionsInputSchema = z.object({
  criticalZoneAnalysis: z.string().describe('Análisis JSON de zonas críticas previamente identificadas, con detalles de ubicación, conteo y causas de accidentes.'),
  accidentData: z.string().describe('Datos históricos de todos los accidentes en formato CSV para contexto adicional.'),
});
export type SuggestRoadInterventionsInput = z.infer<typeof SuggestRoadInterventionsInputSchema>;

const InterventionSchema = z.object({
  location: z.string().describe('La ubicación exacta de la intervención, ej. "Calle 10 con Carrera 5".'),
  intervention: z.string().describe('La intervención específica recomendada (ej. "Instalación de Semáforo", "Implementar Reductor de Velocidad", "Mejorar Señalización Vertical").'),
  justification: z.string().describe('La razón detallada por la que se recomienda esta intervención, basada en el análisis de las causas y la frecuencia de los accidentes en esa zona.'),
});

export const SuggestRoadInterventionsOutputSchema = z.object({
  recommendations: z.array(InterventionSchema).describe('Una lista de recomendaciones de intervención vial.'),
});
export type SuggestRoadInterventionsOutput = z.infer<typeof SuggestRoadInterventionsOutputSchema>;
