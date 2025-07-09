// use server'

/**
 * @fileOverview AI-driven recommendations of road interventions based on historical accident data.
 *
 * - suggestRoadInterventions - A function that handles the road intervention suggestion process.
 * - SuggestRoadInterventionsInput - The input type for the suggestRoadInterventions function.
 * - SuggestRoadInterventionsOutput - The return type for the suggestRoadInterventions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRoadInterventionsInputSchema = z.object({
  accidentData: z.string().describe('Historical accident data, including location, time, and cause.'),
  criticalZoneAnalysis: z.string().describe('Analysis of critical zones with high accident concentration.'),
});
export type SuggestRoadInterventionsInput = z.infer<typeof SuggestRoadInterventionsInputSchema>;

const SuggestRoadInterventionsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      intervention: z.string().describe('Recommended road intervention (e.g., traffic signals, speed bumps).'),
      justification: z.string().describe('Justification for the recommended intervention based on accident data patterns.'),
    })
  ).describe('List of recommended road interventions with justifications.'),
});
export type SuggestRoadInterventionsOutput = z.infer<typeof SuggestRoadInterventionsOutputSchema>;

export async function suggestRoadInterventions(input: SuggestRoadInterventionsInput): Promise<SuggestRoadInterventionsOutput> {
  return suggestRoadInterventionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRoadInterventionsPrompt',
  input: {schema: SuggestRoadInterventionsInputSchema},
  output: {schema: SuggestRoadInterventionsOutputSchema},
  prompt: `You are an expert traffic analyst specializing in recommending road interventions to reduce accidents.

  Based on the historical accident data and critical zone analysis, provide a list of recommended road interventions with justifications.

  Historical Accident Data: {{{accidentData}}}
  Critical Zone Analysis: {{{criticalZoneAnalysis}}}

  Format your response as a JSON object with a 'recommendations' field. Each recommendation should include the 'intervention' and 'justification'.
  `,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const suggestRoadInterventionsFlow = ai.defineFlow(
  {
    name: 'suggestRoadInterventionsFlow',
    inputSchema: SuggestRoadInterventionsInputSchema,
    outputSchema: SuggestRoadInterventionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
