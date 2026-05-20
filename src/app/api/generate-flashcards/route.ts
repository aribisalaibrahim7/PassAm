import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

// Initialize the Google client with standard API keys
const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATION_API_KEY || process.env.GEMINI_API_KEY,
});

// Define the schema for the flashcards
const flashcardSchema = z.object({
  cards: z.array(
    z.object({
      front: z.string().describe("A concise academic question, concept term, or problem statement for the front page"),
      back: z.string().describe("The thorough, precise answer, proof, or definition on the back page with short memory aid details"),
    })
  ).describe("A list of highly relevant, high-quality study cards."),
});

export async function POST(req: Request) {
  try {
    const { topic, count } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const cardCount = Math.min(Math.max(parseInt(count) || 5, 5), 20);

    // Check if demo bypass session cookie is active
    const cookieHeader = req.headers.get("cookie") || "";
    const isDemo = cookieHeader.includes("passam_demo_session=true");

    if (isDemo) {
      const mockCards = Array.from({ length: cardCount }, (_, idx) => ({
        front: `[Card ${idx + 1}] What is a key dimension of "${topic}"?`,
        back: `This represents element ${idx + 1} of your active study syllabus. Memorize the fundamental structures, system algorithms, and performance matrices governing ${topic} to maximize exam performance.`
      }));

      return NextResponse.json({ flashcards: mockCards });
    }

    // Call Gemini 2.5 Flash with detailed system directives to create high quality cards
    const { object } = await generateObject({
      model: googleProvider('gemini-2.5-flash'),
      schema: flashcardSchema,
      prompt: `You are an expert university professor creating an active recall flashcard study deck for a Nigerian university student.
      Generate a set of EXACTLY ${cardCount} flashcards for the following topic: "${topic}". 
      Each flashcard front must contain a clear, academically rich question or conceptual challenge.
      Each flashcard back must contain a comprehensive, clear, and educational answer containing the core definitions, equations, proofs, or conceptual details needed to master the topic.`,
    });

    return NextResponse.json({ flashcards: object.cards });
  } catch (error) {
    console.error("Flashcard Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate flashcards" }, { status: 500 });
  }
}
