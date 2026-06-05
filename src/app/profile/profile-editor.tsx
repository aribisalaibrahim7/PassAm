"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { setPassamCookie, buildCookieProfile } from "@/utils/cookies";
import { Bookmark, Sparkles, Check, Edit2, X } from "lucide-react";

interface ProfileEditorProps {
  initialName: string;
  initialEmail: string;
  initialUniversity: string;
  initialTargetGpa: string;
  initialCurrentGpa: string;
  initialGpaScale: string;
  isDemo: boolean;
}

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

export function ProfileEditor({
  initialName,
  initialEmail,
  initialUniversity,
  initialTargetGpa,
  initialCurrentGpa,
  initialGpaScale,
  isDemo,
}: ProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [university, setUniversity] = useState(initialUniversity);
  const [targetGpa, setTargetGpa] = useState(initialTargetGpa);
  const [currentGpa, setCurrentGpa] = useState(initialCurrentGpa);
  const [gpaScale, setGpaScale] = useState(initialGpaScale || "5.0");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Final boundary check before saving
    let finalCurrentGpa = currentGpa;
    let finalTargetGpa = targetGpa;
    if (gpaScale === "4.0") {
      if (Number(finalCurrentGpa) > 4.0) finalCurrentGpa = "4.00";
      if (Number(finalTargetGpa) > 4.0) finalTargetGpa = "4.00";
    } else {
      if (Number(finalCurrentGpa) > 5.0) finalCurrentGpa = "5.00";
      if (Number(finalTargetGpa) > 5.0) finalTargetGpa = "5.00";
    }

    try {
      if (isDemo) {
        // Save full profile (including runtime metrics) to localStorage
        const profileData = { name, university, targetGpa: finalTargetGpa, currentGpa: finalCurrentGpa, gpaScale };
        localStorage.setItem("passam_demo_profile", JSON.stringify(profileData));
        // Cookie stores identity only (abbreviated keys ≈ 150 B) — no runtime metrics
        setPassamCookie("passam_demo_profile", JSON.stringify(buildCookieProfile(profileData)), 7);

        setMessage({ text: "Demo profile updated successfully!", type: "success" });
        
        // Reload to sync page headers and layout initials
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        // Save to real Supabase auth metadata
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
          data: {
            name,
            university,
            target_gpa: finalTargetGpa,
            current_gpa: finalCurrentGpa,
            gpa_scale: gpaScale,
          },
        });

        if (error) {
          throw error;
        }

        setMessage({ text: "Profile updated successfully!", type: "success" });
      }
      setIsEditing(false);
    } catch (err: unknown) {
      console.error("Profile save error:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to save profile.";
      setMessage({ text: errMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-6 md:p-8 rounded-3xl border border-border/50 hover:border-primary/20 transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
      
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl border text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 duration-300 ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          {message.type === "success" ? <Check size={16} /> : <X size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl glow-primary">
            {initials}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{name}</h2>
              {isDemo && (
                <span className="text-[9px] uppercase font-black bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Sparkles size={8} /> Demo
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate font-medium mt-0.5">{initialEmail}</p>
          </div>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg border border-border transition-colors text-muted-foreground hover:text-foreground"
          >
            <Edit2 size={16} />
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-border/20">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider" htmlFor="edit-name">
              Full Name
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-xl focus:outline-none focus:border-primary/50 transition-colors font-medium text-foreground"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider" htmlFor="edit-university">
              Institution
            </label>
            <select
              id="edit-university"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-xl focus:outline-none focus:border-primary/50 transition-colors font-medium text-foreground dark:bg-zinc-900"
              required
            >
              {NIGERIAN_UNIVERSITIES.map((uni) => (
                <option key={uni} value={uni} className="bg-card text-foreground">
                  {uni}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider" htmlFor="edit-gpa-scale">
              GPA Scale
            </label>
            <select
              id="edit-gpa-scale"
              value={gpaScale}
              onChange={(e) => {
                const newScale = e.target.value;
                setGpaScale(newScale);
                // Cap value immediately to prevent boundary validation errors on save
                if (newScale === "4.0") {
                  if (Number(currentGpa) > 4.0) setCurrentGpa("4.00");
                  if (Number(targetGpa) > 4.0) setTargetGpa("4.00");
                }
              }}
              className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-xl focus:outline-none focus:border-primary/50 transition-colors font-medium text-foreground dark:bg-zinc-900"
              required
            >
              <option value="5.0" className="bg-card text-foreground">5.0 (Standard Nigerian Scale)</option>
              <option value="4.0" className="bg-card text-foreground">4.0 (US / Private Scale)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider" htmlFor="edit-current-gpa">
                Current CGPA
              </label>
              <input
                id="edit-current-gpa"
                type="number"
                step="0.01"
                min="0.00"
                max={gpaScale === "4.0" ? "4.00" : "5.00"}
                value={currentGpa}
                onChange={(e) => setCurrentGpa(e.target.value)}
                className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-xl focus:outline-none focus:border-primary/50 transition-colors font-medium text-foreground"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider" htmlFor="edit-gpa">
                Target CGPA
              </label>
              <input
                id="edit-gpa"
                type="number"
                step="0.01"
                min="0.00"
                max={gpaScale === "4.0" ? "4.00" : "5.00"}
                value={targetGpa}
                onChange={(e) => setTargetGpa(e.target.value)}
                className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-xl focus:outline-none focus:border-primary/50 transition-colors font-medium text-foreground"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl transition-transform active:scale-95 hover:bg-primary/95 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Profile Details"}
            </button>
            <button
              type="button"
              onClick={() => {
                setName(initialName);
                setUniversity(initialUniversity);
                setTargetGpa(initialTargetGpa);
                setCurrentGpa(initialCurrentGpa);
                setGpaScale(initialGpaScale);
                setIsEditing(false);
              }}
              className="px-6 py-3 bg-foreground/5 hover:bg-foreground/10 font-bold text-sm rounded-xl transition-colors border border-border"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t border-border/20">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Institution</p>
            <p className="font-bold text-sm text-foreground">{university}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">GPA Scale</p>
            <p className="font-bold text-sm text-foreground">{gpaScale === "4.0" ? "4.0 (US/Private)" : "5.0 (Nigerian)"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Current CGPA</p>
            <p className="font-bold text-sm text-foreground">{currentGpa} / {gpaScale === "4.0" ? "4.00" : "5.00"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Target CGPA</p>
            <p className="font-bold text-sm text-primary flex items-center gap-1">
              {targetGpa} <Bookmark size={14} className="text-accent" />
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
