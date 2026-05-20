"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { BookOpen, Calendar, Target, TrendingUp, Clock, ArrowRight, GraduationCap, Sparkles, AlertCircle, BrainCircuit, CalendarPlus, Check, X, Download, Flame, MessageSquare } from "lucide-react";
import Link from "next/link";
import { calculateStreakUpdate } from "@/utils/streak";

interface DashboardClientProps {
  user: {
    email: string;
    name: string;
    university: string;
    targetGpa: string;
    currentGpa: string;
    gpaScale: string;
    hasTakenSurvey: boolean;
    surveyProfile: any;
    studyStreak: number;
    lastStudyDate?: string;
    cardsMastered: number;
    recentSessions: any[];
    quizAttempts: any[];
    upcomingEvents: any[];
    isDemo: boolean;
  };
}

export function DashboardClient({ user }: DashboardClientProps) {
  const supabase = createClient();
  
  // Live states synced from initial user
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>(user.upcomingEvents);
  const [currentGpa, setCurrentGpa] = useState(user.currentGpa);
  const [targetGpa, setTargetGpa] = useState(user.targetGpa);
  const [studyStreak, setStudyStreak] = useState(user.studyStreak);
  const [recentSessions, setRecentSessions] = useState<any[]>(user.recentSessions);

  // Form States for Scheduling
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState<"Test" | "Exam" | "Reading Session">("Reading Session");
  const [eventTime, setEventTime] = useState("");
  const [eventDuration, setEventDuration] = useState("60");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Push Notifications and Progress Report States
  const [notificationPermission, setNotificationPermission] = useState<string>("default");
  const [emailHtml, setEmailHtml] = useState<string>("");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  
  // APK Sideload & PWA State
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [apkActiveTab, setApkActiveTab] = useState<"apk" | "pwa">("apk");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleRequestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === "granted") {
        new Notification("Notifications Enabled! 🔔", {
          body: "PassAm will now alert you about upcoming reading sessions, midterms, and daily consistency challenges.",
        });
      }
    } catch (err) {
      console.error("Failed to request notification permission:", err);
    }
  };

  const triggerBrowserNotification = () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("🔥 Streak Maintained!", {
        body: `Keep it up, ${user.name}! Your current study streak is at ${studyStreak} days. Check your inbox for the daily report!`,
      });
    }
  };

  const handleSendProgressEmail = async () => {
    setIsLoadingEmail(true);
    try {
      const res = await fetch("/api/daily-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          gpa: currentGpa,
          targetGpa: targetGpa,
          gpaScale: user.gpaScale || "5.0",
          studyStreak: studyStreak,
          cardsMastered: user.cardsMastered,
          upcomingEvents: upcomingEvents,
        }),
      });
      const data = await res.json();
      if (data.html) {
        setEmailHtml(data.html);
        setIsEmailModalOpen(true);
        triggerBrowserNotification();
      } else {
        alert("Failed to compile progress report.");
      }
    } catch (err) {
      console.error("Error triggering progress email:", err);
      alert("Could not load progress email simulation.");
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleDownloadApk = () => {
    // Start downloading the file
    const link = document.createElement("a");
    link.href = "/downloads/passam-v1.0.apk";
    link.download = "passam-v1.0.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Open the detailed instructions modal
    setIsApkModalOpen(true);
  };

  // Auto-check and update calendar-day study streak on dashboard mount
  useEffect(() => {
    async function checkDailyStreak() {
      const { streak: updatedStreak, lastStudyDate: updatedDate, shouldUpdate } = calculateStreakUpdate(
        user.studyStreak,
        user.lastStudyDate
      );

      if (shouldUpdate) {
        setStudyStreak(updatedStreak);
        
        try {
          if (user.isDemo) {
            // Read existing demo profile
            const profileStr = localStorage.getItem("passam_demo_profile");
            const existingProfile = profileStr ? JSON.parse(profileStr) : {};
            const slimProfile = {
              ...existingProfile,
              studyStreak: updatedStreak,
              lastStudyDate: updatedDate,
            };
            localStorage.setItem("passam_demo_profile", JSON.stringify(slimProfile));
            
            const date = new Date();
            date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000);
            document.cookie = `passam_demo_profile=${encodeURIComponent(JSON.stringify(slimProfile))}; path=/; expires=${date.toUTCString()};`;
          } else {
            // Save to real Supabase
            const { error } = await supabase.auth.updateUser({
              data: {
                study_streak: updatedStreak,
                last_study_date: updatedDate,
              }
            });
            if (error) throw error;
          }
        } catch (err) {
          console.error("Failed to update daily usage streak:", err);
        }
      }
    }

    checkDailyStreak();
  }, []);

  // Quick Scheduler Handlers
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventTime) return;

    setIsSaving(true);
    setSuccessMsg(null);

    const newEvent = {
      id: "ev-" + Date.now(),
      title: eventTitle,
      type: eventType,
      time: eventTime,
      duration: parseInt(eventDuration) || 60,
    };

    const updatedEvents = [...upcomingEvents, newEvent];

    try {
      if (user.isDemo) {
        // Arrays go to localStorage ONLY — never in cookies (prevents 431 header bloat)
        const arraysStr = localStorage.getItem("passam_demo_arrays");
        const existingArrays = arraysStr ? JSON.parse(arraysStr) : {};
        const updatedArrays = { ...existingArrays, upcomingEvents: updatedEvents };
        localStorage.setItem("passam_demo_arrays", JSON.stringify(updatedArrays));

        // Cookie stores only scalar profile fields — keep it tiny
        const profileStr = localStorage.getItem("passam_demo_profile");
        const existingProfile = profileStr ? JSON.parse(profileStr) : {};
        const slimProfile = {
          name: existingProfile.name,
          university: existingProfile.university,
          targetGpa: existingProfile.targetGpa,
          currentGpa: existingProfile.currentGpa,
          gpaScale: existingProfile.gpaScale || "5.0",
          studyStreak: existingProfile.studyStreak,
          cardsMastered: existingProfile.cardsMastered,
        };
        const date = new Date();
        date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000);
        document.cookie = `passam_demo_profile=${encodeURIComponent(JSON.stringify(slimProfile))}; path=/; expires=${date.toUTCString()};`;

        setUpcomingEvents(updatedEvents);
        setSuccessMsg("Event added to schedule!");
      } else {
        // Save to real Supabase auth metadata
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
          data: {
            upcoming_events: updatedEvents
          }
        });

        if (error) throw error;
        setUpcomingEvents(updatedEvents);
        setSuccessMsg("Event synced with Supabase!");
      }

      // Reset form states
      setEventTitle("");
      setEventTime("");
      setIsAddingEvent(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (error) {
      console.error("Failed to save schedule:", error);
      alert("Failed to save schedule.");
    } finally {
      setIsSaving(false);
    }
  };

  // Google Calendar Integration - Quick Add Link Generator
  const generateGoogleCalendarUrl = (ev: any) => {
    const startDate = new Date(ev.time);
    const endDate = new Date(startDate.getTime() + ev.duration * 60 * 1000);
    
    // Format YYYYMMDDTHHMMSSZ for both dates
    const formatGCalDate = (d: Date) => {
      return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const dates = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;
    const details = `PassAm Study Session: Reviewing syllabus and course guidelines for ${ev.title}.`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${dates}&details=${encodeURIComponent(details)}&location=PassAm+AI+Study+Hub`;
  };

  // Native Calendar (.ics) Generator & Auto-Downloader
  const downloadIcsFile = (ev: any) => {
    const startDate = new Date(ev.time);
    const endDate = new Date(startDate.getTime() + ev.duration * 60 * 1000);

    const formatIcsDate = (d: Date) => {
      return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//PassAm//NONSGML Study Tracker//EN",
      "BEGIN:VEVENT",
      `UID:${ev.id}@passam.app`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(startDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:${ev.title} (${ev.type})`,
      `DESCRIPTION:ACE your syllabus with PassAm Active recall! Reviewing resources for ${ev.title}.`,
      "LOCATION:PassAm AI Study Hub",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${ev.title.replace(/\s+/g, "_")}_schedule.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper date renderer
  const formatEventDate = (dtStr: string) => {
    try {
      const d = new Date(dtStr);
      return d.toLocaleDateString("en-NG", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dtStr;
    }
  };

  // Upgraded chats layout mock and real history
  const recentChats = recentSessions.length > 0 ? recentSessions.map((session, idx) => ({
    id: session.id || String(idx),
    title: session.title || "AI Tutor Session",
    detail: session.detail || "Active recall syllabus exploration",
    time: session.time || "Active now",
    topic: session.course || "General",
  })) : [
    { id: "1", title: "Logic & Proof Systems", detail: "Discussed Linear Algebra matrices and proofs.", time: "2 hrs ago", topic: "MTH 201" },
    { id: "2", title: "CPU Scheduler Algorithms", detail: "Explored Round-Robin & Shortest Job First schedules.", time: "Yesterday", topic: "CSC 301" },
    { id: "3", title: "Thermodynamics Core Concepts", detail: "Reviewed entropy calculations and energy equations.", time: "3 days ago", topic: "PHY 202" }
  ];

  // Helper for generating custom weekly SVG streak heights based on study sessions count
  const weeklyData = [
    { day: "Mon", sessions: 2, completed: true },
    { day: "Tue", sessions: 4, completed: true },
    { day: "Wed", sessions: 1, completed: true },
    { day: "Thu", sessions: 3, completed: true },
    { day: "Fri", sessions: 5, completed: true },
    { day: "Sat", sessions: 0, completed: false },
    { day: "Sun", sessions: 2, completed: true },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Welcome Hero Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 md:p-8 glass rounded-3xl border border-border/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3.5 bg-primary/10 rounded-2xl text-primary glow-primary">
            <GraduationCap size={32} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Welcome, {user.name}</h1>
              {user.isDemo && (
                <span className="text-[9px] uppercase font-black bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Sparkles size={8} className="animate-pulse" /> Demo Mode
                </span>
              )}
              {user.hasTakenSurvey && user.surveyProfile && (
                <span className="text-[9px] uppercase font-black bg-accent/20 text-accent border border-accent/30 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <BrainCircuit size={8} /> {user.surveyProfile.archetype}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm font-medium mt-1">
              {user.university ? `Pursuing academic excellence at ${user.university}` : "Ready to ace your exams? Let's build your study streak today."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold bg-green-500/10 text-green-400 px-4 py-2 rounded-full border border-green-500/20" style={{ boxShadow: '0 0 15px rgba(34, 197, 94, 0.1)' }}>
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          Offline Engine Active & Synced
        </div>
      </div>

      {/* Survey Diagnostic Callout Banner */}
      {!user.hasTakenSurvey && (
        <div className="p-6 glass rounded-3xl border border-accent/30 bg-accent/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent/10 rounded-2xl text-accent glow-accent mt-0.5">
              <BrainCircuit size={24} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-accent">Uncover Your Learning Archetype!</h3>
              <p className="text-xs text-muted-foreground leading-normal mt-1 max-w-xl">
                Take the interactive 2-minute diagnostic survey to let PassAm identify your strengths, weaknesses, and study recommendations.
              </p>
            </div>
          </div>
          <Link
            href="/survey"
            className="w-full md:w-auto bg-accent text-accent-foreground px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-accent/95 active:scale-95 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shadow-lg shadow-accent/20"
          >
            Start Diagnostics <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Grid Statistics widgets - Upgraded to show Live Streak Graph Card side by side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: GPA */}
        <div className="glass p-6 rounded-3xl flex flex-col justify-between gap-4 hover-glide relative overflow-hidden group border border-border/50">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current GPA</p>
              <p className="text-4xl font-black">
                {currentGpa}
                <span className="text-sm font-semibold text-muted-foreground ml-1">/ {user.gpaScale === "4.0" ? "4.00" : "5.00"}</span>
              </p>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-2xl glow-primary">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground pt-3 border-t border-border/20">
            <Target size={14} className="text-accent" />
            <span>
              Target: {targetGpa} (
              {user.gpaScale === "4.0"
                ? (Number(targetGpa) >= 3.5 ? "First Class Equivalent" : "Second Class Upper Equivalent")
                : (Number(targetGpa) >= 4.5 ? "First Class" : "Second Class Upper")
              })
            </span>
          </div>
        </div>

        {/* Card 2: Live Study Streak Metric Graph Card */}
        <div className="glass p-6 rounded-3xl flex flex-col justify-between gap-4 border border-orange-500/20 bg-orange-500/5 relative overflow-hidden group md:col-span-2">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Active Study Streak</p>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-black text-foreground">{studyStreak} Days</span>
                <span className="text-xs font-black uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                  <Flame size={12} className="fill-orange-400" /> STREAK ACTIVE
                </span>
              </div>
            </div>
            
            {/* Calendar Event metrics count */}
            <div className="text-right">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Consistency</span>
              <span className="text-xs font-extrabold text-foreground">{Math.round((weeklyData.filter(d => d.completed).length / 7) * 100)}% this week</span>
            </div>
          </div>

          {/* Glowing Live SVG Sparkline Streak Graph */}
          <div className="h-16 flex items-end justify-between gap-2 pt-2 border-t border-border/20 relative">
            {/* Visual background guide lines */}
            <div className="absolute inset-x-0 bottom-1 h-[1px] bg-foreground/5" />
            <div className="absolute inset-x-0 bottom-6 h-[1px] bg-foreground/5" />
            <div className="absolute inset-x-0 bottom-12 h-[1px] bg-foreground/5" />

            {/* Glowing Bars graph representing daily study sessions */}
            {weeklyData.map((d, idx) => {
              const heightPercent = d.sessions * 20; // max 5 sessions is 100%
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 z-10">
                  <div className="w-full relative group/bar">
                    {/* Glowing bar */}
                    <div 
                      style={{ height: `${Math.max(heightPercent, 8)}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        d.completed 
                          ? "bg-gradient-to-t from-orange-600 to-orange-400 shadow-md shadow-orange-500/25" 
                          : "bg-foreground/10"
                      }`}
                    />
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/bar:block bg-foreground text-background text-[9px] font-black px-2 py-0.5 rounded shadow whitespace-nowrap">
                      {d.sessions} Sessions
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase ${d.completed ? "text-orange-400 font-extrabold" : "text-muted-foreground"}`}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        
        {/* Recent sessions / Chats section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight">Recent AI Study Chats</h2>
            <Link 
              href="/study"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Open Study Hub <ArrowRight size={12} />
            </Link>
          </div>

          {/* Premium UI for chats with active conversational features */}
          <div className="grid grid-cols-1 gap-4">
            {recentChats.map((chat) => (
              <div 
                key={chat.id} 
                className="glass p-5 rounded-3xl border border-border/60 hover:border-primary/30 bg-card/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover-glide relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] pointer-events-none group-hover:scale-110 transition-transform" />
                
                <div className="flex items-center gap-4 relative z-10">
                  {/* Glowing user avatar bubble */}
                  <div className="relative">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/20 flex items-center justify-center text-primary font-black text-sm group-hover:scale-105 transition-transform shadow-inner">
                      {chat.topic}
                    </div>
                    {/* Live Online state indicator */}
                    <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-background absolute -bottom-0.5 -right-0.5 animate-pulse" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-foreground">{chat.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium line-clamp-1 max-w-sm sm:max-w-md">
                      {chat.detail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/20">
                  <div className="text-xs text-muted-foreground font-bold flex items-center gap-1">
                    <Clock size={12} /> {chat.time}
                  </div>
                  
                  <Link
                    href="/study"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center gap-1 group-hover:shadow-md group-hover:shadow-primary/10 cursor-pointer"
                  >
                    <MessageSquare size={11} /> Resume
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Google Calendar & timetable scheduler panel */}
          <div className="glass p-6 rounded-3xl border border-primary/20 bg-primary/5 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl glow-primary">
                  <CalendarPlus size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-primary">Interactive Study & Exam Scheduler</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Queue up upcoming midterms, finals, or syllabus reading blocks.</p>
                </div>
              </div>
              
              {!isAddingEvent && (
                <button
                  onClick={() => setIsAddingEvent(true)}
                  className="bg-primary text-primary-foreground font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-primary/95 transition-all shadow-md shadow-primary/15 cursor-pointer"
                >
                  Schedule Event
                </button>
              )}
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-300">
                <Check size={14} /> {successMsg}
              </div>
            )}

            {isAddingEvent && (
              <form onSubmit={handleAddEvent} className="p-4 bg-background border border-border/60 rounded-2xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Event Title</label>
                    <input 
                      type="text" 
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="E.g. CSC 301 Midterm exam, or Calculus revision..."
                      className="w-full bg-foreground/5 border border-border/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary/50"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value as any)}
                      className="w-full bg-foreground/5 border border-border/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary/50 dark:bg-zinc-900"
                    >
                      <option value="Reading Session">Reading Session</option>
                      <option value="Test">Upcoming Test</option>
                      <option value="Exam">Upcoming Exam</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Schedule Date & Time</label>
                    <input 
                      type="datetime-local" 
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full bg-foreground/5 border border-border/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary/50"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Duration (Minutes)</label>
                    <select
                      value={eventDuration}
                      onChange={(e) => setEventDuration(e.target.value)}
                      className="w-full bg-foreground/5 border border-border/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary/50 dark:bg-zinc-900"
                    >
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour</option>
                      <option value="90">1.5 Hours</option>
                      <option value="120">2 Hours</option>
                      <option value="180">3 Hours</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2 border-t border-border/30">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-primary text-primary-foreground font-bold text-xs py-2.5 rounded-xl hover:bg-primary/95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? "Saving..." : "Add to Study Calendar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingEvent(false)}
                    className="px-4 py-2.5 bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground font-bold text-xs rounded-xl border border-border transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* List of Dynamic scheduled events */}
            <div className="space-y-3.5">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Upcoming Timetable Events</h4>
              
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground font-medium">
                  No upcoming reading schedules, tests, or exams. Click Schedule Event to build your target calendar.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {upcomingEvents.map((ev) => (
                    <div key={ev.id} className="p-4 bg-background border border-border/50 rounded-2xl flex flex-col justify-between gap-3 relative overflow-hidden group hover:border-primary/30 transition-all">
                      <div className="space-y-1 relative z-10">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                          ev.type === "Exam" 
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                            : ev.type === "Test" 
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                        }`}>
                          {ev.type}
                        </span>
                        <h4 className="font-extrabold text-sm text-foreground pt-1">{ev.title}</h4>
                        <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5 pt-0.5">
                          <Clock size={11} /> {formatEventDate(ev.time)} ({ev.duration} mins)
                        </p>
                      </div>

                      {/* Google Calendar Link & Local Download Trigger */}
                      <div className="flex gap-2 pt-2 border-t border-border/20">
                        <a 
                          href={generateGoogleCalendarUrl(ev)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 text-center bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[10px] py-2 rounded-xl transition-all flex items-center justify-center gap-1"
                        >
                          <Sparkles size={10} /> Sync to Google
                        </a>
                        <button
                          onClick={() => downloadIcsFile(ev)}
                          className="px-3 bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground font-bold text-[10px] rounded-xl border border-border transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Download Calendar .ics file"
                        >
                          <Download size={10} /> .ics
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight">Recommended Actions</h2>
          <div className="space-y-4">
            
            <Link 
              href="/study"
              className="w-full text-left p-5 glass rounded-3xl hover:bg-foreground/5 transition-all group flex items-center justify-between border border-primary/30 hover:border-primary/50"
            >
              <div>
                <h4 className="font-bold text-sm text-primary">Resume AI Chat</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-normal">Continue your syllabus active recall tutoring.</p>
              </div>
              <div className="p-2 bg-primary/10 text-primary rounded-xl group-hover:translate-x-1.5 transition-all glow-primary">
                <ArrowRight size={16} />
              </div>
            </Link>

            <Link 
              href="/assessments"
              className="w-full text-left p-5 glass rounded-3xl hover:bg-foreground/5 transition-all group flex items-center justify-between border border-border/50 hover:border-accent/40"
            >
              <div>
                <h4 className="font-bold text-sm">Practice Flashcards</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-normal">Generate customized mock questions to verify recall.</p>
              </div>
              <div className="p-2 bg-accent/10 text-accent rounded-xl group-hover:translate-x-1.5 transition-all">
                <ArrowRight size={16} />
              </div>
            </Link>

            <Link 
              href="/resources"
              className="w-full text-left p-5 glass rounded-3xl hover:bg-foreground/5 transition-all group flex items-center justify-between border border-border/50 hover:border-emerald-500/30"
            >
              <div>
                <h4 className="font-bold text-sm">Explore Resource Library</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-normal font-medium">Access offline cached past papers and textbooks.</p>
              </div>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:translate-x-1.5 transition-all">
                <ArrowRight size={16} />
              </div>
            </Link>

            {user.hasTakenSurvey && user.surveyProfile && (
              <div className="p-5 glass rounded-3xl border border-accent/25 bg-accent/5 space-y-3 relative overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-xl pointer-events-none"></div>
                <div className="flex items-center gap-2">
                  <BrainCircuit size={16} className="text-accent animate-pulse" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-accent">AI Study Plan</h4>
                </div>
                <p className="text-xs font-semibold leading-relaxed text-foreground/90">
                  {user.surveyProfile.strategy}
                </p>
              </div>
            )}

            {/* 1. Daily Reminders & Alerts Card */}
            <div 
              className="p-5 glass rounded-3xl border border-border/50 bg-card/25 space-y-4 hover-glide relative overflow-hidden group animate-in fade-in duration-500"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] pointer-events-none group-hover:scale-110 transition-transform" />
              
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl glow-primary">
                  <BrainCircuit size={18} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Reminders & Daily Digest</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Stay consistent with notifications & progress reports.</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {notificationPermission === "granted" ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 justify-center">
                    <Check size={14} /> Alerts Active & Authorized
                  </div>
                ) : notificationPermission === "denied" ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-2 rounded-xl border border-rose-500/20 justify-center">
                    <X size={14} /> Notifications Blocked
                  </div>
                ) : (
                  <button
                    onClick={handleRequestNotificationPermission}
                    type="button"
                    className="w-full text-center bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs py-2 rounded-xl border border-primary/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Enable Push Notifications
                  </button>
                )}

                <button
                  onClick={handleSendProgressEmail}
                  disabled={isLoadingEmail}
                  type="button"
                  className="w-full text-center bg-foreground/5 hover:bg-foreground/10 text-foreground font-bold text-xs py-2.5 rounded-xl border border-border transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isLoadingEmail ? "Compiling Report..." : "Simulate Daily Email"}
                </button>
              </div>
            </div>

            {/* 2. Download Native APK Mobile Card */}
            <div 
              className="p-5 glass rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 space-y-4 hover-glide relative overflow-hidden group animate-in fade-in duration-500"
              style={{ boxShadow: '0 0 20px rgba(99, 102, 241, 0.05)' }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-[100px] pointer-events-none group-hover:scale-110 transition-transform" />
              
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/15 text-indigo-400 rounded-xl">
                  <Download size={18} className="animate-bounce" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-indigo-300">PassAm Native APK</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Install on Android or iOS for premium offline setup.</p>
                </div>
              </div>

              <button
                onClick={handleDownloadApk}
                type="button"
                className="w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                Download Mobile App
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Visual Email Simulator Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="w-full max-w-2xl bg-[#090d16] border border-primary/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh] animate-in zoom-in-95 duration-300"
            style={{ boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.25)' }}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-background border-b border-border/40 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-muted-foreground ml-2 text-left">PassAm Secure Email Client</span>
              </div>
              <button 
                onClick={() => setIsEmailModalOpen(false)}
                type="button"
                className="p-1 rounded-lg hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Email Header Info */}
            <div className="px-6 py-4 bg-foreground/[0.02] border-b border-border/40 space-y-2">
              <div className="text-xs flex items-center gap-2">
                <span className="font-bold text-muted-foreground w-12 text-left">From:</span>
                <span className="text-foreground font-semibold text-left">PassAm Progress Digest &lt;<span className="text-primary">alerts@passam.app</span>&gt;</span>
              </div>
              <div className="text-xs flex items-center gap-2">
                <span className="font-bold text-muted-foreground w-12 text-left">To:</span>
                <span className="text-foreground font-semibold text-left">{user.name} &lt;<span className="text-accent">{user.email}</span>&gt;</span>
              </div>
              <div className="text-xs flex items-center gap-2">
                <span className="font-bold text-muted-foreground w-12 text-left">Subject:</span>
                <span className="text-foreground font-extrabold text-left">🔥 Keep your study streak alive, {user.name}! Daily PassAm Progress Digest</span>
              </div>
            </div>

            {/* Email Body Rendering via srcDoc (safe, style-isolated iframe) */}
            <div className="flex-1 bg-white">
              <iframe
                title="Email Content Simulator"
                srcDoc={emailHtml}
                className="w-full h-full border-none"
              />
            </div>
            
            {/* Simulator Footer */}
            <div className="px-6 py-4 bg-background border-t border-border/40 flex justify-between items-center">
              <p className="text-[10px] text-muted-foreground font-medium text-left">
                Tip: Resend or SendGrid can trigger this HTML template automatically.
              </p>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                type="button"
                className="bg-primary text-primary-foreground font-bold text-xs px-4 py-2 rounded-xl hover:bg-primary/95 transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APK Mobile App Installation Helper Modal */}
      {isApkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="w-full max-w-lg bg-card border border-border/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-background border-b border-border/40 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Download size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-left">Install PassAm Mobile</h3>
                  <p className="text-[11px] text-muted-foreground text-left">Setup native app experience on your smartphone</p>
                </div>
              </div>
              <button 
                onClick={() => setIsApkModalOpen(false)}
                type="button"
                className="p-1 rounded-lg hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs Trigger */}
            <div className="flex border-b border-border/30 bg-foreground/[0.01]">
              <button
                onClick={() => setApkActiveTab("apk")}
                type="button"
                className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  apkActiveTab === "apk" 
                    ? "border-indigo-500 text-indigo-400 bg-indigo-500/5" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Android APK (Native)
              </button>
              <button
                onClick={() => setApkActiveTab("pwa")}
                type="button"
                className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  apkActiveTab === "pwa" 
                    ? "border-indigo-500 text-indigo-400 bg-indigo-500/5" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Home-Screen PWA Setup
              </button>
            </div>

            {/* Tab content wrapper */}
            <div className="p-6 space-y-6 flex-1 max-h-[60vh] overflow-y-auto">
              {apkActiveTab === "apk" ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-3.5 bg-indigo-500/10 text-indigo-300 text-xs font-semibold rounded-2xl border border-indigo-500/20 leading-relaxed text-left">
                    🚀 Your download for <strong>passam-v1.0.apk</strong> started automatically! Use the steps below to sideload and install it on Android.
                  </div>

                  <div className="space-y-4 pt-1">
                    <div className="flex gap-4">
                      <div className="h-7 w-7 rounded-lg bg-foreground/5 border border-border flex items-center justify-center font-black text-xs text-indigo-400 shrink-0">1</div>
                      <p className="text-xs text-muted-foreground leading-relaxed pt-0.5 text-left">
                        <strong className="text-foreground">Download the APK:</strong> Locate `passam-v1.0.apk` inside your device's Downloads directory.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <div className="h-7 w-7 rounded-lg bg-foreground/5 border border-border flex items-center justify-center font-black text-xs text-indigo-400 shrink-0">2</div>
                      <p className="text-xs text-muted-foreground leading-relaxed pt-0.5 text-left">
                        <strong className="text-foreground">Allow Unknown Sources:</strong> Go to <strong className="text-foreground">Settings &gt; Security &gt; Privacy</strong> or click the installer prompt to "Allow installations from this source".
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <div className="h-7 w-7 rounded-lg bg-foreground/5 border border-border flex items-center justify-center font-black text-xs text-indigo-400 shrink-0">3</div>
                      <p className="text-xs text-muted-foreground leading-relaxed pt-0.5 text-left">
                        <strong className="text-foreground">Install & Run:</strong> Open the package, tap "Install", then open PassAm to experience the offline database syncing without browser controls.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-3.5 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-2xl border border-emerald-500/20 leading-relaxed text-left">
                    💡 Installing the PWA creates a lightweight launcher icon on your phone without requiring file downloads. Ideal for both iOS Safari & Android Chrome!
                  </div>

                  <div className="space-y-4 pt-1">
                    <div className="p-4 bg-background border border-border/40 rounded-2xl space-y-2">
                      <h4 className="text-xs font-bold text-foreground text-left">🍏 For iOS (Safari Browser)</h4>
                      <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1.5 pl-1 leading-relaxed text-left">
                        <li>Open <span className="text-primary font-bold">https://passam.app</span> inside Safari.</li>
                        <li>Tap the <strong className="text-foreground">Share</strong> icon at the bottom of the browser.</li>
                        <li>Scroll down and select <strong className="text-foreground">Add to Home Screen</strong>.</li>
                      </ol>
                    </div>

                    <div className="p-4 bg-background border border-border/40 rounded-2xl space-y-2">
                      <h4 className="text-xs font-bold text-foreground text-left">🤖 For Android (Chrome Browser)</h4>
                      <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1.5 pl-1 leading-relaxed text-left">
                        <li>Open <span className="text-primary font-bold">https://passam.app</span> inside Chrome.</li>
                        <li>Tap the <strong className="text-foreground">Menu (three dots)</strong> at the top-right corner.</li>
                        <li>Tap <strong className="text-foreground">Add to Home Screen</strong> or <strong className="text-foreground">Install App</strong>.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-background border-t border-border/40 flex justify-between items-center">
              <button
                onClick={() => handleDownloadApk()}
                type="button"
                className="bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/25 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Re-download APK
              </button>
              <button
                onClick={() => setIsApkModalOpen(false)}
                type="button"
                className="bg-foreground text-background font-bold text-xs px-4 py-2 rounded-xl hover:bg-foreground/90 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
