
'use server';
/**
 * @fileOverview Este flujo de IA sugiere intervenciones viales específicas para zonas críticas.
 */
import { generateContent } from '@/ai/genkit';
import type { SuggestRoadInterventionsInput, SuggestRoadInterventionsOutput } from './suggest-road-interventions.types';
import { SuggestRoadInterventionsOutputSchema } from './suggest-road-interventions.types';


export async function suggestRoadInterventions(input: SuggestRoadInterventionsInput): Promise<SuggestRoadInterventionsOutput> {
    const { criticalZoneAnalysis, accidentData } = input;
    
    const prompt = `Eres un experto en ingeniería y seguridad vial para la secretaría de tránsito de Florida, Valle del Cauca. Tu misión es analizar las zonas críticas de accidentes y proponer intervenciones viales efectivas para reducir la siniestralidad.

Aquí tienes los datos que debes usar:

1.  **Análisis de Zonas Críticas (tu fuente principal):**
    ${criticalZoneAnalysis}

2.  **Datos Crudos de Accidentes (para contexto si lo necesitas):**
    ${accidentData}

**Tus Instrucciones:**

1.  **Analiza Cada Zona Crítica:** Para cada zona identificada en el análisis, revisa cuidadosamente la ubicación, la cantidad de accidentes y, lo más importante, el resumen de causas.
2.  **Sugiere Intervenciones Específicas:** Basado en las causas, recomienda la intervención más lógica y efectiva. No seas genérico.
    *   Si la causa es "exceso de velocidad", recomienda "Implementar Reductores de Velocidad" o "Instalar radar de velocidad con señalización".
    *   Si la causa es "no respetar señal de pare/cruce", recomienda "Instalación de Semáforo" o "Mejorar visibilidad de la señalización vertical".
    *   Si son colisiones en un cruce, un "Semáforo" es una opción fuerte.
    *   Si hay problemas de visibilidad nocturna, sugiere "Mejorar iluminación pública".
3.  **Justifica Cada Recomendación:** Para cada sugerencia, escribe una justificación clara y concisa que enlace directamente la causa del problema con la solución propuesta. Por ejemplo: "Se recomienda la instalación de un semáforo debido a la alta frecuencia de colisiones (X accidentes) causadas por el incumplimiento de la señal de PARE en esta intersección."
4.  **Genera una recomendación para cada zona crítica identificada en el análisis.**
5.  **Formatea tu respuesta final como un único objeto JSON que se ajuste al siguiente esquema. NO incluyas markdown (\`\`\`json\`\`\`). Tu respuesta debe ser solo el JSON.**
    - Esquema JSON de Salida:
      {
        "type": "object",
        "properties": {
          "recommendations": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "location": {"type": "string"},
                "intervention": {"type": "string"},
                "justification": {"type": "string"}
              },
              "required": ["location", "intervention", "justification"]
            }
          }
        },
        "required": ["recommendations"]
      }`;
      
    try {
        const resultJson = await generateContent(prompt);
        const result = JSON.parse(resultJson);
        return SuggestRoadInterventionsOutputSchema.parse(result);
    } catch (error) {
        console.error("Error suggesting road interventions with AI:", error);
        throw new Error("La IA no pudo procesar las sugerencias de intervención.");
    }
}
