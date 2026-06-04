import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored from Server Components
          }
        },
      },
    }
  );
}

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return {
        email: user.email || "student@university.edu.ng",
        name: user.user_metadata?.name || user.email?.split("@")[0] || "Student",
        university: user.user_metadata?.university || "Nigerian University",
        targetGpa: user.user_metadata?.target_gpa || "4.50",
        currentGpa: user.user_metadata?.current_gpa || "4.20",
        gpaScale: user.user_metadata?.gpa_scale || "5.0",
        hasTakenSurvey: user.user_metadata?.has_taken_survey || false,
        surveyProfile: user.user_metadata?.survey_profile || null,
        
        // Live student tracker metrics
        studyStreak: user.user_metadata?.study_streak ?? 5,
        lastStudyDate: user.user_metadata?.last_study_date || "",
        cardsMastered: user.user_metadata?.cards_mastered ?? 128,
        recentSessions: [], // Loaded client-side from dedicated tables
        quizAttempts: [], // Loaded client-side from dedicated tables
        upcomingEvents: [], // Loaded client-side from dedicated tables
        
        isDemo: false,
      };
    }
  } catch (err) {
    console.error("Supabase user fetch failed, checking demo cookie...", err);
  }

  const cookieStore = await cookies();
  const isDemo = cookieStore.get("passam_demo_session")?.value === "true";
  if (isDemo) {
    const surveyCookie = cookieStore.get("passam_demo_survey")?.value;
    const hasTakenSurvey = !!surveyCookie;
    let surveyProfile = null;
    if (surveyCookie) {
      try {
        surveyProfile = JSON.parse(decodeURIComponent(surveyCookie));
      } catch {
        // Ignored
      }
    }

    // Check if user has saved a custom demo profile in cookies
    // Cookie is split into two to prevent HTTP 431 (header too large) errors:
    //   passam_demo_profile  → scalar fields only (name, gpa, streak, etc.)
    //   passam_demo_arrays   → capped arrays (recentSessions, quizAttempts, upcomingEvents)
    const profileCookie = cookieStore.get("passam_demo_profile")?.value;
    const arraysCookie  = cookieStore.get("passam_demo_arrays")?.value;

    let customName = "Adebayo Collins";
    let customUni = "University of Lagos (UNILAG)";
    let customGpa = "4.20";
    let targetGpa = "4.50";
    let gpaScale = "5.0";
    let studyStreak = 5;
    let lastStudyDate = "";
    let cardsMastered = 128;
    let recentSessions = [
      { id: "1", course: "MTH", title: "MTH 201: Linear Algebra", detail: "Reviewed Vectors and Matrices", time: "2 hrs ago" },
      { id: "2", course: "CSC", title: "CSC 301: Systems Programming", detail: "Transcribed CPU Schedules lecture", time: "Yesterday" },
      { id: "3", course: "PHY", title: "PHY 202: Modern Physics", detail: "Practiced Quantum Mechanics flashcards", time: "3 days ago" }
    ];
    let quizAttempts: any[] = [];
    let upcomingEvents = [
      { id: "e1", title: "CSC 301 Midterm Prep", type: "Test", time: "2026-05-22T10:00", duration: 45 },
      { id: "e2", title: "MTH 201 Final Revision", type: "Exam", time: "2026-05-25T14:00", duration: 120 }
    ];

    if (profileCookie) {
      try {
        const p = JSON.parse(decodeURIComponent(profileCookie));
        if (p.name) customName = p.name;
        if (p.university) customUni = p.university;
        if (p.targetGpa) targetGpa = p.targetGpa;
        if (p.currentGpa) customGpa = p.currentGpa;
        if (p.gpaScale) gpaScale = p.gpaScale;
        if (p.studyStreak !== undefined) studyStreak = p.studyStreak;
        if (p.lastStudyDate !== undefined) lastStudyDate = p.lastStudyDate;
        if (p.cardsMastered !== undefined) cardsMastered = p.cardsMastered;
      } catch {
        // Ignored
      }
    }

    if (arraysCookie) {
      try {
        const a = JSON.parse(decodeURIComponent(arraysCookie));
        if (a.recentSessions?.length) recentSessions = a.recentSessions;
        if (a.quizAttempts?.length)   quizAttempts   = a.quizAttempts;
        if (a.upcomingEvents?.length)  upcomingEvents  = a.upcomingEvents;
      } catch {
        // Ignored
      }
    }

    return {
      email: "demo.student@unilag.edu.ng",
      name: customName,
      university: customUni,
      targetGpa: targetGpa,
      currentGpa: customGpa,
      gpaScale: gpaScale,
      hasTakenSurvey,
      surveyProfile,
      
      // Live student tracker metrics fallbacks
      studyStreak,
      lastStudyDate,
      cardsMastered,
      recentSessions,
      quizAttempts,
      upcomingEvents,
      
      isDemo: true,
    };
  }

  return null;
}

