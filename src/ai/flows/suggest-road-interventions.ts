
'use server';
/**
 * @fileOverview Este flujo de IA sugiere intervenciones viales específicas para zonas críticas.
 */
import { generateContent } from '@/ai/genkit';
import type { SuggestRoadInterventionsInput, SuggestRoadInterventionsOutput } from './suggest-road-interventions.types';
import { SuggestRoadInterventionsOutputSchema } from './suggest-road-interventions.types';


export async function suggestRoadInterventions(input: SuggestRoadInterventionsInput): Promise<SuggestRoadInterventionsOutput> {
    const { criticalZoneAnalysis, accidentData } = input;
    
    const prompt = `Eres un experto en ingeniería y seguridad vial para la secretaría de tránsito de Florida, Valle del Cauca, y conoces la normativa colombiana a la perfección. Tu misión es analizar las zonas críticas de accidentes y proponer intervenciones viales efectivas, viables y legalmente soportadas.

Aquí tienes los datos que debes usar:

1.  **Análisis de Zonas Críticas (tu fuente principal):**
    ${criticalZoneAnalysis}

2.  **Datos Crudos de Accidentes (para contexto si lo necesitas):**
    ${accidentData}

**CRITERIOS NORMATIVOS PARA SUGERENCIAS DE INTERVENCIÓN (OBLIGATORIO SEGUIR ESTAS REGLAS):**

1.  **🚧 Reductor de velocidad (Resalto o 'Policía acostado')**
    *   **Cuándo usar:** Solo en vías locales/residenciales. **NUNCA** en vías arterias o colectoras.
    *   **Requisitos:** Debe haber evidencia de alta velocidad (>30 km/h) o riesgo peatonal (cerca de colegios, parques, hospitales).
    *   **Justificación:** Si recomiendas esto, tu justificación debe mencionar que la vía es de tipo local/residencial y que se busca proteger a los peatones o mitigar la alta velocidad.

2.  **🛑 Señal de límite de velocidad**
    *   **Cuándo usar:** En cualquier tipo de vía donde se necesite regular la velocidad, especialmente si un reductor no es viable (ej. vías arterias).
    *   **Requisitos:** La justificación **siempre** debe mencionar que "la implementación final requiere un estudio técnico de tránsito para ser válida", según la Resolución 1885 de 2015.
    *   **Límites estándar a mencionar:** 30 km/h para zonas escolares/residenciales, 50 km/h para el resto de zonas urbanas.

3.  **🚦 Semáforo**
    *   **Cuándo usar:** Solo en intersecciones con alto conflicto vehicular/peatonal, o donde un PARE/CEDA no es suficiente debido al alto volumen de tráfico o accidentalidad.
    *   **Requisitos:** La justificación **siempre** debe indicar que "su instalación está condicionada a un estudio de semaforización que analice el volumen vehicular, flujo peatonal e índices de accidentalidad".
    *   **Justificación:** Ejemplo: "Dada la alta recurrencia de colisiones en esta intersección, se recomienda un semáforo, sujeto a los resultados de un estudio técnico de viabilidad."

4.  **🪧 Otras señales (PARE, CEDA, Cruce Escolar, etc.)**
    *   **Cuándo usar:** Cuando el análisis de causas lo justifique (ej. "no respetar señal de pare").
    *   **Requisitos:** La justificación debe basarse en el Manual de Señalización Vial y buscar corregir un comportamiento específico que causa accidentes.

**Tus Instrucciones:**

1.  **Analiza Cada Zona Crítica:** Para cada zona, revisa la ubicación, cantidad de accidentes y causas.
2.  **Sugiere Intervenciones Específicas:** Basado en las causas, elige la intervención más lógica de acuerdo a los **CRITERIOS NORMATIVOS**.
3.  **Justifica Cada Recomendación:** Escribe una justificación clara que enlace la causa del problema con la solución propuesta y que **cumpla con los requisitos de justificación** descritos en los criterios.
4.  **Genera una recomendación para cada zona crítica identificada.**
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
