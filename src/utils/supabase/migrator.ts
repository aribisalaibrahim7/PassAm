import { SupabaseClient, User } from "@supabase/supabase-js";

export async function migrateLegacyMetadata(user: User, supabase: SupabaseClient) {
  const meta = user.user_metadata;
  if (!meta) return;

  const legacyQuizAttempts = meta.quiz_attempts;
  const legacyRecentSessions = meta.recent_sessions;
  const legacyUpcomingEvents = meta.upcoming_events;
  const legacyChatSessions = meta.chat_sessions;

  const needsMigration = 
    Array.isArray(legacyQuizAttempts) || 
    Array.isArray(legacyRecentSessions) || 
    Array.isArray(legacyUpcomingEvents) || 
    Array.isArray(legacyChatSessions);

  if (!needsMigration) return;

  console.log("Legacy user metadata detected. Running database migration...");

  try {
    // 1. Migrate Quiz Attempts
    if (Array.isArray(legacyQuizAttempts) && legacyQuizAttempts.length > 0) {
      const attemptsToInsert = legacyQuizAttempts.map((item: any) => ({
        user_id: user.id,
        course: item.course || "General",
        title: item.title || "Quiz",
        grade: item.grade || "N/A",
        score: typeof item.score === "number" ? item.score : 0,
        total: typeof item.total === "number" ? item.total : 0,
        time: item.time ? new Date(item.time).toISOString() : new Date().toISOString(),
      }));

      const { error } = await supabase.from("quiz_attempts").insert(attemptsToInsert);
      if (error) console.error("Error migrating quiz attempts:", error);
    }

    // 2. Migrate Recent Sessions
    if (Array.isArray(legacyRecentSessions) && legacyRecentSessions.length > 0) {
      const sessionsToInsert = legacyRecentSessions.map((item: any) => ({
        id: item.id || `session-${Date.now()}-${Math.random()}`,
        user_id: user.id,
        course: item.course || "General",
        title: item.title || "Study Session",
        detail: item.detail || "",
        time: item.time || "Just now",
      }));

      const { error } = await supabase.from("recent_sessions").insert(sessionsToInsert);
      if (error) console.error("Error migrating recent sessions:", error);
    }

    // 3. Migrate Upcoming Events
    if (Array.isArray(legacyUpcomingEvents) && legacyUpcomingEvents.length > 0) {
      const eventsToInsert = legacyUpcomingEvents.map((item: any) => ({
        id: item.id || `event-${Date.now()}-${Math.random()}`,
        user_id: user.id,
        title: item.title || "Event",
        type: item.type || "Reading Session",
        time: item.time ? new Date(item.time).toISOString() : new Date().toISOString(),
        duration: typeof item.duration === "number" ? item.duration : 60,
      }));

      const { error } = await supabase.from("upcoming_events").insert(eventsToInsert);
      if (error) console.error("Error migrating upcoming events:", error);
    }

    // 4. Migrate Chat Sessions
    if (Array.isArray(legacyChatSessions) && legacyChatSessions.length > 0) {
      const chatsToInsert = legacyChatSessions.map((item: any) => ({
        id: item.id || `chat-${Date.now()}-${Math.random()}`,
        user_id: user.id,
        title: item.title || "Chat History",
        messages: Array.isArray(item.messages) ? item.messages : [],
      }));

      const { error } = await supabase.from("chat_sessions").insert(chatsToInsert);
      if (error) console.error("Error migrating chat sessions:", error);
    }

    // 5. Clean up auth metadata to shrink JWT/cookies
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        quiz_attempts: null,
        recent_sessions: null,
        upcoming_events: null,
        chat_sessions: null,
      },
    });

    if (updateError) {
      console.error("Failed to clean up legacy user metadata fields:", updateError);
    } else {
      console.log("Successfully migrated metadata to database and cleaned up JWT tokens!");
    }
  } catch (err) {
    console.error("Metadata migration process failed:", err);
  }
}
