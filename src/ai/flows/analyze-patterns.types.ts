
import {z} from 'zod';

export const AnalyzePatternsInputSchema = z.object({
  accidentData: z.string().describe('Datos históricos de todos los accidentes en formato CSV, incluyendo columnas para clima y eventos especiales.'),
});
export type AnalyzePatternsInput = z.infer<typeof AnalyzePatternsInputSchema>;


const FindingSchema = z.object({
  patternTitle: z.string().describe('Un título corto y descriptivo para el patrón encontrado. Ej: "Riesgo Elevado en Días de Mercado".'),
  description: z.string().describe('Una explicación detallada de la correlación encontrada, mencionando las variables implicadas (clima, evento, causa, ubicación, etc.).'),
  recommendation: z.string().describe('Una sugerencia concreta y accionable para mitigar el riesgo identificado por el patrón.'),
});

export const AnalyzePatternsOutputSchema = z.object({
  summary: z.string().describe('Un resumen general y conclusión del análisis de patrones.'),
  findings: z.array(FindingSchema).describe('Una lista de los patrones y correlaciones más significativos encontrados en los datos.'),
});
export type AnalyzePatternsOutput = z.infer<typeof AnalyzePatternsOutputSchema>;

    