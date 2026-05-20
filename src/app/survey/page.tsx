"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Sparkles, ArrowRight, BrainCircuit, Check, CheckCircle2, ChevronRight, HelpCircle, Loader2 } from "lucide-react";

interface Question {
  id: number;
  text: string;
  options: {
    key: string;
    text: string;
    label: string;
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "How do you retain complex academic information best?",
    options: [
      { key: "A", label: "Reading slide decks & text material", text: "Textual & Visual Review" },
      { key: "B", label: "Listening to audio lectures & voice summaries", text: "Auditory Assimilation" },
      { key: "C", label: "Solving calculators, practice exercises, & past questions", text: "Kinaesthetic Problem-Solving" },
      { key: "D", label: "Engaging in structured interactive chat & questioning", text: "Conversational Feedback" },
    ],
  },
  {
    id: 2,
    text: "Which academic area is your strongest domain?",
    options: [
      { key: "A", label: "Theoretical course works (e.g. History, Biology systems)", text: "Theory & Textual Conceptions" },
      { key: "B", label: "Audio presentations, discussions, or seminar notes", text: "Collaborative Contexts" },
      { key: "C", label: "Calculations, algorithms, & logic (e.g. Mathematics, Programming)", text: "Analytical Calculations" },
      { key: "D", label: "Curating scattered resources, syllabus mapping, & planning", text: "Resource Organization" },
    ],
  },
  {
    id: 3,
    text: "Where do you face the most difficulty during exam prep?",
    options: [
      { key: "A", label: "Remembering specific definitions, dates, and names", text: "Rote Memorization Retention" },
      { key: "B", label: "Staying focused on long audio tracks or classroom meetings", text: "Attention Maintenance" },
      { key: "C", label: "Applying high-level concepts to actual past exam questions", text: "Practical Execution Speed" },
      { key: "D", label: "Finding syllabus-aligned resources under unstable networks", text: "Resource Connectivity & Curation" },
    ],
  },
  {
    id: 4,
    text: "What describes your default study speed or pace?",
    options: [
      { key: "A", label: "Slow, deep, structured sessions to grasp every detail", text: "Deep System Review" },
      { key: "B", label: "Moderate daily listening or flashcard testing in breaks", text: "Micro-learning Pacing" },
      { key: "C", label: "Intense high-impact cramming session days before the test", text: "Burst Mode Action" },
      { key: "D", label: "Iterative Q&A with friends or online tutors", text: "Feedback-driven Loops" },
    ],
  },
  {
    id: 5,
    text: "What is your main target for the upcoming exams?",
    options: [
      { key: "A", label: "Aiming for a solid First Class GPA (4.50+ / 5.00 or 3.50+ / 4.00)", text: "Academics Supremacy" },
      { key: "B", label: "Significantly boosting my CGPA to a safe Second Class Upper", text: "Performance Growth" },
      { key: "C", label: "Mastering complex programming/math applications with confidence", text: "Specialization Mastery" },
      { key: "D", label: "Studying effectively using offline caching to save expensive internet bundles", text: "Offline Optimization" },
    ],
  },
];

export default function SurveyPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [finished, setFinished] = useState(false);
  const [profileResult, setProfileResult] = useState<{
    archetype: string;
    strength: string;
    weakness: string;
    strategy: string;
  } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if demo or standard user
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const cookiesArr = document.cookie.split(";");
      const isDemoSession = cookiesArr.some((item) => item.trim().startsWith("passam_demo_session=true"));
      setIsDemo(!user && isDemoSession);
    };
    checkUser();
  }, [supabase.auth]);

  const handleSelectOption = (questionId: number, optionKey: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
    
    // Automatically advance with smooth transition
    if (currentStep < QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 300);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const calculateDiagnosticProfile = () => {
    // Tally answers
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    Object.values(answers).forEach((ans) => {
      if (ans in counts) {
        counts[ans as "A" | "B" | "C" | "D"] += 1;
      }
    });

    // Find highest count category
    let maxCat = "A";
    let maxVal = -1;
    Object.entries(counts).forEach(([cat, val]) => {
      if (val > maxVal) {
        maxVal = val;
        maxCat = cat;
      }
    });

    let archetype = "Strategic System Reader";
    let strength = "Logical deep textual retention & syllabus synthesis";
    let weakness = "Active formula rote recall under strict test conditions";
    let strategy = "Prioritize generating AI-curated Flashcards daily and use active recall intervals to lock in terms.";

    if (maxCat === "B") {
      archetype = "Auditory Content Analyst";
      strength = "Excellent sound assimilation and context mapping from speech";
      weakness = "Focused concentration in dense reading-intensive worksheets";
      strategy = "Leverage our audio transcript player, reading along to voice notes, and use voice input to answer AI chats.";
    } else if (maxCat === "C") {
      archetype = "Practical Engineering Mind";
      strength = "Analytical processing, calculation speed, and coding problem logic";
      weakness = "Rote textbook definitions and historical theoretical models";
      strategy = "Use the Study Hub with specialized computational prompts, and practice formulas through mock assessments.";
    } else if (maxCat === "D") {
      archetype = "Interactive Resource Planner";
      strength = "Iterative Q&A synthesis, and organizing syllabus targets";
      weakness = "Unstable internet setups blocking live online resource streaming";
      strategy = "Save major AI Chat topics to local storage, utilize PWA offline databases, and take quizzes offline.";
    }

    return { archetype, strength, weakness, strategy };
  };

  const handleSubmit = async () => {
    setLoading(true);
    const profile = calculateDiagnosticProfile();
    setProfileResult(profile);

    try {
      if (isDemo) {
        // Save demo profile
        localStorage.setItem("passam_demo_survey", JSON.stringify({
          has_taken_survey: true,
          survey_profile: profile,
        }));
        
        // Also write demo survey cookie for Server-side components lookup
        const date = new Date();
        date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000);
        const encodedProfile = encodeURIComponent(JSON.stringify(profile));
        document.cookie = `passam_demo_survey=${encodedProfile}; path=/; expires=${date.toUTCString()};`;
      } else {
        // Save Supabase Auth metadata
        const { error } = await supabase.auth.updateUser({
          data: {
            has_taken_survey: true,
            survey_profile: profile,
          },
        });
        if (error) throw error;
      }

      setFinished(true);
    } catch (err) {
      console.error("Survey submission failure:", err);
      alert("Failed to submit survey. Profile saved locally.");
      setFinished(true);
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = ((currentStep + 1) / QUESTIONS.length) * 100;
  const isAllAnswered = Object.keys(answers).length === QUESTIONS.length;

  if (finished && profileResult) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 md:p-8 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10"></div>

        <div className="glass max-w-2xl w-full p-8 md:p-10 rounded-3xl border border-border shadow-2xl space-y-8 animate-in zoom-in-95 duration-500 text-center">
          <div className="mx-auto w-20 h-20 bg-primary/10 text-primary border border-primary/20 rounded-2xl flex items-center justify-center glow-primary">
            <CheckCircle2 size={40} />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Your Diagnostic Profile Ready!</h1>
            <p className="text-muted-foreground text-sm font-medium">PassAm AI analyzed your answers and designed a custom learning strategy.</p>
          </div>

          {/* Result Card */}
          <div className="glass p-6 md:p-8 rounded-2xl border border-border/80 text-left bg-foreground/[0.02] space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 bg-primary/10 rounded-bl-xl text-primary font-bold text-xs uppercase tracking-widest">
              Profile
            </div>
            
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Learning Archetype</p>
              <h3 className="text-xl font-bold text-foreground flex items-center gap-1.5">
                <BrainCircuit className="text-accent" size={20} /> {profileResult.archetype}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/30">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Key Capability</p>
                <p className="text-xs font-semibold text-foreground/90 leading-relaxed">{profileResult.strength}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-rose-500/80 uppercase tracking-widest mb-1">Core Weakness</p>
                <p className="text-xs font-semibold text-foreground/90 leading-relaxed">{profileResult.weakness}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border/30">
              <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1.5">Tailored AI Study Plan</p>
              <div className="p-3.5 bg-primary/5 border border-primary/10 rounded-xl">
                <p className="text-xs font-medium leading-relaxed text-primary-foreground/90">
                  {profileResult.strategy}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-4 bg-primary text-primary-foreground font-extrabold text-sm rounded-xl transition-all hover:bg-primary/95 active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group cursor-pointer"
          >
            Launch Personalized Portal
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  const q = QUESTIONS[currentStep];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 md:p-8 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10"></div>

      <div className="glass max-w-2xl w-full p-6 md:p-10 rounded-3xl border border-border shadow-2xl space-y-8 animate-in fade-in duration-300">
        
        {/* Header Progress indicator */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span>Step {q.id} of {QUESTIONS.length}</span>
            <span>{Math.round(progressPercent)}% Done</span>
          </div>
          <div className="w-full h-1.5 bg-foreground/5 rounded-full overflow-hidden border border-border/20">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out glow-primary"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Diagnostic Question */}
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl mt-0.5">
              <HelpCircle size={18} />
            </div>
            <h2 className="text-xl md:text-2xl font-black leading-tight text-foreground">
              {q.text}
            </h2>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-3.5 pt-2">
            {q.options.map((opt) => {
              const isSelected = answers[q.id] === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => handleSelectOption(q.id, opt.key)}
                  className={`w-full text-left p-4 md:p-5 rounded-2xl border transition-all text-sm font-semibold flex items-center justify-between group cursor-pointer hover:scale-[1.01] active:scale-95 ${
                    isSelected
                      ? "bg-primary/10 border-primary text-primary shadow-sm"
                      : "bg-foreground/[0.02] border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center border font-bold text-xs uppercase transition-all ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-card border-border text-muted-foreground group-hover:border-foreground/20"
                    }`}>
                      {opt.key}
                    </span>
                    <div>
                      <p className="text-foreground">{opt.text}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-normal">{opt.label}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="p-1 bg-primary text-primary-foreground rounded-full">
                      <Check size={12} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex justify-between pt-4 border-t border-border/20">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-5 py-3 bg-foreground/5 hover:bg-foreground/10 rounded-xl font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            Back
          </button>

          {currentStep === QUESTIONS.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={loading || !isAllAnswered}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Analyzing...</>
              ) : (
                <>Submit Diagnostics <Sparkles size={14} /></>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={!answers[q.id]}
              className="bg-foreground/5 hover:bg-foreground/10 border border-border px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 disabled:opacity-50"
            >
              Next <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
