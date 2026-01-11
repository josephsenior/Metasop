import { google } from '@ai-sdk/google';

// Create a google instance - AI SDK 3.4.0 reads GOOGLE_GENERATIVE_AI_API_KEY from env
// Set fallback in case env var is missing
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "AIzaSyDXU-tjxq_D1bLT0RTmSlOQMoCJy2n8tks";
}

// Use Gemini 3 Flash Preview for the chat assistant
export const geminiModel = google('gemini-3-flash-preview');
