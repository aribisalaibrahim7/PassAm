PassAm is an ultra-fast, AI-powered Progressive Web App (PWA) designed specifically as a personalized tutor for Nigerian university students.

The core mission of PassAm is to deliver Ivy-League-level educational support while being highly resilient to the realities of the Nigerian tertiary education landscape—specifically erratic network connectivity, high data costs, and the intense pressure of maintaining a strong GPA.

Here is a breakdown of what makes PassAm unique and powerful:

🌟 Core Features
The Study Hub (Real-Time AI Tutor):
Powered by Groq (Llama 3.3), the chat interface provides near-instantaneous responses, allowing students to ask complex questions about their coursework without waiting for long loading spinners.
It features integrated Voice-to-Text via Deepgram, allowing students to simply dictate their questions (saving time and mobile typing effort), which are transcribed instantly even on 3G networks.
Intelligent Assessments (Flashcards & Exams):
Instead of manually creating study materials, students can type in a topic (e.g., "Linear Algebra Eigenvectors"), and the app leverages Google Gemini 1.5 Flash to instantly generate an interactive, 3D-flipping deck of flashcards and mock exams perfectly structured for review.
Curated Resource Library (Neural Search):
Powered by Exa AI, the library acts as a smart academic search engine. Instead of sifting through standard Google results, students can search for "Past Questions," "Textbooks," or "Video Tutorials," and the app dynamically fetches highly relevant, academic-focused web resources and PDF links.
Data-Saver & Offline-First Design:
As a configured PWA (Progressive Web App), PassAm is installable directly to a mobile home screen. It caches essential UI elements to load instantly even when offline.
It includes a built-in "Text-Only Mode" to prevent heavy images or videos from auto-loading and consuming precious mobile data.
Gamified Dashboard:
A personalized hub that tracks the student's Target GPA, study streaks, and upcoming deadlines, keeping them disciplined and motivated.
🛠️ The Tech Stack
Frontend: Next.js 14 (App Router) and Tailwind CSS v4, featuring a premium dark-mode, glassmorphic design that feels highly modern.
Authentication: Supabase (PostgreSQL-backed) for secure, seamless user login and session management.
AI Engine: Vercel AI SDK seamlessly orchestrating multiple specialized models (Groq for fast chat, Gemini for structured data generation, Exa for web scraping, and Deepgram for audio).
In short: PassAm is not just another ChatGPT wrapper; it is a highly localized, deeply optimized academic companion engineered to help students study smarter, consume less data, and ace their exams.