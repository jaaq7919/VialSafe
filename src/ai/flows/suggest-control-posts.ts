
'use server';

/**
 * @fileOverview This AI flow suggests strategic locations and times for traffic control posts.
 */

import { generateContent } from '@/ai/genkit';
import type { SuggestControlPostsInput, SuggestControlPostsOutput } from './suggest-control-posts.types';
import { SuggestControlPostsOutputSchema } from './suggest-control-posts.types';

export async function suggestControlPosts(input: SuggestControlPostsInput): Promise<SuggestControlPostsOutput> {
    const { accidentData } = input;
    
    const prompt = `Eres un experto estratega de seguridad vial para la secretaría de tránsito de Florida, Valle del Cauca, Colombia. Tu tarea es recomendar la ubicación y el tipo de puestos de control para maximizar la prevención de accidentes.

  Basado en los siguientes datos históricos de accidentes, proporciona una lista de recomendaciones para puestos de control.

  - **Datos Históricos de Accidentes (en formato CSV):**
  ${accidentData}

  **Instrucciones:**
  1.  **Analiza los Patrones:** Revisa los datos para encontrar patrones clave. Usa las coordenadas 'latitud' y 'longitud' para identificar concentraciones geográficas de accidentes. Busca patrones por:
      - **Ubicación Geográfica:** ¿Dónde se agrupan los accidentes según sus coordenadas? Usa la columna 'ubicacion' como referencia textual.
      - **Causa:** ¿Qué causas son más comunes en esas concentraciones (exceso de velocidad, alcohol, etc.)?
      - **Horario:** ¿Hay picos de accidentalidad en ciertos días de la semana o rangos horarios (ej. noches de fin de semana, horas pico)?

  2.  **Sugiere Puestos de Control:** Para los patrones más claros, recomienda un puesto de control. Cada recomendación debe incluir:
      - **Ubicación:** El lugar preciso para el control.
      - **Tipo de Control:** El control más relevante para la causa principal (ej. "Control de Velocidad" para zonas con esa causa, "Control de Alcoholemia" si la causa es CBI).
      - **Horario Sugerido:** El horario donde el control sería más efectivo según los datos.
      - **Justificación:** Una explicación clara de por qué esa ubicación, horario y tipo de control son los adecuados.

  3.  **Genera 2 a 4 recomendaciones clave.** No más de 4.
  4.  **Formatea tu respuesta final como un único objeto JSON que se ajuste al siguiente esquema. NO incluyas markdown (\`\`\`json\`\`\`). Tu respuesta debe ser solo el JSON.**
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
                "controlType": {"type": "string"},
                "schedule": {"type": "string"},
                "justification": {"type": "string"}
              },
              "required": ["location", "controlType", "schedule", "justification"]
            }
          }
        },
        "required": ["recommendations"]
      }`;

    try {
        const resultJson = await generateContent(prompt);
        const result = JSON.parse(resultJson);
        return SuggestControlPostsOutputSchema.parse(result);
    } catch (error) {
        console.error("Error suggesting control posts with AI:", error);
        throw new Error("La IA no pudo procesar las sugerencias de puestos de control.");
    }
}
