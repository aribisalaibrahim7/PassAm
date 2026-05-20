"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Library, User, BrainCircuit, Sparkles, Menu, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export function Navigation() {
  const pathname = usePathname();
  const [userState, setUserState] = useState<{ name: string; email: string; isDemo: boolean } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      // 1. Check Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserState({
            name: user.user_metadata?.name || user.email?.split("@")[0] || "Student",
            email: user.email || "student@university.edu.ng",
            isDemo: false,
          });
          return;
        }
      } catch (err) {
        console.error("Supabase user get error:", err);
      }

      // 2. Check Demo Cookie
      const isDemo = document.cookie.includes("passam_demo_session=true");
      if (isDemo) {
        setUserState({
          name: "Adebayo Collins",
          email: "demo.student@unilag.edu.ng",
          isDemo: true,
        });
      } else {
        setUserState(null);
      }
    }

    setTimeout(() => {
      checkUser();
    }, 0);
    
    // Subscribe to auth state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => {
        checkUser();
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  useEffect(() => {
    const collapsed = localStorage.getItem("passam_sidebar_collapsed") === "true";
    setIsCollapsed(collapsed);
    if (collapsed) {
      document.documentElement.classList.add("sidebar-collapsed");
    } else {
      document.documentElement.classList.remove("sidebar-collapsed");
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("passam_sidebar_collapsed", String(nextState));
    if (nextState) {
      document.documentElement.classList.add("sidebar-collapsed");
    } else {
      document.documentElement.classList.remove("sidebar-collapsed");
    }
    // Dispatch custom event to notify content-wrapper layout dynamically
    window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: nextState }));
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Study Hub", href: "/study", icon: MessageSquare },
    { name: "Assessments", href: "/assessments", icon: BrainCircuit },
    { name: "Library", href: "/resources", icon: Library },
    { name: "Profile", href: "/profile", icon: User },
  ];

  // Don't show full navigation sidebar/bottom nav on root/landing page and login page
  const isAuthPage = pathname === "/" || pathname === "/login";
  if (isAuthPage) return null;

  const initials = userState
    ? userState.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
    : "ST";

  return (
    <>
      {/* Mobile Top Header Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 glass border-b border-border/30 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            PassAm
          </h1>
          {userState?.isDemo && (
            <span className="text-[9px] uppercase font-black bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full flex items-center gap-0.5 glow-primary">
              <Sparkles size={8} className="animate-pulse" /> Demo
            </span>
          )}
        </div>
        
        <button 
          onClick={() => setMobileDrawerOpen(true)}
          className="p-2 text-foreground/80 hover:text-foreground hover:bg-foreground/5 rounded-xl transition-all cursor-pointer"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile Drawer (Slide-out Overlay Drawer) */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end">
          {/* Blurred Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileDrawerOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] h-full bg-card/95 backdrop-blur-md border-l border-border/40 p-6 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out transform translate-x-0 animate-in slide-in-from-right">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    PassAm Menu
                  </h2>
                  {userState?.isDemo && (
                    <span className="text-[8px] uppercase font-bold bg-primary/25 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full">
                      Demo
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Navigation Links */}
              <nav className="mt-6 space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 glow-primary" 
                          : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                      }`}
                    >
                      <Icon size={18} className={isActive ? "text-primary-foreground" : "text-primary/70"} />
                      <span className="font-semibold text-sm">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            {/* User Info & System Health */}
            <div className="space-y-4">
              {userState && (
                <div className="p-3 rounded-2xl glass border border-border/30 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs glow-primary">
                    {initials}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <h4 className="font-bold text-xs truncate">{userState.name}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">{userState.email}</p>
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-border/30 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Offline Engine</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-green-500">Ready</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" style={{ boxShadow: '0 0 8px rgba(34, 197, 94, 0.4)' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col h-screen fixed top-0 left-0 border-r border-border/40 glass z-50 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}>
        <div className="flex flex-col shrink-0">
          <div className={`p-6 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
            {!isCollapsed ? (
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent animate-pulse">
                  PassAm
                </h1>
                {userState?.isDemo && (
                  <span className="text-[9px] uppercase font-black bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full flex items-center gap-0.5 glow-primary">
                    <Sparkles size={8} className="animate-pulse" /> Demo
                  </span>
                )}
              </div>
            ) : (
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-black text-sm glow-primary">
                PA
              </div>
            )}
            
            {/* Collapse Toggle Button */}
            <button
              onClick={toggleSidebar}
              className={`p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-foreground/5 transition-colors cursor-pointer`}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu size={16} />
            </button>
          </div>
          {!isCollapsed && (
            <p className="text-xs text-muted-foreground px-6 -mt-3 font-semibold">Offline-First Student Portal</p>
          )}
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center rounded-xl transition-all duration-300 relative group overflow-hidden ${
                  isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
                } ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 glow-primary" 
                    : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r-full"></span>
                )}
                <Icon size={18} className={`transition-transform duration-300 group-hover:scale-110 shrink-0 ${
                  isActive ? "text-primary-foreground" : "text-primary/70"
                }`} />
                {!isCollapsed && (
                  <span className="font-semibold text-sm">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Quick Info Drawer */}
        {userState && (
          <div className={`mx-4 mb-4 rounded-2xl glass border border-border/30 flex items-center transition-all duration-300 ${
            isCollapsed ? "justify-center p-2" : "gap-3 p-4 hover:border-primary/20"
          }`}>
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm glow-primary shrink-0">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden flex-1">
                <h4 className="font-bold text-xs truncate leading-snug">{userState.name}</h4>
                <p className="text-[10px] text-muted-foreground truncate leading-normal">{userState.email}</p>
              </div>
            )}
          </div>
        )}

        {/* System Health Offline status */}
        <div className={`border-t border-border/30 transition-all duration-300 ${isCollapsed ? "p-4 flex justify-center" : "p-6"}`}>
          {isCollapsed ? (
            <div className="relative group cursor-pointer" title="Offline Engine Ready">
              <div className="w-3.5 h-3.5 rounded-full bg-green-500 animate-pulse" style={{ boxShadow: '0 0 10px rgba(34, 197, 94, 0.6)' }}></div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Offline Engine</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-green-500">Ready</span>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" style={{ boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)' }}></div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation (Preserved and fully supported) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full glass border-t border-border/30 z-30 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center w-full h-full space-y-1 relative group"
              >
                {isActive && (
                  <span className="absolute -top-3 w-10 h-1 bg-primary rounded-b-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"></span>
                )}
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary/10' : ''}`}>
                  <Icon 
                    size={20} 
                    className={`transition-all duration-300 ${
                      isActive ? "text-primary scale-110" : "text-foreground/60 group-hover:text-foreground/80"
                    }`} 
                  />
                </div>
                <span className={`text-[10px] font-bold transition-colors duration-300 ${
                  isActive ? "text-primary" : "text-foreground/60"
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
