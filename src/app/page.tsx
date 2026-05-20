"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Zap, WifiOff, Sparkles, ArrowUpRight } from "lucide-react";

export default function Home() {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check if user has a standard Supabase session or a demo session
    const isDemo = document.cookie.includes("passam_demo_session=true");
    setTimeout(() => {
      setHasSession(isDemo);
    }, 0);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 md:p-8 relative overflow-hidden">
      {/* Decorative Blur Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      <div className="max-w-4xl w-full text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative z-10">
        
        {/* Dynamic Badge */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider glow-primary mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            Optimized for low-bandwidth 3G networks
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tight text-foreground leading-[1.1]">
            Ace your exams with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-indigo-400 drop-shadow-sm">PassAm</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            The personalized offline-first AI tutor tailored for Nigerian universities. Built to deliver lightning responses, auto-curated flashcards, and high-performance study aids.
          </p>
        </div>

        {/* Feature Cards Grids */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="glass p-6 rounded-3xl flex flex-col items-center text-center space-y-4 hover-glide border border-border/50 group">
            <div className="p-3.5 bg-primary/10 rounded-2xl text-primary glow-primary group-hover:scale-110 transition-transform">
              <Zap size={26} />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-xl">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Optimized for instant, low-latency explanations even on highly congested mobile networks.</p>
            </div>
          </div>
          
          <div className="glass p-6 rounded-3xl flex flex-col items-center text-center space-y-4 hover-glide border border-border/50 group">
            <div className="p-3.5 bg-accent/10 rounded-2xl text-accent glow-accent group-hover:scale-110 transition-transform">
              <BookOpen size={26} />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-xl">Smart Flashcards</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Instantly generate structured syllabus-based active recall cards using our advanced AI compiler.</p>
            </div>
          </div>
          
          <div className="glass p-6 rounded-3xl flex flex-col items-center text-center space-y-4 hover-glide border border-border/50 group">
            <div className="p-3.5 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform" style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)' }}>
              <WifiOff size={26} />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-xl">Offline First</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Aggressive PWA service worker caching ensures materials are always ready.</p>
            </div>
          </div>
        </div>

        {/* Dynamic Action Button */}
        <div className="pt-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
          {hasSession ? (
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/95 hover:to-accent/95 text-primary-foreground px-10 py-5 rounded-2xl font-bold transition-all hover:scale-[1.03] active:scale-95 shadow-xl shadow-primary/20 hover:shadow-primary/35 cursor-pointer text-lg"
            >
              Enter Student Dashboard
              <ArrowRight size={22} />
            </Link>
          ) : (
            <>
              <Link 
                href="/login"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/95 hover:to-accent/95 text-primary-foreground px-10 py-5 rounded-2xl font-bold transition-all hover:scale-[1.03] active:scale-95 shadow-xl shadow-primary/20 hover:shadow-primary/35 cursor-pointer text-lg"
              >
                Start Learning Now
                <Sparkles size={20} className="animate-pulse" />
              </Link>
              <Link 
                href="/login"
                className="inline-flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 text-foreground border border-border px-8 py-5 rounded-2xl font-semibold transition-all hover:scale-[1.03] active:scale-95 cursor-pointer text-lg"
              >
                Sign In Portal <ArrowUpRight size={20} />
              </Link>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
