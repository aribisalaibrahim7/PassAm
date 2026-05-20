export function getLocalDateString(date: Date = new Date()): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
}

export function calculateStreakUpdate(currentStreak: number, lastStudyDateStr?: string): {
  streak: number;
  lastStudyDate: string;
  shouldUpdate: boolean;
} {
  const todayStr = getLocalDateString(new Date());

  if (!lastStudyDateStr) {
    // First time studying
    return {
      streak: currentStreak > 0 ? currentStreak : 1,
      lastStudyDate: todayStr,
      shouldUpdate: true,
    };
  }

  if (lastStudyDateStr === todayStr) {
    // Already studied today, keep streak the same
    return {
      streak: currentStreak,
      lastStudyDate: todayStr,
      shouldUpdate: false,
    };
  }

  // Get yesterday's local date string
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  if (lastStudyDateStr === yesterdayStr) {
    // Studied yesterday, increment streak!
    return {
      streak: currentStreak + 1,
      lastStudyDate: todayStr,
      shouldUpdate: true,
    };
  } else {
    // Missed at least one day, reset streak to 1
    return {
      streak: 1,
      lastStudyDate: todayStr,
      shouldUpdate: true,
    };
  }
}
