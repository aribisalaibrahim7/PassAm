"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Key, Mail, Sparkles, LogIn, UserPlus, Info, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const NIGERIAN_UNIVERSITIES = [
  "University of Lagos (UNILAG)",
  "University of Ibadan (UI)",
  "Obafemi Awolowo University (OAU)",
  "University of Nigeria, Nsukka (UNN)",
  "Ahmadu Bello University (ABU)",
  "University of Benin (UNIBEN)",
  "University of Ilorin (UNILORIN)",
  "Lagos State University (LASU)",
  "Federal University of Technology, Akure (FUTA)",
  "Federal University of Technology, Minna (FUTMINNA)",
  "Federal University of Technology, Owerri (FUTO)",
  "University of Port Harcourt (UNIPORT)",
  "Covenant University",
  "Babcock University",
  "Yaba College of Technology (YABATECH)",
  "Lagos State University of Science and Technology (LASUSTECH)",
  "University of Abuja (UNIABUJA)",
  "Bayero University Kano (BUK)",
  "Nnamdi Azikiwe University (UNIZIK)",
  "Ladoke Akintola University of Technology (LAUTECH)",
  "Kwara State University (KWASU)",
  "Afe Babalola University (ABUAD)",
  "Pan-Atlantic University",
  "Other Institution"
];

export default function Login() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [university, setUniversity] = useState(NIGERIAN_UNIVERSITIES[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const handleDemoLogin = () => {
    setLoading(true);
    // Write demo cookie (expires in 7 days)
    const date = new Date();
    date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    document.cookie = `passam_demo_session=true; path=/; expires=${date.toUTCString()};`;
    
    setMessage({
      text: "Launching Demo Student Portal...",
      type: "success"
    });

    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
      // Refresh the page context
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }, 1200);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setMessage(null);

    try {
      if (activeTab === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage({ text: error.message, type: "error" });
        } else {
          setMessage({ text: "Success! Heading to dashboard...", type: "success" });
          setTimeout(() => {
            router.push("/dashboard");
            setTimeout(() => {
              window.location.reload();
            }, 100);
          }, 1000);
        }
      } else {
        const origin = window.location.origin;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback`,
            data: {
              name: name || "Student",
              university: university || "Nigerian University",
            }
          },
        });

        if (error) {
          setMessage({ text: error.message, type: "error" });
        } else {
          setMessage({
            text: "Registration successful! Check your email to verify your account.",
            type: "success",
          });
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setMessage({ text: errMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 md:p-8 relative">
      <Link
        href="/"
        className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors group z-20"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
      </Link>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500 z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary glow-primary mb-4">
            <Sparkles size={28} className="animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-2">
            PassAm Portal
          </h1>
          <p className="text-muted-foreground">Tailored AI Tutor for Nigerian University Students</p>
        </div>

        {/* Master Glass Card */}
        <div className="glass p-6 md:p-8 rounded-3xl border border-border shadow-2xl space-y-6 flex flex-col hover:border-primary/20 transition-all duration-300">
          
          {/* Quick Demo Login Option */}
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-4 px-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20 hover:shadow-primary/30 cursor-pointer disabled:opacity-50"
          >
            {loading && message?.text.includes("Launching") ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Sparkles size={20} className="animate-bounce" />
            )}
            ⚡ Instant One-Tap Demo Login
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border/50"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">or authenticate</span>
            <div className="flex-grow border-t border-border/50"></div>
          </div>

          {/* Form Tabs */}
          <div className="grid grid-cols-2 p-1 bg-foreground/5 rounded-xl border border-border/50">
            <button
              onClick={() => { setActiveTab("login"); setMessage(null); }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === "login"
                  ? "bg-card text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LogIn size={16} /> Sign In
            </button>
            <button
              onClick={() => { setActiveTab("register"); setMessage(null); }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === "register"
                  ? "bg-card text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus size={16} /> Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            
            {activeTab === "register" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                    placeholder="Adebayo Collins"
                    required
                  />
                </div>                 <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80" htmlFor="university">
                    University / Institution
                  </label>
                  <select
                    id="university"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium text-foreground dark:bg-zinc-900"
                    required
                  >
                    {NIGERIAN_UNIVERSITIES.map((uni) => (
                      <option key={uni} value={uni} className="bg-card text-foreground">
                        {uni}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail size={18} className="text-muted-foreground" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-foreground/5 border border-border rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Key size={18} className="text-muted-foreground" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-foreground/5 border border-border rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Notification Banner */}
            {message && (
              <div className={`p-4 rounded-xl border flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300 ${
                message.type === "success" 
                  ? "bg-green-500/10 border-green-500/20 text-green-500" 
                  : message.type === "error"
                  ? "bg-red-500/10 border-red-500/20 text-red-500"
                  : "bg-primary/10 border-primary/20 text-primary"
              }`}>
                {message.type === "success" && <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />}
                {message.type === "error" && <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />}
                {message.type === "info" && <Info size={18} className="mt-0.5 flex-shrink-0" />}
                <p className="text-xs font-semibold leading-normal">{message.text}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && !message?.text.includes("Launching") ? (
                <Loader2 size={16} className="animate-spin" />
              ) : activeTab === "login" ? (
                "Log In Account"
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
