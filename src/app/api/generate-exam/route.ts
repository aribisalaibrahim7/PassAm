import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

// Initialize the Google client with standard API keys
const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATION_API_KEY || process.env.GEMINI_API_KEY,
});

// Define the mixed question schema supporting both objective (multiple-choice) and theory (short-answer) formats
const examSchema = z.object({
  title: z.string().describe("Descriptive title of the assessment"),
  questions: z.array(
    z.object({
      q: z.string().describe("The question prompt, scenario, or analytical challenge"),
      type: z.enum(["objective", "theory"]).describe("Whether this is a multiple-choice ('objective') or short-answer text ('theory') question"),
      options: z.array(z.string()).min(2).max(5).optional().describe("For objective questions, provide 4 relevant choices. Leave empty or undefined for theory questions."),
      answer: z.number().optional().describe("For objective questions, provide the 0-indexed correct option matching the choices array. Leave empty or undefined for theory questions."),
      sampleAnswer: z.string().optional().describe("For theory questions, provide a clear model short answer to assist with student self-grading. Leave empty or undefined for objective questions."),
      explanation: z.string().describe("A deep educational explanation detailing why the correct answer is right and providing guidance for mastering the topic."),
    })
  ).describe("A list of highly relevant, academic questions matching the format guidelines."),
});

export async function POST(req: Request) {
  try {
    const { topic, type, count } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Determine target question counts matching the user's instructions
    let questionCount = 5;
    if (type === "Quiz") {
      questionCount = Math.min(Math.max(parseInt(count) || 5, 5), 20);
    } else if (type === "Test") {
      questionCount = Math.min(Math.max(parseInt(count) || 5, 5), 10);
    } else if (type === "Exam") {
      questionCount = Math.min(Math.max(parseInt(count) || 20, 20), 60);
    }



    // Determine specific prompt instructions based on the assessment type
    let promptInstructions = "";
    if (type === "Quiz") {
      promptInstructions = `Generate exactly ${questionCount} multiple-choice ('objective') questions for the following topic: "${topic}". All questions must have type 'objective', a filled options list, and a precise answer index.`;
    } else if (type === "Test") {
      promptInstructions = `Generate exactly ${questionCount} short-answer/written ('theory') questions for the following topic: "${topic}". All questions must have type 'theory', a detailed sampleAnswer block, and empty options/answer fields.`;
    } else if (type === "Exam") {
      const theoryCount = Math.round(questionCount * 0.4);
      const objectiveCount = questionCount - theoryCount;
      promptInstructions = `Generate exactly ${questionCount} mixed questions for the following topic: "${topic}". 
      Exactly ${objectiveCount} questions must be multiple-choice ('objective') and ${theoryCount} questions must be short-answer/written ('theory') representing a 40% theory and 60% objective split.`;
    }

    // Call Gemini 2.5 Flash with detailed system directives to create high-quality mixed assessments
    const { object } = await generateObject({
      model: googleProvider('gemini-2.5-flash'),
      schema: examSchema,
      prompt: `You are an expert university professor creating a high-fidelity ${type} assessment for a Nigerian university student.
      ${promptInstructions}
      Ensure all questions are highly academic, rigorous, and follow the exact type parameters and schemas.`,
    });

    return NextResponse.json({ exam: object });
  } catch (error) {
    console.error("Exam Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate exam questions" }, { status: 500 });
  }
}
