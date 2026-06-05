"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { BrainCircuit, BookOpen, Clock, ChevronRight, CheckCircle2, Play, Sparkles, Loader2, ArrowRight, X, Award, RotateCcw, AlertTriangle, HelpCircle, History, BookOpenCheck, Flame, BookCopy, Calendar, ChevronLeft, Check } from "lucide-react";
import { calculateStreakUpdate } from "@/utils/streak";
import { setPassamCookie, buildCookieProfile, readCookieProfile } from "@/utils/cookies";

export default function Assessments() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Navigation tab for the main dashboard area: "builder" or "history"
  const [activeSubTab, setActiveSubTab] = useState<"builder" | "history">("builder");

  // Form parameters
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState<"Flashcards" | "Quiz" | "Test" | "Exam">("Flashcards");
  const [itemCount, setItemCount] = useState<number>(10);
  const [isGenerating, setIsGenerating] = useState(false);

  // Live Immersive Dedicated Flashcard State
  const [activeFlashcardDeck, setActiveFlashcardDeck] = useState<{
    topic: string;
    cards: { front: string; back: string }[];
  } | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCardsMap, setMasteredCardsMap] = useState<Record<number, boolean>>({});

  // Live Interactive Exam / Test / Quiz State
  const [activeExam, setActiveExam] = useState<{
    title: string;
    questions: {
      q: string;
      type: "objective" | "theory";
      options?: string[];
      answer?: number;
      sampleAnswer?: string;
      explanation: string;
    }[];
  } | null>(null);

  // Answer tracking
  const [examSelections, setExamSelections] = useState<number[]>([]); // For objectives
  const [theoryAnswers, setTheoryAnswers] = useState<string[]>([]); // For typed short-answers
  const [selfGradingScore, setSelfGradingScore] = useState<boolean[]>([]); // User checks if theory answers are correct
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScore, setExamScore] = useState(0);

  // Time-based Test States
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync / Success status alert
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Fetch student account metadata
  const fetchStudentProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        // Fetch quiz attempts & recent sessions from dedicated Supabase tables
        const { data: dbAttempts } = await supabase
          .from("quiz_attempts")
          .select("*")
          .order("time", { ascending: false });

        const { data: dbSessions } = await supabase
          .from("recent_sessions")
          .select("*")
          .order("created_at", { ascending: false });

        setUser({
          name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "Student",
          email: authUser.email,
          university: authUser.user_metadata?.university || "",
          targetGpa: authUser.user_metadata?.target_gpa || "0.00",
          currentGpa: authUser.user_metadata?.current_gpa || "0.00",
          studyStreak: authUser.user_metadata?.study_streak ?? 0,
          lastStudyDate: authUser.user_metadata?.last_study_date || "",
          cardsMastered: authUser.user_metadata?.cards_mastered ?? 0,
          quizAttempts: dbAttempts || [],
          recentSessions: dbSessions || [],
          isDemo: false,
        });
      } else {
        // Read identity from cookie (abbreviated keys handled by readCookieProfile)
        const cp = readCookieProfile();
        let customName = cp.name;
        let customUni  = cp.university;
        let customGpa  = cp.currentGpa;
        let targetGpa  = cp.targetGpa;
        let gpaScale   = cp.gpaScale;

        // Read runtime metrics from localStorage (never stored in cookies)
        let studyStreak = 0;
        let lastStudyDate = "";
        let cardsMastered = 0;
        let quizAttempts: any[] = [];
        let recentSessions: any[] = [];

        const lsProfile = localStorage.getItem("passam_demo_profile");
        if (lsProfile) {
          try {
            const p = JSON.parse(lsProfile);
            if (p.studyStreak   !== undefined) studyStreak   = p.studyStreak;
            if (p.lastStudyDate !== undefined) lastStudyDate = p.lastStudyDate;
            if (p.cardsMastered !== undefined) cardsMastered = p.cardsMastered;
          } catch { /* ignored */ }
        }

        const arraysStr = localStorage.getItem("passam_demo_arrays");
        if (arraysStr) {
          try {
            const parsed = JSON.parse(arraysStr);
            if (parsed.quizAttempts)  quizAttempts  = parsed.quizAttempts;
            if (parsed.recentSessions) recentSessions = parsed.recentSessions;
          } catch { /* ignored */ }
        }

        setUser({
          name: customName,
          email: "demo.student@unilag.edu.ng",
          university: customUni,
          targetGpa,
          currentGpa: customGpa,
          gpaScale,
          studyStreak,
          lastStudyDate,
          cardsMastered,
          quizAttempts,
          recentSessions,
          isDemo: true,
        });
      }
    } catch (err) {
      console.error("Error fetching profile on assessments page:", err);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Sync streaks and completed grades back to Supabase/Demo
  const saveAssessmentMetrics = async (newQuizAttempt?: any, cardsCount?: number) => {
    if (!user) return;

    const { streak: newStreak, lastStudyDate: newDate } = calculateStreakUpdate(
      user.studyStreak,
      user.lastStudyDate
    );
    const newCardsMastered = user.cardsMastered + (cardsCount || 0);
    const updatedAttempts = newQuizAttempt 
      ? [newQuizAttempt, ...(user.quizAttempts || [])] 
      : (user.quizAttempts || []);

    const updatedSessions = newQuizAttempt
      ? [
          {
            id: "session-" + Date.now(),
            course: newQuizAttempt.title.split(":")[0] || "Quiz",
            title: newQuizAttempt.title,
            detail: `Graded ${newQuizAttempt.grade} (${newQuizAttempt.score}/${newQuizAttempt.total})`,
            time: "Just now",
          },
          ...(user.recentSessions || [])
        ]
      : (user.recentSessions || []);

    try {
      if (user.isDemo) {
        // Arrays go to localStorage ONLY — never in cookies (prevents HTTP 431 header bloat)
        const arraysStr = localStorage.getItem("passam_demo_arrays");
        const existingArrays = arraysStr ? JSON.parse(arraysStr) : {};
        const updatedArrays = {
          ...existingArrays,
          quizAttempts: updatedAttempts.slice(0, 50),
          recentSessions: updatedSessions.slice(0, 10),
        };
        localStorage.setItem("passam_demo_arrays", JSON.stringify(updatedArrays));

        // Runtime metrics go to localStorage only — never in cookies
        const lsMetrics = {
          studyStreak: newStreak,
          lastStudyDate: newDate,
          cardsMastered: newCardsMastered,
        };
        localStorage.setItem("passam_demo_profile", JSON.stringify(lsMetrics));
        // Cookie stores identity only (abbreviated keys, ~150 B)
        setPassamCookie("passam_demo_profile", JSON.stringify(buildCookieProfile({
          name:       user.name,
          university: user.university,
          targetGpa:  user.targetGpa,
          currentGpa: user.currentGpa,
          gpaScale:   user.gpaScale,
        })), 7);

        setUser((prev: any) => ({
          ...prev,
          studyStreak: newStreak,
          lastStudyDate: newDate,
          cardsMastered: newCardsMastered,
          quizAttempts: updatedAttempts,
          recentSessions: updatedSessions
        }));
        setSaveStatus("Activity graded and saved in Demo session!");
      } else {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error("Not authenticated");

        // 1. Update slim profile fields in auth metadata
        const { error: profileErr } = await supabase.auth.updateUser({
          data: {
            study_streak: newStreak,
            last_study_date: newDate,
            cards_mastered: newCardsMastered,
          }
        });
        if (profileErr) throw profileErr;

        // 2. Save new quiz attempt if present to table
        if (newQuizAttempt) {
          const { error: attemptErr } = await supabase.from("quiz_attempts").insert({
            user_id: authUser.id,
            course: newQuizAttempt.course || newQuizAttempt.title.split(":")[0] || "Quiz",
            title: newQuizAttempt.title,
            grade: newQuizAttempt.grade,
            score: newQuizAttempt.score,
            total: newQuizAttempt.total,
          });
          if (attemptErr) throw attemptErr;
        }

        // 3. Save new session to recent sessions table if present
        if (newQuizAttempt && updatedSessions.length > 0) {
          const latestSession = updatedSessions[0];
          const { error: sessionErr } = await supabase.from("recent_sessions").insert({
            id: latestSession.id,
            user_id: authUser.id,
            course: latestSession.course,
            title: latestSession.title,
            detail: latestSession.detail,
            time: latestSession.time,
          });
          if (sessionErr) throw sessionErr;
        }

        setUser((prev: any) => ({
          ...prev,
          studyStreak: newStreak,
          lastStudyDate: newDate,
          cardsMastered: newCardsMastered,
          quizAttempts: updatedAttempts,
          recentSessions: updatedSessions
        }));
        setSaveStatus("Activity synchronized with Supabase database tables!");
      }
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err) {
      console.error("Failed to sync metrics:", err);
    }
  };

  // Adjust input count bounds dynamically when Format changes
  useEffect(() => {
    if (format === "Flashcards") setItemCount(10);
    else if (format === "Quiz") setItemCount(10);
    else if (format === "Test") setItemCount(5);
    else if (format === "Exam") setItemCount(20);
  }, [format]);

  // Live Timer Countdown handler for time-based Tests
  const startTimer = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSecondsRemaining(seconds);
    
    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Trigger automatic submission on time exhaustion
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // AI Active recall assessment generation triggers
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setActiveFlashcardDeck(null);
    setActiveExam(null);
    setIsFlipped(false);
    setActiveCardIndex(0);
    setMasteredCardsMap({});
    setExamSubmitted(false);

    try {
      if (format === "Flashcards") {
        const res = await fetch("/api/generate-flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, count: itemCount }),
        });
        
        const data = await res.json();
        if (data.flashcards && data.flashcards.length > 0) {
          // Open dynamic flashcards immersive page modal
          setActiveFlashcardDeck({
            topic: topic,
            cards: data.flashcards
          });
          setActiveCardIndex(0);
          setIsFlipped(false);
          setMasteredCardsMap({});
          await saveAssessmentMetrics(undefined, data.flashcards.length);
        }
      } else {
        // Fetch Quiz/Test/Exam matching count parameters
        const res = await fetch("/api/generate-exam", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, type: format, count: itemCount }),
        });

        const data = await res.json();
        if (data.exam) {
          setActiveExam(data.exam);
          
          // Pre-populate empty buffers
          setExamSelections(new Array(data.exam.questions.length).fill(-1));
          setTheoryAnswers(new Array(data.exam.questions.length).fill(""));
          setSelfGradingScore(new Array(data.exam.questions.length).fill(false));
          setExamSubmitted(false);
          setExamScore(0);

          // If Test format, trigger live count-down timer (2 minutes per short-answer question)
          if (format === "Test") {
            startTimer(itemCount * 120); // E.g., 5 questions * 120 seconds = 10 minutes
          } else {
            if (timerRef.current) clearInterval(timerRef.current);
          }
        }
      }
    } catch (error) {
      console.error("Recall generation failed:", error);
      alert("Failed to generate dynamic assessment. Check your MTG/Glo networks or API configuration and retry.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto submit when countdown reaches zero
  const handleAutoSubmit = () => {
    alert("Time has run out! Auto-submitting your written test paper.");
    submitWrittenAssessment();
  };

  // Submit and grade objectives + short-written answers
  const submitWrittenAssessment = async () => {
    if (!activeExam) return;
    if (timerRef.current) clearInterval(timerRef.current);

    let objectiveScore = 0;
    let totalScoreable = activeExam.questions.length;

    // First, grade all objective/multiple choice questions
    activeExam.questions.forEach((q, idx) => {
      if (q.type === "objective" && examSelections[idx] === q.answer) {
        objectiveScore += 1;
      }
    });

    // For theory, check if they typed an answer. Let's auto-score 1 point for any answer containing 
    // more than 4 words, then open active self-grading options so they can compare and adjust live!
    let initialTheoryScore = 0;
    const initialSelfGrading = [...selfGradingScore];
    activeExam.questions.forEach((q, idx) => {
      if (q.type === "theory") {
        const words = theoryAnswers[idx].trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length > 4) {
          initialTheoryScore += 1;
          initialSelfGrading[idx] = true; // Set self grading default
        }
      }
    });

    const finalScore = objectiveScore + initialTheoryScore;
    setExamScore(finalScore);
    setSelfGradingScore(initialSelfGrading);
    setExamSubmitted(true);

    const percent = Math.round((finalScore / totalScoreable) * 100);
    const grade = percent >= 75 ? "A" : percent >= 60 ? "B" : percent >= 45 ? "C" : "F";

    const attempt = {
      title: activeExam.title,
      type: format,
      score: finalScore,
      total: totalScoreable,
      percentage: percent,
      grade,
      date: new Date().toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    };

    await saveAssessmentMetrics(attempt, 0);
  };

  // Live adjustments when students check/uncheck self-grading boxes for written theory answers
  const toggleSelfGrade = (idx: number, isCorrect: boolean) => {
    if (!examSubmitted || !activeExam) return;
    
    setSelfGradingScore((prev) => {
      const updated = [...prev];
      updated[idx] = isCorrect;
      
      // Calculate new score sum
      let score = 0;
      activeExam.questions.forEach((q, qIdx) => {
        if (q.type === "objective") {
          if (examSelections[qIdx] === q.answer) score += 1;
        } else {
          if (updated[qIdx]) score += 1;
        }
      });
      setExamScore(score);
      return updated;
    });
  };

  const handleOptionSelect = (qIdx: number, optIdx: number) => {
    if (examSubmitted) return;
    setExamSelections((prev) => {
      const updated = [...prev];
      updated[qIdx] = optIdx;
      return updated;
    });
  };

  const closeExam = () => {
    setActiveExam(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Flashcards navigation triggers inside dedicated full-screen page
  const prevCard = () => {
    if (!activeFlashcardDeck) return;
    setIsFlipped(false);
    setTimeout(() => {
      setActiveCardIndex((prev) => (prev - 1 + activeFlashcardDeck.cards.length) % activeFlashcardDeck.cards.length);
    }, 150);
  };

  const nextCard = () => {
    if (!activeFlashcardDeck) return;
    setIsFlipped(false);
    setTimeout(() => {
      setActiveCardIndex((prev) => (prev + 1) % activeFlashcardDeck.cards.length);
    }, 150);
  };

  const toggleMasterCard = (idx: number) => {
    setMasteredCardsMap((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Submit complete Flashcard deck review
  const submitFlashcardsDeckReview = async () => {
    if (!activeFlashcardDeck) return;
    
    const totalCount = activeFlashcardDeck.cards.length;
    const masteredCount = Object.values(masteredCardsMap).filter(Boolean).length;
    const percent = Math.round((masteredCount / totalCount) * 100);
    const grade = percent >= 75 ? "A" : percent >= 50 ? "B" : "C";

    const attempt = {
      title: `Deck Review: ${activeFlashcardDeck.topic}`,
      type: "Flashcards",
      score: masteredCount,
      total: totalCount,
      percentage: percent,
      grade,
      date: new Date().toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    };

    await saveAssessmentMetrics(attempt, masteredCount);
    setActiveFlashcardDeck(null);
  };

  // Timer format display helper
  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      
      {/* Global CSS style injects to support custom immersive 3D flipping transitions conflict-free */}
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Dynamic Title Headers */}
      {!activeExam && !activeFlashcardDeck && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Assessments & Dynamic Testing</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Practice customized flashcards, time-based written tests, or mixed final exam formats.</p>
          </div>

          {/* Dynamic sub-tab switcher */}
          <div className="flex bg-foreground/5 p-1 rounded-xl border border-border/40">
            <button 
              onClick={() => setActiveSubTab("builder")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === "builder" 
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles size={13} /> Assessment Builder
            </button>
            <button 
              onClick={() => setActiveSubTab("history")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === "history" 
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History size={13} /> Live History Log
            </button>
          </div>
        </div>
      )}

      {saveStatus && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-300 shadow-md shadow-emerald-500/5">
          <CheckCircle2 size={16} />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* A. Live Immersive Dedicated Flashcard study Page Modal */}
      {activeFlashcardDeck && (
        <div className="glass p-6 md:p-8 rounded-3xl border border-orange-500/30 bg-orange-500/5 space-y-6 relative overflow-hidden animate-in slide-in-from-top-4 duration-300 max-w-2xl mx-auto">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center pb-4 border-b border-border/20">
            <div className="flex items-center gap-3">
              <Flame className="text-orange-400 animate-pulse fill-orange-400" size={24} />
              <div>
                <h2 className="text-base md:text-lg font-black tracking-tight text-foreground">Active Recall: {activeFlashcardDeck.topic}</h2>
                <span className="text-[9px] uppercase font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded mt-1 inline-block">
                  Flashcard deck
                </span>
              </div>
            </div>

            <button 
              onClick={() => setActiveFlashcardDeck(null)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-foreground/5 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Smooth linear progress slider representing complete reviewed cards */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
              <span>Progress Bar</span>
              <span>Card {activeCardIndex + 1} of {activeFlashcardDeck.cards.length} ({Math.round(((activeCardIndex + 1) / activeFlashcardDeck.cards.length) * 100)}%)</span>
            </div>
            <div className="w-full bg-foreground/10 h-1.5 rounded-full overflow-hidden">
              <div 
                style={{ width: `${((activeCardIndex + 1) / activeFlashcardDeck.cards.length) * 100}%` }} 
                className="bg-orange-500 h-full rounded-full transition-all duration-300 shadow shadow-orange-500/20" 
              />
            </div>
          </div>

          {/* centered conflict-free responsive 3D Flip Card Container */}
          <div className="flex flex-col items-center justify-center py-4">
            <div 
              className="w-full max-w-md aspect-[1.5] perspective-1000 cursor-pointer select-none relative group"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={`w-full h-full relative preserve-3d transition-transform duration-700 ease-in-out ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* Side A: Question (Front side) */}
                <div className="absolute inset-0 backface-hidden bg-background border-2 border-primary/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-2xl overflow-y-auto scrollbar-hide">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-40 pointer-events-none" />
                  <span className="absolute top-4 left-4 text-[8px] font-black uppercase tracking-widest text-primary/60 border border-primary/20 px-2 py-0.5 rounded-full">Question / Term</span>
                  
                  <div className="my-auto py-2">
                    <p className="text-base md:text-lg font-black leading-relaxed text-foreground max-w-sm">
                      {activeFlashcardDeck.cards[activeCardIndex].front}
                    </p>
                  </div>
                  
                  <p className="absolute bottom-4 text-[9px] text-muted-foreground font-extrabold animate-pulse uppercase tracking-wider">Tap Card to Flip & View Correct Answer</p>
                </div>

                {/* Side B: Correct Answer (Back side) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-primary text-primary-foreground rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-2xl overflow-y-auto scrollbar-hide">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-10 pointer-events-none" />
                  <span className="absolute top-4 left-4 text-[8px] font-black uppercase tracking-widest text-primary-foreground/75 border border-primary-foreground/20 px-2 py-0.5 rounded-full">Correct Answer / Definition</span>
                  
                  <div className="my-auto py-4">
                    <p className="text-xs md:text-sm font-semibold leading-relaxed max-w-sm">
                      {activeFlashcardDeck.cards[activeCardIndex].back}
                    </p>
                  </div>

                  <p className="absolute bottom-4 text-[9px] text-primary-foreground/75 font-extrabold uppercase tracking-wider">Tap Card to Flip Back to Question</p>
                </div>

              </div>
            </div>
          </div>

          {/* Interactive controls panel */}
          <div className="pt-4 border-t border-border/20 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-2.5 w-full sm:w-auto">
              <button 
                onClick={prevCard}
                className="flex-1 sm:flex-none glass border border-border p-3 rounded-2xl hover:bg-foreground/5 transition-colors flex items-center justify-center cursor-pointer"
                title="Previous Card"
              >
                <ChevronLeft size={18} />
              </button>
              
              <button
                onClick={() => toggleMasterCard(activeCardIndex)}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  masteredCardsMap[activeCardIndex] 
                    ? "bg-green-500/20 text-green-400 border border-green-500" 
                    : "glass border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Check size={14} /> {masteredCardsMap[activeCardIndex] ? "Mastered" : "Mark Mastered"}
              </button>

              <button 
                onClick={nextCard}
                className="flex-1 sm:flex-none glass border border-border p-3 rounded-2xl hover:bg-foreground/5 transition-colors flex items-center justify-center cursor-pointer"
                title="Next Card"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <button
              onClick={submitFlashcardsDeckReview}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
            >
              Finish Deck Review
            </button>
          </div>
        </div>
      )}

      {/* B. Live Interactive Exam / Written Test Panel */}
      {activeExam && (
        <div className="glass p-6 md:p-8 rounded-3xl border border-rose-500/30 bg-rose-500/5 space-y-6 relative overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex justify-between items-center pb-4 border-b border-border/20">
            <div className="flex items-center gap-3">
              <Award className="text-rose-400 animate-pulse" size={24} />
              <div>
                <h2 className="text-base md:text-lg font-black tracking-tight text-foreground">{activeExam.title}</h2>
                <span className="text-[9px] uppercase font-bold text-muted-foreground bg-foreground/5 px-2.5 py-0.5 rounded border border-border/40 mt-1 inline-block">
                  {format} Form
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* If Test (timebased) or countdown is active */}
              {format === "Test" && !examSubmitted && (
                <div className="flex items-center gap-2 text-xs font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3.5 py-2 rounded-xl animate-pulse">
                  <Clock size={14} />
                  <span>Time Left: {formatTimeRemaining(secondsRemaining)}</span>
                </div>
              )}
              
              <button 
                onClick={closeExam}
                className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-foreground/5 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* List of Dynamic questions */}
          <div className="space-y-8">
            {activeExam.questions.map((q, qIdx) => {
              const isObjective = q.type === "objective";
              
              return (
                <div key={qIdx} className="space-y-3 p-5 bg-background/5 border border-border/40 rounded-2xl relative">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-extrabold text-sm flex gap-2">
                      <span className="text-rose-400">Q{qIdx + 1}.</span> {q.q}
                    </h4>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                      isObjective 
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {isObjective ? "Objective" : "Written/Theory"}
                    </span>
                  </div>
                  
                  {/* Option Choices rendering for Objective questions */}
                  {isObjective && q.options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = examSelections[qIdx] === optIdx;
                        let btnStyle = "glass border-border/50 text-muted-foreground hover:text-foreground hover:bg-foreground/5";
                        
                        if (examSubmitted) {
                          if (optIdx === q.answer) {
                            btnStyle = "bg-green-500/20 border-green-500 text-green-400 font-extrabold shadow-sm shadow-green-500/10";
                          } else if (isSelected) {
                            btnStyle = "bg-rose-500/20 border-rose-500 text-rose-400 font-extrabold shadow-sm shadow-rose-500/10";
                          }
                        } else if (isSelected) {
                          btnStyle = "bg-rose-500/15 border-rose-500/60 text-rose-400 font-extrabold glow-accent";
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleOptionSelect(qIdx, optIdx)}
                            className={`w-full text-left p-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${btnStyle}`}
                            disabled={examSubmitted}
                          >
                            <span className="font-bold mr-2 uppercase">{String.fromCharCode(97 + optIdx)}.</span> {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Input field rendering for Theory short-answers */}
                  {!isObjective && (
                    <div className="space-y-3 pt-2">
                      <textarea
                        value={theoryAnswers[qIdx]}
                        onChange={(e) => {
                          const updated = [...theoryAnswers];
                          updated[qIdx] = e.target.value;
                          setTheoryAnswers(updated);
                        }}
                        disabled={examSubmitted}
                        placeholder="Type your brief, written answer here..."
                        className="w-full h-24 bg-foreground/5 border border-border/80 rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-primary/50 text-foreground resize-none"
                      />

                      {examSubmitted && (
                        <div className="p-4 bg-foreground/5 rounded-xl border border-border/50 space-y-3 animate-in fade-in duration-300">
                          <div>
                            <span className="text-[9px] uppercase font-black text-rose-400">Model Sample Answer:</span>
                            <p className="text-xs font-bold text-foreground mt-1">{q.sampleAnswer}</p>
                          </div>
                          
                          {/* Self-grading button blocks */}
                          <div className="flex items-center justify-between pt-3 border-t border-border/20">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Self-Grade this Theory Question:</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleSelfGrade(qIdx, true)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  selfGradingScore[qIdx] 
                                    ? "bg-green-500/20 text-green-400 border border-green-500" 
                                    : "bg-foreground/5 text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                I got it right
                              </button>
                              <button
                                onClick={() => toggleSelfGrade(qIdx, false)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  !selfGradingScore[qIdx] 
                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500" 
                                    : "bg-foreground/5 text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                I missed it
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {examSubmitted && (
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-xs leading-relaxed text-muted-foreground animate-in fade-in duration-300">
                      <span className="text-[9px] uppercase font-black text-primary block mb-1">AI Explanation:</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Graded Review Card & Retry blocks */}
          <div className="pt-6 border-t border-border/20 flex flex-col sm:flex-row justify-between items-center gap-4">
            {!examSubmitted ? (
              <button 
                onClick={submitWrittenAssessment}
                className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-lg shadow-rose-500/20 transition-all cursor-pointer active:scale-95 animate-pulse"
              >
                Submit Written Assessment
              </button>
            ) : (
              <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-6 bg-foreground/5 p-6 rounded-3xl border border-border/50 animate-in slide-in-from-bottom-3 duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-primary/10 text-primary rounded-2xl glow-primary">
                    <Award size={36} className="animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm uppercase text-muted-foreground tracking-wider">Lesson Graded!</h3>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-black text-foreground">{examScore}</span>
                      <span className="text-xs text-muted-foreground font-semibold">/ {activeExam.questions.length} points</span>
                    </div>
                  </div>
                </div>

                {/* Score Review Grade Board */}
                <div className="flex items-center gap-6">
                  <div className="text-center bg-background px-6 py-2.5 rounded-2xl border border-border/50">
                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block">Percentage</span>
                    <span className="text-lg font-black text-primary">{Math.round((examScore / activeExam.questions.length) * 100)}%</span>
                  </div>

                  <div className="text-center bg-background px-6 py-2.5 rounded-2xl border border-border/50">
                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block">Lesson Grade</span>
                    <span className={`text-lg font-black ${
                      (examScore / activeExam.questions.length) >= 0.75 
                        ? "text-emerald-400" 
                        : (examScore / activeExam.questions.length) >= 0.5 
                          ? "text-amber-400" 
                          : "text-rose-500"
                    }`}>
                      {(examScore / activeExam.questions.length) >= 0.75 ? "A (Excellent)" : (examScore / activeExam.questions.length) >= 0.5 ? "B (Pass)" : "F (Review needed)"}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setExamSelections(new Array(activeExam.questions.length).fill(-1));
                    setTheoryAnswers(new Array(activeExam.questions.length).fill(""));
                    setExamSubmitted(false);
                    setExamScore(0);
                    if (format === "Test") {
                      startTimer(itemCount * 120);
                    }
                  }}
                  className="w-full sm:w-auto bg-foreground text-background hover:opacity-90 font-bold text-xs px-6 py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <RotateCcw size={14} /> Practice Lesson Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* C. Dynamic Assessment Builder Tab */}
      {!activeExam && !activeFlashcardDeck && activeSubTab === "builder" && (
        <div className="glass p-6 md:p-8 rounded-3xl border border-primary/20 bg-primary/5 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-[100px] pointer-events-none"></div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl glow-primary">
              <BrainCircuit className="animate-pulse" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-primary">AI Active Recall & Grade Assistant</h2>
              <p className="text-xs text-muted-foreground mt-0.5 leading-normal">Select an academic subject, customize format scopes, and build structured grading sheets instantly.</p>
            </div>
          </div>
          
          <form onSubmit={handleGenerate} className="space-y-6 pt-4 border-t border-border/20">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Syllabus Course / Topic</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g. CPU Scheduling in CSC 301, Vectors in MTH 201..." 
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-primary/50 transition-colors text-foreground text-base md:text-xs"
                disabled={isGenerating}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Format Scope</label>
                <select 
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-primary/50 transition-colors text-foreground dark:bg-zinc-900"
                  disabled={isGenerating}
                >
                  <option value="Flashcards">Active Recall Flashcards</option>
                  <option value="Quiz">Objective Quiz (Multiple Choice)</option>
                  <option value="Test">Written Test (Short Answer - Timebased!)</option>
                  <option value="Exam">Syllabus Exam (Objective + Theory Split)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex justify-between">
                  <span>Questions Count</span>
                  <span className="text-primary font-black">
                    {format === "Flashcards" && `${itemCount} Cards (5-20)`}
                    {format === "Quiz" && `${itemCount} Objectives (5-20)`}
                    {format === "Test" && `${itemCount} written questions (5-10)`}
                    {format === "Exam" && `${itemCount} mixed items (20-60)`}
                  </span>
                </label>

                {/* Range selectors custom bound based on formats */}
                {format === "Flashcards" && (
                  <input 
                    type="range" min={5} max={20} value={itemCount}
                    onChange={(e) => setItemCount(Number(e.target.value))}
                    className="w-full h-2 bg-foreground/10 accent-orange-500 rounded-lg cursor-pointer"
                  />
                )}
                {format === "Quiz" && (
                  <input 
                    type="range" min={5} max={20} value={itemCount}
                    onChange={(e) => setItemCount(Number(e.target.value))}
                    className="w-full h-2 bg-foreground/10 accent-primary rounded-lg cursor-pointer"
                  />
                )}
                {format === "Test" && (
                  <input 
                    type="range" min={5} max={10} value={itemCount}
                    onChange={(e) => setItemCount(Number(e.target.value))}
                    className="w-full h-2 bg-foreground/10 accent-primary rounded-lg cursor-pointer"
                  />
                )}
                {format === "Exam" && (
                  <input 
                    type="range" min={20} max={60} step={5} value={itemCount}
                    onChange={(e) => setItemCount(Number(e.target.value))}
                    className="w-full h-2 bg-foreground/10 accent-primary rounded-lg cursor-pointer"
                  />
                )}
              </div>
            </div>

            {/* Timetable/Format details card */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl text-[11px] leading-relaxed text-muted-foreground flex gap-2">
              <AlertTriangle size={15} className="text-primary mt-0.5 shrink-0 animate-pulse" />
              <div>
                {format === "Flashcards" && "Flashcard decks are designed for immediate active recall. Our AI compiler generates highly thorough concepts on the front, and deep detailed equations/definitions on the back."}
                {format === "Quiz" && "Quizzes consist entirely of objective multiple-choice questions. Score calculations and dynamic grading sheets open instantly upon submission."}
                {format === "Test" && `Tests consist strictly of written, short-answer theory questions. This test format is time-based: you have exactly ${formatTimeRemaining(itemCount * 120)} (${itemCount * 2} minutes total) to submit. Grading sheets feature self-grading checks and explanation keys.`}
                {format === "Exam" && `Exams represent a full length syllabus review containing exactly ${itemCount} questions. Formats are divided strictly into a 40% written theory and 60% objective choice split, providing the ultimate standard curriculum simulation.`}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={isGenerating || !topic.trim()}
                className="w-full md:w-auto bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-primary/95 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-lg shadow-primary/10"
              >
                {isGenerating ? (
                  <><Loader2 size={14} className="animate-spin" /> Generating personalized active recall guides...</>
                ) : (
                  <><BrainCircuit size={14} /> Launch Assessment</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* D. Live Recently Done History Log Tab */}
      {!activeExam && !activeFlashcardDeck && (activeSubTab === "history" || (activeSubTab === "builder")) && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500/10 text-green-400 rounded-xl">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Recently Done History Log</h2>
              <p className="text-xs text-muted-foreground mt-0.5 leading-normal">Track your dynamic live results, lesson grades, and active recall study sessions synced from Supabase.</p>
            </div>
          </div>

          {loadingUser ? (
            <div className="text-center py-12 text-sm text-muted-foreground font-semibold">
              <Loader2 className="animate-spin inline-block mr-2" size={16} /> Loading study history log...
            </div>
          ) : user && user.quizAttempts && user.quizAttempts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.quizAttempts.map((attempt: any, idx: number) => (
                <div key={idx} className="glass p-5 rounded-3xl border border-border/80 flex items-center justify-between hover:border-primary/20 transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[50px] -z-10" />
                  
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                      {attempt.type === "Quiz" && <BookOpenCheck size={20} />}
                      {attempt.type === "Test" && <Clock size={20} />}
                      {attempt.type === "Exam" && <Award size={20} />}
                      {attempt.type === "Flashcards" && <Flame size={20} />}
                      {!attempt.type && <BookCopy size={20} />}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-foreground">{attempt.title}</h4>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground font-semibold">
                        <span className="bg-foreground/5 px-2 py-0.5 rounded border border-border/40 uppercase">{attempt.type || "Lesson"}</span>
                        <span>•</span>
                        <span>{attempt.date || "Just now"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-primary text-base">{attempt.score}/{attempt.total}</div>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${
                      attempt.grade === "A" 
                        ? "text-emerald-400" 
                        : attempt.grade === "B" 
                          ? "text-amber-400" 
                          : "text-rose-400"
                    }`}>
                      {attempt.grade} Grade ({attempt.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass p-8 rounded-3xl border border-border text-center space-y-3">
              <Calendar className="mx-auto text-muted-foreground/40" size={32} />
              <h3 className="font-bold text-sm text-foreground">No recent attempts logged yet</h3>
              <p className="text-xs text-muted-foreground leading-normal max-w-sm mx-auto">Launch an assessment from the builder to generate custom exams, tests, or flashcard decks and begin synchronizing your academic milestones.</p>
              <button 
                onClick={() => setActiveSubTab("builder")}
                className="mt-2 bg-primary text-primary-foreground font-bold text-xs px-4 py-2 rounded-xl hover:opacity-95 transition-all cursor-pointer"
              >
                Go to Builder
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
