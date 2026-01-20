import { NextRequest, NextResponse } from "next/server";
import { GeminiLLMProvider } from "@/lib/metasop/adapters/gemini-adapter";
import { logger } from "@/lib/metasop/utils/logger";

export async function POST(req: NextRequest) {
  try {
    const { audio, mimeType } = await req.json();

    if (!audio) {
      return NextResponse.json({ error: "No audio data provided" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const gemini = new GeminiLLMProvider(apiKey);
    logger.info("Transcription started", { mimeType: mimeType || "audio/webm", size: audio.length });
    const text = await gemini.transcribe(audio, mimeType || "audio/webm");
    logger.info("Transcription success", { textLength: text.length });

    return NextResponse.json({ text });
  } catch (error: any) {
    logger.error("Transcription route error", { error: error.message });
    return NextResponse.json(
      { error: error.message || "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
