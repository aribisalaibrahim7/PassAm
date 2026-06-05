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
        email: user.email || "",
        name: user.user_metadata?.name || user.email?.split("@")[0] || "Student",
        university: user.user_metadata?.university || "",
        targetGpa: user.user_metadata?.target_gpa || "0.00",
        currentGpa: user.user_metadata?.current_gpa || "0.00",
        gpaScale: user.user_metadata?.gpa_scale || "5.0",
        hasTakenSurvey: user.user_metadata?.has_taken_survey || false,
        surveyProfile: user.user_metadata?.survey_profile || null,
        
        // Live student tracker metrics
        studyStreak: user.user_metadata?.study_streak ?? 0,
        lastStudyDate: user.user_metadata?.last_study_date || "",
        cardsMastered: user.user_metadata?.cards_mastered ?? 0,
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
    // Survey flag — full surveyProfile loads from localStorage client-side
    const hasTakenSurvey = !!cookieStore.get("passam_demo_survey")?.value;

    // Profile cookie uses abbreviated keys to stay under 200 B:
    //   n=name, u=university, tg=targetGpa, cg=currentGpa, gs=gpaScale
    // Also supports legacy full-key format for backward compat.
    const profileCookie = cookieStore.get("passam_demo_profile")?.value;

    let customName  = "Demo Student";
    let customUni   = "";
    let customGpa   = "0.00";
    let targetGpa   = "0.00";
    let gpaScale    = "5.0";

    if (profileCookie) {
      try {
        const p = JSON.parse(decodeURIComponent(profileCookie));
        // Abbreviated keys first, fall back to legacy full keys
        if (p.n  || p.name)        customName = p.n  || p.name;
        if (p.u  || p.university)  customUni  = p.u  || p.university;
        if (p.tg || p.targetGpa)   targetGpa  = p.tg || p.targetGpa;
        if (p.cg || p.currentGpa)  customGpa  = p.cg || p.currentGpa;
        if (p.gs || p.gpaScale)    gpaScale   = p.gs || p.gpaScale;
      } catch {
        // Ignored — defaults remain
      }
    }

    // Runtime metrics (studyStreak, cardsMastered, etc.) and arrays
    // (recentSessions, quizAttempts, upcomingEvents) are loaded
    // client-side from localStorage / Supabase tables — NOT from cookies.
    return {
      email:          "demo.student@unilag.edu.ng",
      name:           customName,
      university:     customUni,
      targetGpa,
      currentGpa:     customGpa,
      gpaScale,
      hasTakenSurvey,
      surveyProfile:  null,   // Loaded client-side from localStorage
      studyStreak:    0,
      lastStudyDate:  "",
      cardsMastered:  0,
      recentSessions: [],
      quizAttempts:   [],
      upcomingEvents: [],
      isDemo: true,
    };
  }

  return null;
}

