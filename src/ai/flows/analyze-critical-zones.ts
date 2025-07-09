'use server';

/**
 * @fileOverview Analyzes critical zones with high accident concentration using historical accident data.
 *
 * - analyzeCriticalZones - A function that handles the analysis of critical zones.
 * - AnalyzeCriticalZonesInput - The input type for the analyzeCriticalZones function.
 * - AnalyzeCriticalZonesOutput - The return type for the analyzeCriticalZones function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCriticalZonesInputSchema = z.object({
  historicalAccidentData: z
    .string()
    .describe('Historical accident data, preferably in CSV format.'),
  criteria: z
    .string()
    .optional()
    .describe(
      'Optional criteria for identifying critical zones, e.g., accident density threshold.'
    ),
});

export type AnalyzeCriticalZonesInput = z.infer<
  typeof AnalyzeCriticalZonesInputSchema
>;

const AnalyzeCriticalZonesOutputSchema = z.object({
  criticalZones: z
    .string()
    .describe(
      'A description of the identified critical zones with high accident concentration.'
    ),
  recommendations: z
    .string()
    .describe(
      'Recommendations for intervention in the identified critical zones.'
    ),
});

export type AnalyzeCriticalZonesOutput = z.infer<
  typeof AnalyzeCriticalZonesOutputSchema
>;

export async function analyzeCriticalZones(
  input: AnalyzeCriticalZonesInput
): Promise<AnalyzeCriticalZonesOutput> {
  return analyzeCriticalZonesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCriticalZonesPrompt',
  input: {schema: AnalyzeCriticalZonesInputSchema},
  output: {schema: AnalyzeCriticalZonesOutputSchema},
  prompt: `You are a traffic analyst tasked with identifying critical zones with high accident concentration using historical accident data.

Analyze the following historical accident data to identify critical zones:

Historical Accident Data: {{{historicalAccidentData}}}

Optional Criteria: {{{criteria}}}

Based on the data, identify and describe the critical zones with high accident concentration and provide recommendations for intervention in these zones.

Format the output as a JSON object with "criticalZones" and "recommendations" fields.`,
});

const analyzeCriticalZonesFlow = ai.defineFlow(
  {
    name: 'analyzeCriticalZonesFlow',
    inputSchema: AnalyzeCriticalZonesInputSchema,
    outputSchema: AnalyzeCriticalZonesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
