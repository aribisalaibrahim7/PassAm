import Exa from "exa-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query, category } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Check if demo bypass session cookie is active
    const cookieHeader = req.headers.get("cookie") || "";
    const isDemo = cookieHeader.includes("passam_demo_session=true");

    if (isDemo) {
      const mockResults = [
        {
          id: "1",
          url: `https://unilag.edu.ng/resources/${encodeURIComponent(query.toLowerCase().replace(/[^a-z0-9]/g, "_"))}`,
          title: `Comprehensive Guide to ${query} in Nigerian Universities`,
          text: `An academic lecture publication covering structural principles, derivations, and historical past exam frameworks of ${query} for undergraduate students.`,
          author: "Prof. O. Balogun"
        },
        {
          id: "2",
          url: `https://youtube.com/watch?v=demo_video`,
          title: `Step-by-step Tutorial on ${query}`,
          text: `A highly visual 20-minute video seminar walking through mathematical matrices and exam calculations for ${query} using intuitive visual blocks.`,
          author: "Sabi Academy"
        },
        {
          id: "3",
          url: `https://academia.edu/papers/study_notes.pdf`,
          title: `Practical Calculus Application of ${query}`,
          text: `A detailed reference syllabus guide outlining computational theorems and laboratory models built on ${query} for Nigerian engineering courses.`,
          author: "Dr. Chidi Obi"
        }
      ];

      return NextResponse.json({ results: mockResults });
    }

    // Determine the base search string based on category
    let searchQuery = query;
    let categoryFilters = {};

    switch (category) {
      case "Past Questions":
        searchQuery = `${query} university past questions exam`;
        break;
      case "Textbooks":
        searchQuery = `${query} textbook pdf download`;
        break;
      case "Video Tutorials":
        searchQuery = `${query} tutorial explanation`;
        categoryFilters = { includeDomains: ["youtube.com", "coursera.org", "khanacademy.org"] };
        break;
      case "Articles":
      default:
        categoryFilters = { excludeDomains: ["youtube.com", "tiktok.com", "instagram.com", "facebook.com"] };
        break;
    }

    // Perform neural search using Exa
    const exaKey = process.env.EXA_API_KEY;
    if (!exaKey) {
      return NextResponse.json({ error: "EXA_API_KEY environment variable is not defined" }, { status: 400 });
    }

    const exa = new Exa(exaKey);
    const response = await exa.searchAndContents(searchQuery, {
      type: "neural",
      useAutoprompt: true,
      numResults: 6,
      text: { maxCharacters: 300 }, // We only need a short snippet for the description
      ...categoryFilters
    });

    return NextResponse.json({ results: response.results });
  } catch (error) {
    console.error("Exa Search Error:", error);
    return NextResponse.json({ error: "Failed to perform search" }, { status: 500 });
  }
}
