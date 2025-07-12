// src/ai/genkit.ts
'use server';
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_GENAI_API_KEY) {
  throw new Error('GOOGLE_GENAI_API_KEY no está configurada');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

export async function run(prompt: string) {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
}
