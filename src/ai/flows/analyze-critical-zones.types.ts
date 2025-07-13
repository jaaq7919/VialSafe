import { z } from 'zod';

const AccidentClusterSchema = z.object({
  clusterId: z.number().describe('El ID del cluster identificado por DBSCAN.'),
  accidentCount: z.number().describe('El número de accidentes en este cluster.'),
  representativeLocation: z.string().describe('La dirección más común o representativa dentro del cluster.'),
  causeSummary: z.string().describe('Un resumen de las causas más frecuentes en este cluster (ej: 3 por exceso de velocidad, 2 por no respetar señal).'),
  period: z.string().describe('El rango de fechas de los accidentes en este cluster (ej: 2024-01-15 a 2024-03-22).'),
});

export const AnalyzeCriticalZonesInputSchema = z.object({
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

export const AnalyzeCriticalZonesOutputSchema = z.object({
  criticalZones: z.array(CriticalZoneSchema).describe('Una lista estructurada de las zonas críticas identificadas.'),
  summary: z.string().describe('Un resumen general del análisis, con observaciones sobre las tendencias generales y recomendaciones.'),
});

export type AnalyzeCriticalZonesOutput = z.infer<
  typeof AnalyzeCriticalZonesOutputSchema
>;
