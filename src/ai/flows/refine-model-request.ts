'use server';

/**
 * @fileOverview Refines a 3D model request description using AI.
 *
 * - refineModelRequest - A function that refines the model request description.
 * - RefineModelRequestInput - The input type for the refineModelRequest function.
 * - RefineModelRequestOutput - The return type for the refineModelRequest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineModelRequestInputSchema = z.object({
  description: z.string().describe('The original description of the 3D model request.'),
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo related to the 3D model, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  pinterestLink: z.string().optional().describe('A link to a Pinterest board with reference images.'),
});
export type RefineModelRequestInput = z.infer<typeof RefineModelRequestInputSchema>;

const RefineModelRequestOutputSchema = z.object({
  refinedDescription: z.string().describe('The refined description of the 3D model request.'),
});
export type RefineModelRequestOutput = z.infer<typeof RefineModelRequestOutputSchema>;

export async function refineModelRequest(input: RefineModelRequestInput): Promise<RefineModelRequestOutput> {
  return refineModelRequestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineModelRequestPrompt',
  input: {schema: RefineModelRequestInputSchema},
  output: {schema: RefineModelRequestOutputSchema},
  prompt: `You are an AI assistant that helps refine 3D model requests for clarity and detail.

  Based on the user's description, any provided images, and Pinterest links, suggest a refined description that would help a 3D model creator better understand the user's needs.

  Original Description: {{{description}}}
  {{#if photoDataUri}}
  Photo: {{media url=photoDataUri}}
  {{/if}}
  {{#if pinterestLink}}
  Pinterest Link: {{{pinterestLink}}}
  {{/if}}

  Refined Description:`,
});

const refineModelRequestFlow = ai.defineFlow(
  {
    name: 'refineModelRequestFlow',
    inputSchema: RefineModelRequestInputSchema,
    outputSchema: RefineModelRequestOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      refinedDescription: output!.refinedDescription,
    };
  }
);
