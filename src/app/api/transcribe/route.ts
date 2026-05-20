import { DeepgramClient, ListenV1Response } from "@deepgram/sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Check if demo bypass session cookie is active or deepgram key is missing
    const cookieHeader = req.headers.get("cookie") || "";
    const isDemo = cookieHeader.includes("passam_demo_session=true");
    const deepgramKey = process.env.DEEPGRAM_API_KEY;

    if (isDemo || !deepgramKey) {
      // Return a simulated, relevant academic study question
      const sampleTranscripts = [
        "Explain memory-mapped I/O in systems programming.",
        "How do process synchronization and semaphores work in CSC 301?",
        "What are simple analogies to understand CPU scheduling algorithms?",
        "Explain virtual memory allocation and page replacement policies."
      ];
      const randomTranscript = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)];
      
      // Simulate quick latency
      await new Promise((resolve) => setTimeout(resolve, 800));
      return NextResponse.json({ transcript: randomTranscript });
    }

    const deepgram = new DeepgramClient({ apiKey: deepgramKey });

    // Convert Blob to Buffer for Deepgram SDK
    const buffer = Buffer.from(await file.arrayBuffer());

    // Send to Deepgram using Nova-2 for highest accuracy and speed
    const response = await deepgram.listen.v1.media.transcribeFile(
      buffer,
      {
        model: "nova-2",
        smart_format: true,
      }
    );

    const transcript = (response as ListenV1Response).results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
    
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Transcription Route Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

