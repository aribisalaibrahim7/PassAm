import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";

// Use the official @ai-sdk/groq provider — always targets /v1/chat/completions
// @ai-sdk/openai v3+ defaults to the new Responses API which Groq does not support
const groqProvider = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();



    // Sanitize messages: flatten any parts-based messages into plain string content
    const formattedMessages = messages
      .filter((m: any) => m.role === "user" || m.role === "assistant")
      .map((m: any) => {
        let content = "";
        if (typeof m.content === "string") {
          content = m.content;
        } else if (m.parts && Array.isArray(m.parts)) {
          content = m.parts
            .map((part: any) => {
              if (typeof part === "string") return part;
              if (part && part.type === "text") return part.text ?? "";
              return "";
            })
            .join("");
        }
        return {
          role: m.role as "user" | "assistant",
          content,
        };
      })
      .filter((m: any) => m.content.trim().length > 0);

    const result = streamText({
      model: groqProvider("llama-3.3-70b-versatile"),
      system: `You are an expert AI tutor named PassAm, specifically tailored for Nigerian university students.
Your goal is to help them understand complex academic topics efficiently, especially under low-bandwidth constraints.
Keep your answers concise, direct, and highly informative.
Use clear markdown formatting: bold for key terms, bullet points for lists, and numbered steps for processes.
Use simple analogies where possible to explain complex concepts.
If a student asks a vague question, gently prompt them for more context (e.g., course code or specific topic).`,
      messages: formattedMessages,
      temperature: 0.7,
    });

    // toTextStreamResponse() streams plain text chunks that the client reads via fetch()
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate response" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
