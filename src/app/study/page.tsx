"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Mic, Send, Paperclip, Loader2, Square, FileText, Image, X, Check,
  BrainCircuit, Sparkles, StopCircle, Trash2, Plus, Menu,
  Pencil, MessageSquare, ChevronRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const MAX_SESSIONS = 20;
const MAX_MSGS = 60;
const STORAGE_KEY = "passam_chat_sessions";

const makeWelcome = (): ChatMessage => ({
  id: "welcome-1",
  role: "assistant",
  content: "Hello! I'm your PassAm AI study tutor. Ask me anything, upload syllabus docs, or request simple analogies! 🎓",
  timestamp: Date.now(),
});

const newSession = (): ChatSession => ({
  id: `session-${Date.now()}`,
  title: "New Chat",
  messages: [makeWelcome()],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// ─── Component ───────────────────────────────────────────────────────────────
export default function StudyHub() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isDemo, setIsDemo] = useState<boolean | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Chat
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Handle sidebar responsive visibility on screen changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // File
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; size: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Voice
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Active session helper ─────────────────────────────────────────────────
  const activeSession = sessions.find(s => s.id === activeId) ?? null;

  // ── Persistence helpers ───────────────────────────────────────────────────
  const persist = useCallback(async (updated: ChatSession[]) => {
    if (isDemo === null) return;
    const trimmed = updated.slice(0, MAX_SESSIONS).map(s => ({
      ...s,
      messages: s.messages.slice(-MAX_MSGS),
    }));
    try {
      if (!isDemo) {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          // Delete chats from database that were deleted in the UI
          const activeIds = trimmed.map(s => s.id);
          const { error: deleteErr } = await supabase
            .from("chat_sessions")
            .delete()
            .eq("user_id", authUser.id)
            .not("id", "in", `(${activeIds.join(",")})`);
          if (deleteErr) console.error("Error pruning deleted chats:", deleteErr);

          // Upsert current active chats
          const rowsToUpsert = trimmed.map(s => ({
            id: s.id,
            user_id: authUser.id,
            title: s.title,
            messages: s.messages,
          }));
          const { error: upsertErr } = await supabase
            .from("chat_sessions")
            .upsert(rowsToUpsert, { onConflict: "id" });
          if (upsertErr) throw upsertErr;
        }
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      }
    } catch (e) { console.error("Persist error:", e); }
  }, [isDemo]);

  // ── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("passam_demo_survey");
        if (raw) {
          const p = JSON.parse(raw);
          if (p.survey_profile) setUserProfile(p.survey_profile);
        }
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        let saved: ChatSession[] = [];
        if (user) {
          setIsDemo(false);
          const { data: dbChats, error: dbErr } = await supabase
            .from("chat_sessions")
            .select("*")
            .order("created_at", { ascending: false });
          if (dbChats && !dbErr) {
            saved = dbChats.map((c: any) => ({
              id: c.id,
              title: c.title,
              messages: Array.isArray(c.messages) ? c.messages : [],
              createdAt: c.created_at ? new Date(c.created_at).getTime() : Date.now(),
              updatedAt: c.created_at ? new Date(c.created_at).getTime() : Date.now(),
            }));
          }
        } else {
          setIsDemo(true);
          const lsRaw = localStorage.getItem(STORAGE_KEY);
          if (lsRaw) saved = JSON.parse(lsRaw);
        }
        if (saved.length > 0) {
          setSessions(saved);
          setActiveId(saved[0].id);
        } else {
          const first = newSession();
          setSessions([first]);
          setActiveId(first.id);
        }
      } catch (e) { console.error("Load error:", e); }
      finally { setHistoryLoaded(true); }
    })();
  }, []);

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeSession?.messages]);

  // ── Session CRUD ──────────────────────────────────────────────────────────
  const createNewChat = () => {
    const s = newSession();
    const updated = [s, ...sessions];
    setSessions(updated);
    setActiveId(s.id);
    persist(updated);
  };

  const switchSession = (id: string) => {
    if (!isStreaming) setActiveId(id);
  };

  const deleteSession = async (id: string) => {
    if (!confirm("Delete this chat session?")) return;
    const updated = sessions.filter(s => s.id !== id);
    if (updated.length === 0) {
      const fresh = newSession();
      updated.push(fresh);
    }
    setSessions(updated);
    if (activeId === id) setActiveId(updated[0].id);
    persist(updated);
  };

  const startRename = (s: ChatSession) => {
    setRenamingId(s.id);
    setRenameValue(s.title);
  };

  const commitRename = () => {
    if (!renamingId) return;
    const title = renameValue.trim() || "Untitled";
    const updated = sessions.map(s => s.id === renamingId ? { ...s, title } : s);
    setSessions(updated);
    persist(updated);
    setRenamingId(null);
  };

  // ── Update sessions helper ────────────────────────────────────────────────
  const updateSession = useCallback((id: string, updater: (s: ChatSession) => ChatSession) => {
    setSessions(prev => {
      const updated = prev.map(s => s.id === id ? updater(s) : s);
      return updated;
    });
  }, []);

  // ── Streaming chat ────────────────────────────────────────────────────────
  const sendChat = useCallback(async (userContent: string) => {
    if (!userContent.trim() || isStreaming || !activeId) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: userContent, timestamp: Date.now() };
    const asstId = `a-${Date.now()}`;
    const asstMsg: ChatMessage = { id: asstId, role: "assistant", content: "", timestamp: Date.now() };

    // Auto-generate title from first user message
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id !== activeId) return s;
        const realMsgs = s.messages.filter(m => m.id !== "welcome-1");
        const autoTitle = realMsgs.length === 0 ? userContent.slice(0, 50).trim() : s.title;
        return { ...s, title: autoTitle, messages: [...s.messages, userMsg, asstMsg], updatedAt: Date.now() };
      });
      return updated;
    });
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let finalContent = "";

    try {
      const history = [...(activeSession?.messages ?? []), userMsg]
        .filter(m => m.id !== "welcome-1")
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, surveyProfile: userProfile }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`Server ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        finalContent += decoder.decode(value, { stream: true });
        setSessions(prev => prev.map(s =>
          s.id === activeId
            ? { ...s, messages: s.messages.map(m => m.id === asstId ? { ...m, content: finalContent } : m) }
            : s
        ));
      }

      // Persist after complete
      setSessions(prev => {
        const updated = prev.map(s =>
          s.id === activeId
            ? { ...s, messages: s.messages.map(m => m.id === asstId ? { ...m, content: finalContent } : m), updatedAt: Date.now() }
            : s
        );
        persist(updated);
        return updated;
      });

    } catch (e: any) {
      if (e.name === "AbortError") return;
      setSessions(prev => prev.map(s =>
        s.id === activeId
          ? { ...s, messages: s.messages.map(m => m.id === asstId ? { ...m, content: "⚠️ Error. Please retry." } : m) }
          : s
      ));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [isStreaming, activeId, activeSession, userProfile, persist]);

  const stopStreaming = () => { abortRef.current?.abort(); setIsStreaming(false); };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text && !attachedFile) return;
    let content = text;
    if (attachedFile) content = `[Attached: ${attachedFile.name}]\n\n${text || "Analyse this document."}`;
    setInput("");
    removeAttachment();
    sendChat(content);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!isStreaming) handleSubmit(); }
  };

  // ── File ──────────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setTimeout(() => {
      setAttachedFile({ name: file.name, type: file.type, size: `${(file.size / 1048576).toFixed(2)} MB` });
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    }, 900);
  };
  const removeAttachment = () => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; };

  // ── Voice ─────────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        setIsTranscribing(true);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("file", blob, "recording.webm");
        try {
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          const d = await res.json();
          if (d.transcript) setInput(p => p ? `${p} ${d.transcript}` : d.transcript);
        } finally { setIsTranscribing(false); }
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start();
      setIsRecording(true);
    } catch { alert("Microphone access denied."); }
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

  // ── Markdown renderer ─────────────────────────────────────────────────────
  const bold = (t: string) => t.split(/(\*\*.*?\*\*)/g).map((s, i) =>
    s.startsWith("**") && s.endsWith("**")
      ? <strong key={i} className="text-primary font-extrabold bg-primary/5 px-1 rounded">{s.slice(2, -2)}</strong>
      : <span key={i}>{s}</span>
  );

  const renderMd = (raw: string) => raw.split("\n").map((line, i) => {
    if (line.startsWith("### ")) return <p key={i} className="font-extrabold text-primary text-sm mt-3 mb-0.5">{bold(line.slice(4))}</p>;
    if (line.startsWith("## ")) return <p key={i} className="font-extrabold text-base mt-3 mb-0.5">{bold(line.slice(3))}</p>;
    if (line.startsWith("- ") || line.startsWith("* "))
      return <span key={i} className="flex gap-2 items-start py-0.5"><span className="text-accent shrink-0">⚡</span><span className="text-sm font-medium">{bold(line.slice(2))}</span></span>;
    const nm = line.match(/^(\d+)\.\s(.*)/);
    if (nm) return <span key={i} className="flex gap-2 items-start py-0.5"><span className="text-primary font-black text-xs shrink-0">{nm[1]}.</span><span className="text-sm font-medium">{bold(nm[2])}</span></span>;
    if (!line.trim()) return <div key={i} className="h-1.5" />;
    return <p key={i} className="text-sm font-medium leading-relaxed">{bold(line)}</p>;
  });

  const fmtTime = (ts: number) => new Date(ts).toLocaleDateString("en-NG", { month: "short", day: "numeric" });

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100dvh-8rem)] md:h-[calc(100dvh-2rem)] overflow-hidden w-full">

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-background/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside 
        className={`
          ${sidebarOpen ? "w-64 border-r border-border/50" : "w-0 border-r-0"} 
          fixed md:static inset-y-16 md:inset-y-0 left-0 z-35 
          shrink-0 transition-all duration-300 overflow-hidden 
          flex flex-col bg-card/95 md:bg-card/50 backdrop-blur-md md:backdrop-blur-sm
        `}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b border-border/40 flex items-center justify-between shrink-0">
          <span className="font-black text-sm text-foreground flex items-center gap-1.5">
            <MessageSquare size={14} className="text-primary" /> Chats
          </span>
          <button
            onClick={createNewChat}
            className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors cursor-pointer"
            title="New Chat"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
          {!historyLoaded && (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-1.5">
              <Loader2 size={12} className="animate-spin" /> Loading…
            </div>
          )}
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => switchSession(s.id)}
              className={`group relative w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                s.id === activeId
                  ? "bg-primary/15 border border-primary/30 text-foreground"
                  : "hover:bg-foreground/5 text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {renamingId === s.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
                  onClick={e => e.stopPropagation()}
                  className="w-full bg-background border border-primary/40 rounded-lg px-2 py-0.5 text-base md:text-xs font-bold focus:outline-none text-foreground"
                />
              ) : (
                <>
                  <p className="text-xs font-bold truncate pr-10">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{fmtTime(s.updatedAt)}</p>

                  {/* Action buttons — visible on hover */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1">
                    <button
                      onClick={e => { e.stopPropagation(); startRename(s); }}
                      className="p-1 rounded-md hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Rename"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                      className="p-1 rounded-md hover:bg-rose-500/15 text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-border/40 shrink-0">
          <p className="text-[9px] text-muted-foreground text-center font-semibold uppercase tracking-wider">
            {isDemo === false ? "Synced to Supabase" : "Saved Locally"} · {sessions.length}/{MAX_SESSIONS} sessions
          </p>
        </div>
      </aside>

      {/* ── Main chat area ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 pt-4 pb-2 md:pb-6 px-4 md:px-6">

        {/* Top bar */}
        <div className="flex items-center justify-between pb-4 border-b border-border/50 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-foreground/5 transition-colors cursor-pointer shrink-0"
              title={sidebarOpen ? "Hide panel" : "Show panel"}
            >
              <Menu size={18} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm md:text-lg font-black truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                  {activeSession?.title || "Study Hub"}
                </h1>
                {userProfile && (
                  <span className="text-[9px] uppercase font-black bg-accent/20 text-accent border border-accent/30 px-2 py-0.5 rounded-full shrink-0 hidden sm:inline-block">
                    {userProfile.archetype}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                High-Speed AI Tutor · Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={createNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-sm shadow-primary/20"
            >
              <Plus size={13} /> <span className="hidden sm:inline">New Chat</span>
            </button>
            <div className="glass px-2.5 py-1.5 rounded-full text-xs font-semibold text-muted-foreground border border-border hidden md:flex items-center gap-1.5">
              <Sparkles size={11} className="text-primary animate-pulse" /> Rich Output
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-hide pr-1">
          {activeSession?.messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mr-2 mt-1 shrink-0">
                  <BrainCircuit size={12} />
                </div>
              )}
              <div className={`max-w-[90%] md:max-w-[72%] rounded-3xl px-4 py-3 md:px-5 md:py-4 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm shadow-lg shadow-primary/10 border border-primary/20"
                  : "glass rounded-bl-sm border border-border/60"
              }`}>
                {msg.role === "assistant" && msg.content === "" ? (
                  <div className="flex gap-1.5 py-1">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                ) : (
                  <div className="leading-relaxed space-y-0.5">
                    {msg.role === "assistant"
                      ? renderMd(msg.content)
                      : <p className="text-sm font-semibold whitespace-pre-wrap">{msg.content}</p>}
                  </div>
                )}
                {msg.id !== "welcome-1" && (
                  <p className="text-[9px] mt-1.5 opacity-40 font-medium">
                    {new Date(msg.timestamp).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment preview */}
        {attachedFile && (
          <div className="mb-2 p-3 glass rounded-2xl border border-primary/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                {attachedFile.type.startsWith("image/") ? <Image size={15} /> : <FileText size={15} />}
              </div>
              <div>
                <p className="text-xs font-black truncate max-w-[200px]">{attachedFile.name}</p>
                <p className="text-[10px] text-muted-foreground">{attachedFile.size}</p>
              </div>
            </div>
            <button onClick={removeAttachment} className="p-1 text-muted-foreground hover:text-rose-400 cursor-pointer"><X size={14} /></button>
          </div>
        )}

        {/* Input bar */}
        <div className="shrink-0">
          <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-card border border-border p-2 rounded-3xl shadow-sm focus-within:border-primary/50 transition-colors">
            <input type="file" ref={fileInputRef} onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt,.ppt,.pptx" className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
              className="p-2.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-foreground/5 cursor-pointer shrink-0 transition-colors">
              {isUploading ? <Loader2 size={18} className="animate-spin text-primary" />
                : uploadSuccess ? <Check size={18} className="text-green-400" />
                : <Paperclip size={18} />}
            </button>

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={isRecording ? "Listening…" : isTranscribing ? "Transcribing…" : "Ask your AI tutor…"}
              className={`flex-1 bg-transparent border-none focus:outline-none resize-none max-h-32 min-h-[40px] py-2.5 text-base md:text-sm scrollbar-hide ${isRecording ? "text-red-500 animate-pulse" : ""}`}
              rows={1}
              disabled={isStreaming || isRecording || isTranscribing}
            />

            {isStreaming ? (
              <button type="button" onClick={stopStreaming} className="p-2.5 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 cursor-pointer shrink-0 transition-all">
                <StopCircle size={17} />
              </button>
            ) : isRecording ? (
              <button type="button" onClick={stopRecording} className="p-2.5 bg-red-500 text-white rounded-full animate-pulse cursor-pointer shrink-0">
                <Square size={17} className="fill-current" />
              </button>
            ) : isTranscribing ? (
              <button type="button" disabled className="p-2.5 bg-accent/20 text-accent rounded-full shrink-0">
                <Loader2 size={17} className="animate-spin" />
              </button>
            ) : (input.trim() || attachedFile) ? (
              <button type="submit" className="p-2.5 bg-primary text-primary-foreground rounded-full hover:scale-105 active:scale-95 shadow-md shadow-primary/20 cursor-pointer shrink-0 transition-all">
                <Send size={17} />
              </button>
            ) : (
              <button type="button" onClick={startRecording} className="p-2.5 bg-accent/20 text-accent rounded-full hover:bg-accent/30 cursor-pointer shrink-0 transition-colors">
                <Mic size={17} />
              </button>
            )}
          </form>
          <p className="text-center mt-1.5 text-[10px] text-muted-foreground">
            PDF · PNG · JPG · DOCX · TXT · Voice · History auto-saved {isDemo === false ? "to account" : "locally"}
          </p>
        </div>
      </div>
    </div>
  );
}
