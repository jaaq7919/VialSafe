
'use server';

/**
 * @fileOverview Este flujo de IA analiza clusters de accidentes pre-identificados por DBSCAN para determinar zonas críticas.
 */

import { generateContent } from '@/ai/genkit';
import { AnalyzeCriticalZonesInput, AnalyzeCriticalZonesOutput, AnalyzeCriticalZonesOutputSchema } from './analyze-critical-zones.types';


export async function analyzeCriticalZones(
  input: AnalyzeCriticalZonesInput
): Promise<AnalyzeCriticalZonesOutput> {
    const { accidentClusters, analysisPeriod } = input;

    const clustersText = accidentClusters.map(cluster => 
        `- Cluster ID: ${cluster.clusterId}\n` +
        `  - Cantidad de accidentes: ${cluster.accidentCount}\n` +
        `  - Ubicación representativa: "${cluster.representativeLocation}"\n` +
        `  - Resumen de causas: ${cluster.causeSummary}\n` +
        `  - Fechas de los accidentes: ${cluster.period}`
    ).join('\n');

    const prompt = `Eres un experto analista de seguridad vial para la secretaría de tránsito de Florida, Valle del Cauca, Colombia. Tu tarea es analizar clusters de accidentes, que ya han sido agrupados geográficamente por un algoritmo espacial (DBSCAN), para identificar y reportar las zonas más críticas.

El periodo de análisis general es: ${analysisPeriod}.

Aquí están los clusters de accidentes identificados:
${clustersText}

Sigue estos pasos para tu análisis:
1.  **Evalúa cada Cluster:** Revisa cada cluster proporcionado. Un cluster con 2 o más accidentes ya es relevante. Un cluster con 3 o más es definitivamente una zona crítica.
2.  **Identifica las Zonas Críticas:** Selecciona los clusters más significativos basándote en la cantidad de accidentes. Prioriza los que tengan mayor número.
3.  **Genera el Reporte:** Estructura tu respuesta en un único objeto JSON que se ajuste al siguiente esquema. NO incluyas markdown (\`\`\`json\`\`\`). Tu respuesta debe ser solo el JSON.
    - Esquema JSON de Salida:
      {
        "type": "object",
        "properties": {
          "criticalZones": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "location": {"type": "string", "description": "La intersección o ubicación de la zona crítica, ej., 'Calle 10 con Carrera 5'."},
                "accidentCount": {"type": "number", "description": "El número total de accidentes contados en esta zona."},
                "reason": {"type": "string", "description": "Una breve explicación de por qué esta zona es considerada crítica, basada en la frecuencia y las causas."}
              },
              "required": ["location", "accidentCount", "reason"]
            }
          },
          "summary": {"type": "string", "description": "Un resumen general del análisis, con observaciones sobre las tendencias generales y recomendaciones."}
        },
        "required": ["criticalZones", "summary"]
      }
    - Para cada zona crítica que identifiques, extrae la ubicación, el conteo de accidentes y redacta una razón clara y concisa. La razón debe basarse en el resumen de causas y la alta frecuencia. Por ejemplo: "Alta concentración de accidentes ({{accidentCount}}) principalmente por exceso de velocidad en un corto período."
    - Proporciona un resumen final con observaciones y recomendaciones generales. Si notas patrones (ej: "muchos accidentes nocturnos por CBI"), menciónalos.`;

    try {
        const resultJson = await generateContent(prompt);
        const result = JSON.parse(resultJson);
        return AnalyzeCriticalZonesOutputSchema.parse(result);
    } catch (error) {
        console.error("Error analyzing critical zones with AI:", error);
        throw new Error("La IA no pudo procesar el análisis de zonas críticas.");
    }
}
