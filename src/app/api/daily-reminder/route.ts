import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, gpa, targetGpa, gpaScale, studyStreak, cardsMastered, upcomingEvents } = body;

    const scale = gpaScale || "5.0";
    const studentName = name || "Student";
    const studentEmail = email || "student@university.edu.ng";
    const currentGpa = gpa || (scale === "4.0" ? "3.20" : "4.20");
    const targetGpaValue = targetGpa || (scale === "4.0" ? "3.50" : "4.50");
    const streak = studyStreak !== undefined ? studyStreak : 5;
    const cards = cardsMastered !== undefined ? cardsMastered : 128;
    const events = upcomingEvents && upcomingEvents.length > 0 ? upcomingEvents : [
      { title: "MTH 201 Midterm Revision", type: "Reading Session", time: "Tomorrow at 10:00 AM" },
      { title: "CSC 301 Semester Exams", type: "Exam", time: "In 3 days" }
    ];

    // Gorgeous glassmorphic visual HTML email template tailored for modern transactional mailers
    const htmlEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your PassAm Daily Progress Report</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0b0f19;
      padding: 30px 10px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(17, 24, 39, 0.7);
      border: 1px solid rgba(99, 102, 241, 0.15);
      border-radius: 24px;
      padding: 40px 30px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      background-image: radial-gradient(circle at top right, rgba(99, 102, 241, 0.08), transparent 250px);
    }
    .header {
      text-align: center;
      margin-bottom: 35px;
    }
    .logo {
      font-size: 32px;
      font-weight: 900;
      letter-spacing: -1px;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      color: #6366f1;
      margin: 0;
      display: inline-block;
    }
    .tagline {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #94a3b8;
      margin-top: 6px;
      font-weight: 700;
    }
    .welcome-text {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 8px;
    }
    .intro-paragraph {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.6;
      margin-top: 0;
      margin-bottom: 25px;
    }
    .streak-badge-card {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12 0.05) 100%);
      border: 1px solid rgba(249, 115, 22, 0.25);
      border-radius: 20px;
      padding: 20px;
      text-align: center;
      margin-bottom: 25px;
    }
    .streak-number {
      font-size: 44px;
      font-weight: 900;
      color: #f97316;
      line-height: 1;
      margin: 0;
    }
    .streak-label {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #f97316;
      margin-top: 4px;
      margin-bottom: 0;
    }
    .streak-message {
      font-size: 13px;
      color: #fbd5c0;
      margin-top: 8px;
      margin-bottom: 0;
      font-weight: 500;
    }
    .metrics-grid {
      display: table;
      width: 100%;
      table-layout: fixed;
      border-collapse: separate;
      border-spacing: 12px 0;
      margin: 0 -12px 25px -12px;
    }
    .metric-col {
      display: table-cell;
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      vertical-align: top;
    }
    .metric-val {
      font-size: 26px;
      font-weight: 900;
      color: #ffffff;
      margin: 0;
    }
    .metric-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      margin-top: 4px;
      margin-bottom: 0;
    }
    .progress-bar-container {
      background: rgba(255, 255, 255, 0.08);
      height: 6px;
      border-radius: 3px;
      margin-top: 10px;
      overflow: hidden;
    }
    .progress-bar-fill {
      background: linear-gradient(90deg, #6366f1, #a855f7);
      height: 100%;
      border-radius: 3px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #6366f1;
      margin-top: 30px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-b: 1px solid rgba(255, 255, 255, 0.05);
    }
    .timetable-list {
      margin: 0 0 30px 0;
      padding: 0;
      list-style: none;
    }
    .timetable-item {
      background: rgba(30, 41, 59, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 10px;
    }
    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .event-title {
      font-size: 13px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
    }
    .event-type {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }
    .event-time {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 6px;
      margin-bottom: 0;
      font-weight: 500;
    }
    .study-tip-card {
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%);
      border: 1px solid rgba(168, 85, 247, 0.2);
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 30px;
    }
    .tip-title {
      font-size: 13px;
      font-weight: 800;
      color: #c084fc;
      margin-top: 0;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .tip-text {
      font-size: 12px;
      color: #cbd5e1;
      line-height: 1.5;
      margin: 0;
      font-weight: 500;
    }
    .footer {
      text-align: center;
      border-t: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 25px;
      margin-top: 20px;
    }
    .footer-links {
      margin-bottom: 12px;
    }
    .footer-link {
      font-size: 11px;
      color: #6366f1;
      text-decoration: none;
      font-weight: 700;
      margin: 0 10px;
    }
    .footer-text {
      font-size: 10px;
      color: #64748b;
      margin: 0 0 4px 0;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Logo Header -->
      <div class="header">
        <h1 class="logo">PassAm</h1>
        <div class="tagline">Offline-First AI Tutor</div>
      </div>

      <!-- Welcome introduction -->
      <h2 class="welcome-text">Keep the momentum going, ${studentName}!</h2>
      <p class="intro-paragraph">
        Here is your daily revision reminder and study progress digest. Reviewing active recall cards for just 10 minutes today keeps your academic milestones on target and secures your goals.
      </p>

      <!-- 1. Streak Tracker -->
      <div class="streak-badge-card">
        <h3 class="streak-number">🔥 ${streak} Days</h3>
        <p class="streak-label">Active Study Streak</p>
        <p class="streak-message">
          ${streak > 0 ? "You're doing fantastic! Don't let your fire go cold today." : "Start learning today to launch your daily study streak!"}
        </p>
      </div>

      <!-- 2. Progress Cards -->
      <div class="metrics-grid">
        <!-- GPA Progress -->
        <div class="metric-col">
          <p class="metric-val">${currentGpa}</p>
          <p class="metric-label">Current GPA</p>
          <div class="progress-bar-container" title="Target: ${targetGpaValue}">
            <div class="progress-bar-fill" style="width: ${Math.min((Number(currentGpa) / Number(scale)) * 100, 100)}%;"></div>
          </div>
          <p style="font-size: 9px; color: #94a3b8; margin: 6px 0 0 0; font-weight: 600;">Target: ${targetGpaValue} / ${Number(scale).toFixed(2)}</p>
        </div>

        <!-- Mastered Cards count -->
        <div class="metric-col">
          <p class="metric-val">${cards}</p>
          <p class="metric-label">Cards Mastered</p>
          <div class="progress-bar-container" style="background: rgba(16, 185, 129, 0.15);">
            <div class="progress-bar-fill" style="background: #10b981; width: ${Math.min((cards / 250) * 100, 100)}%;"></div>
          </div>
          <p style="font-size: 9px; color: #94a3b8; margin: 6px 0 0 0; font-weight: 600;">Level Limit: 250</p>
        </div>
      </div>

      <!-- 3. Upcoming events -->
      <h4 class="section-title">📅 Academic Schedule</h4>
      <div class="timetable-list">
        ${events.slice(0, 3).map((ev: any) => `
          <div class="timetable-item">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h5 class="event-title" style="margin: 0; font-size: 13px;">${ev.title}</h5>
              <span class="event-type" style="font-size: 9px; font-weight: 800; text-transform: uppercase; background: rgba(99, 102, 241, 0.15); color: #818cf8; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(99, 102, 241, 0.2);">${ev.type || "Reading"}</span>
            </div>
            <p class="event-time" style="font-size: 11px; color: #94a3b8; margin-top: 6px; margin-bottom: 0;">${ev.time}</p>
          </div>
        `).join("")}
      </div>

      <!-- 4. Tailored AI study advice -->
      <div class="study-tip-card">
        <h4 class="tip-title">💡 Active Recall Study Tip</h4>
        <p class="tip-text">
          Instead of just re-reading lecture slides, test your memory. Launch an AI assessment quiz in PassAm or review your dynamic flashcard deck. Active recall creates stronger neural pathways, helping you retain up to 150% more facts during exams!
        </p>
      </div>

      <!-- Footer action -->
      <div class="footer">
        <div class="footer-links">
          <a href="https://passam.app/dashboard" class="footer-link">Enter Student Portal</a>
          <a href="https://passam.app/profile" class="footer-link">Alert Settings</a>
        </div>
        <p class="footer-text">This is a simulated transactional progress email prepared for you by PassAm AI.</p>
        <p class="footer-text">© 2026 PassAm Student Systems. Safe, secure, and offline-first.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    return NextResponse.json({
      success: true,
      message: `Simulated daily reminder email generated successfully for ${studentEmail}`,
      recipient: studentEmail,
      subject: `🔥 Keep your study streak alive, ${studentName}! Daily PassAm Progress Digest`,
      html: htmlEmailTemplate,
    });
  } catch (error) {
    console.error("Daily reminder API Error:", error);
    return NextResponse.json({ error: "Failed to generate reminder report" }, { status: 500 });
  }
}
