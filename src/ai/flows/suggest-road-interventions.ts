
'use server';
/**
 * @fileOverview Flujo de prueba para verificar la conexión con la IA.
 */
import { run } from '@/ai/genkit';

export async function suggestRoadInterventions(): Promise<{ recommendation: string }> {
  try {
    const responseText = await run("buenos dias");
    return { recommendation: responseText };
  } catch (error) {
    console.error("Error in test flow:", error);
    return { recommendation: "Error al contactar la IA." };
  }
}
