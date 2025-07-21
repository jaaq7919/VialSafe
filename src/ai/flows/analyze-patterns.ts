
'use server';

/**
 * @fileOverview This AI flow analyzes historical accident data to find patterns related to external factors like weather and special events.
 */

import { generateContent } from '@/ai/genkit';
import type { AnalyzePatternsInput, AnalyzePatternsOutput } from './analyze-patterns.types';
import { AnalyzePatternsOutputSchema } from './analyze-patterns.types';

export async function analyzePatterns(input: AnalyzePatternsInput): Promise<AnalyzePatternsOutput> {
    const { accidentData } = input;
    
    const prompt = `Eres un experto analista de datos y seguridad vial para la secretaría de tránsito de Florida, Valle del Cauca, Colombia. Tu tarea es encontrar patrones y correlaciones ocultas en los datos históricos de accidentes, enfocándote en cómo factores externos como el clima y eventos especiales impactan la seguridad vial.

  **Datos Históricos de Accidentes (en formato CSV):**
  ${accidentData}

  **Instrucciones de Análisis:**
  1.  **Analiza los Datos:** Revisa todo el conjunto de datos CSV proporcionado. Busca correlaciones entre las columnas 'clima', 'evento_especial' y otras columnas como 'causa', 'ubicacion', 'hora', y 'tipo' de accidente.
  2.  **Identifica de 2 a 4 Patrones Clave:** No te limites a lo obvio. Busca hallazgos interesantes y accionables. Aquí tienes ejemplos del tipo de patrones que debes buscar:
      *   **Patrón Climático:** "¿Hay un aumento significativo de colisiones por 'piso húmedo' cuando hay 'Lluvia Ligera' en la zona céntrica?"
      *   **Patrón de Evento:** "¿Se disparan los accidentes por 'exceso de velocidad' y 'alcoholemia' en las noches de los fines de semana cuando hay 'Fiesta Local'?"
      *   **Patrón Combinado:** "Durante los 'Días de Mercado' con 'Lluvia Fuerte', ¿aumentan los atropellos a peatones cerca de la plaza principal?"
      *   **Patrón de Causa-Clima:** "¿La causa 'Falla mecánica' se correlaciona con días de 'Lluvia Fuerte', sugiriendo problemas de visibilidad o frenos?"
  3.  **Genera un Reporte de Hallazgos:** Para cada patrón clave que identifiques, debes proporcionar:
      *   **Título del Patrón:** Un título corto y descriptivo (ej. "Incremento de Choques por Lluvia").
      *   **Descripción:** Una explicación clara del patrón, mencionando las variables correlacionadas y, si es posible, la magnitud del problema (ej. "Se observó que el 40% de los accidentes por 'piso húmedo' ocurrieron durante lluvias ligeras...").
      *   **Recomendación:** Una sugerencia concreta y accionable para mitigar el riesgo identificado (ej. "Implementar campañas de concientización sobre la reducción de velocidad en días de lluvia" o "Sugerir un puesto de control de alcoholemia en la salida a Candelaria durante las fiestas locales").
  4.  **Proporciona un Resumen General:** Al final, escribe un párrafo de resumen con tu conclusión principal sobre cómo los factores externos afectan la seguridad vial en Florida.
  5.  **Formatea tu respuesta final como un único objeto JSON que se ajuste al siguiente esquema. NO incluyas markdown (\`\`\`json\`\`\`). Tu respuesta debe ser solo el JSON.**
      - Esquema JSON de Salida:
      {
        "type": "object",
        "properties": {
          "summary": { "type": "string", "description": "Resumen general de tus conclusiones." },
          "findings": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "patternTitle": { "type": "string" },
                "description": { "type": "string" },
                "recommendation": { "type": "string" }
              },
              "required": ["patternTitle", "description", "recommendation"]
            }
          }
        },
        "required": ["summary", "findings"]
      }`;

    try {
        const resultJson = await generateContent(prompt);
        const result = JSON.parse(resultJson);
        return AnalyzePatternsOutputSchema.parse(result);
    } catch (error) {
        console.error("Error analyzing patterns with AI:", error);
        throw new Error("La IA no pudo procesar el análisis de patrones.");
    }
}

    