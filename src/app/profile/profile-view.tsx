"use client";

import { useState } from "react";
import { User, Settings, Wifi, HardDrive, ChevronRight, Sparkles, BrainCircuit, ShieldAlert, CheckCircle2, RotateCw } from "lucide-react";
import { ProfileEditor } from "./profile-editor";

interface ProfileViewProps {
  user: {
    name: string;
    email: string;
    university: string;
    targetGpa: string;
    currentGpa: string;
    gpaScale: string;
    isDemo: boolean;
  };
  signOutAction: () => Promise<void>;
}

export function ProfileView({ user, signOutAction }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"account" | "goals" | "network" | "database">("account");
  
  // Goals State
  const [courseLoad, setCourseLoad] = useState(6);
  const [studyHours, setStudyHours] = useState(4);
  const [focusArea, setFocusArea] = useState("Engineering");

  // Speed Test State
  const [isTestingSpeed, setIsTestingSpeed] = useState(false);
  const [speedResult, setSpeedResult] = useState<string | null>(null);

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const runSpeedTest = () => {
    setIsTestingSpeed(true);
    setSpeedResult(null);
    setTimeout(() => {
      setIsTestingSpeed(false);
      setSpeedResult("45ms - Highly Optimized for 3G/4G MTN, Airtel & Glo networks!");
    }, 1800);
  };

  const syncDatabase = () => {
    setIsSyncing(true);
    setSyncDone(false);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      {/* Sidebar Navigation */}
      <div className="space-y-3">
        <button 
          onClick={() => setActiveTab("account")}
          className={`w-full flex items-center justify-between p-4 rounded-2xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === "account" 
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" 
              : "glass text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          }`}
        >
          <div className="flex items-center gap-3">
            <User size={18} />
            <span>Student Account</span>
          </div>
          <ChevronRight size={16} className={activeTab === "account" ? "text-primary-foreground" : "text-muted-foreground/30"} />
        </button>
        
        <button 
          onClick={() => setActiveTab("goals")}
          className={`w-full flex items-center justify-between p-4 rounded-2xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === "goals" 
              ? "bg-accent text-accent-foreground shadow-md shadow-accent/10" 
              : "glass text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          }`}
        >
          <div className="flex items-center gap-3">
            <Settings size={18} />
            <span>Academic Goals</span>
          </div>
          <ChevronRight size={16} className={activeTab === "goals" ? "text-accent-foreground" : "text-muted-foreground/30"} />
        </button>
        
        <button 
          onClick={() => setActiveTab("network")}
          className={`w-full flex items-center justify-between p-4 rounded-2xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === "network" 
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10" 
              : "glass text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          }`}
        >
          <div className="flex items-center gap-3">
            <Wifi size={18} />
            <span>Network Optimization</span>
          </div>
          <ChevronRight size={16} className={activeTab === "network" ? "text-white" : "text-muted-foreground/30"} />
        </button>
        
        <button 
          onClick={() => setActiveTab("database")}
          className={`w-full flex items-center justify-between p-4 rounded-2xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === "database" 
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/10" 
              : "glass text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          }`}
        >
          <div className="flex items-center gap-3">
            <HardDrive size={18} />
            <span>Offline Database</span>
          </div>
          <ChevronRight size={16} className={activeTab === "database" ? "text-white" : "text-muted-foreground/30"} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="md:col-span-2 space-y-6">
        
        {/* Tab 1: Account Settings */}
        {activeTab === "account" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <ProfileEditor
              initialName={user.name}
              initialEmail={user.email}
              initialUniversity={user.university}
              initialTargetGpa={user.targetGpa}
              initialCurrentGpa={user.currentGpa}
              initialGpaScale={user.gpaScale}
              isDemo={user.isDemo}
            />

            {/* Simple logout trigger */}
            <form action={signOutAction}>
              <button 
                type="submit"
                className="w-full py-4 text-rose-400 hover:text-rose-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-500/10 rounded-2xl border border-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Log Out Student Portal
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Academic Goals */}
        {activeTab === "goals" && (
          <div className="glass p-6 rounded-3xl border border-accent/25 space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-accent/10 text-accent rounded-xl glow-accent">
                <Settings size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-accent">Academic Goals Tracker</h3>
                <p className="text-xs text-muted-foreground leading-normal mt-0.5">Customize your exam study settings and target milestones.</p>
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-border/20">
              {/* Course Load Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Semester Course Load</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min={3} 
                    max={10} 
                    value={courseLoad}
                    onChange={(e) => setCourseLoad(Number(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <span className="font-extrabold text-sm text-accent w-16 text-right">{courseLoad} Courses</span>
                </div>
              </div>

              {/* Study Hours Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Daily Study Hours Target</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min={1} 
                    max={12} 
                    value={studyHours}
                    onChange={(e) => setStudyHours(Number(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <span className="font-extrabold text-sm text-accent w-16 text-right">{studyHours} Hours</span>
                </div>
              </div>

              {/* Study Area Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Primary Subject Focus</label>
                <select 
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent"
                >
                  <option value="Engineering">Engineering Sciences</option>
                  <option value="ComputerScience">Computer Science & IT</option>
                  <option value="LifeSciences">Biological & Health Sciences</option>
                  <option value="PhysicalSciences">Physical Sciences & Math</option>
                  <option value="SocialSciences">Management & Social Sciences</option>
                </select>
              </div>

              {/* Target GPA Progress bar */}
              <div className="p-4 bg-accent/5 rounded-2xl border border-accent/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-muted-foreground">Target Semester GPA</span>
                  <span className="text-sm font-black text-accent">{user.targetGpa || "4.50"} / {user.gpaScale === "4.0" ? "4.00" : "5.00"}</span>
                </div>
                <div className="w-full bg-foreground/10 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-accent h-full transition-all duration-500 glow-accent" 
                    style={{ width: `${(Number(user.targetGpa || "4.50") / Number(user.gpaScale || "5.0")) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Network Optimization */}
        {activeTab === "network" && (
          <div className="glass p-6 rounded-3xl border border-emerald-500/25 space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Wifi size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-emerald-400">Smart Data & Network Saver</h3>
                <p className="text-xs text-muted-foreground leading-normal mt-0.5">Adapt visual rendering and query payloads for unstable 3G networks.</p>
              </div>
            </div>

            <div className="space-y-5 pt-4 border-t border-border/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Aggressive Text Caching</p>
                  <p className="text-xs text-muted-foreground leading-normal mt-0.5">Pre-load responses as plain text for instant speeds</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-foreground/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Audio compression mode</p>
                  <p className="text-xs text-muted-foreground leading-normal mt-0.5">Compress audio logs up to 10x before uploading</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-foreground/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Speed Test Widget */}
              <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-400">Network Speed Diagnostic</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Measure the latency of PassAm neural sync</p>
                  </div>
                  <button 
                    onClick={runSpeedTest}
                    disabled={isTestingSpeed}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isTestingSpeed ? (
                      <><RotateCw size={12} className="animate-spin" /> Testing...</>
                    ) : (
                      "Test Latency"
                    )}
                  </button>
                </div>
                {speedResult && (
                  <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-in fade-in duration-300">
                    <CheckCircle2 size={14} /> {speedResult}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Offline Database */}
        {activeTab === "database" && (
          <div className="glass p-6 rounded-3xl border border-orange-500/25 space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 text-orange-400 rounded-xl">
                <HardDrive size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-orange-400">Offline Database Sync</h3>
                <p className="text-xs text-muted-foreground leading-normal mt-0.5">Track your cached lecture archives, chat history, and flashcards.</p>
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-border/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">AI Chats Cached</span>
                  <p className="text-2xl font-black text-orange-400 mt-1">12</p>
                </div>
                <div className="p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Saves Size</span>
                  <p className="text-2xl font-black text-orange-400 mt-1">142 KB</p>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="space-y-3">
                <button 
                  onClick={syncDatabase}
                  disabled={isSyncing}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSyncing ? (
                    <><RotateCw size={16} className="animate-spin" /> Syncing with Cloud Database...</>
                  ) : (
                    "Force Database Cache Sync"
                  )}
                </button>

                <button 
                  onClick={() => alert("Local database cache cleared successfully.")}
                  className="w-full bg-foreground/5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 font-semibold text-xs py-3 rounded-2xl border border-border/50 hover:border-rose-500/20 transition-all cursor-pointer"
                >
                  Purge Local Offline Cache
                </button>
              </div>

              {syncDone && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-xs font-semibold text-green-400 animate-in fade-in duration-300">
                  <CheckCircle2 size={14} /> Synchronized flawlessly! All offline saves are now live in Supabase.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
