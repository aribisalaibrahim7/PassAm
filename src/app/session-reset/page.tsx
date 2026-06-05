"use client";

import { useEffect, useState } from "react";

/**
 * /session-reset
 *
 * This page is ONLY reached when the middleware detects an oversized Cookie header
 * (> 12 KB, i.e. 80% of Vercel's 16 KB limit). It runs entirely client-side so that
 * NO cookies are sent in the next request after the redirect.
 *
 * It does three things:
 *  1. Expires every cookie on this domain.
 *  2. Clears localStorage (contains demo arrays / survey data).
 *  3. Redirects to /login so the user can start a fresh, slim session.
 */
export default function SessionResetPage() {
  const [step, setStep] = useState<"clearing" | "done">("clearing");
  const [cleared, setCleared] = useState<string[]>([]);

  useEffect(() => {
    const deletedNames: string[] = [];

    // 1. Expire all cookies for this domain / path
    document.cookie.split(";").forEach((cookiePart) => {
      const name = cookiePart.split("=")[0].trim();
      if (!name) return;
      // Expire on all common paths
      ["/", "/dashboard", "/study", "/assessments", "/profile", "/resources"].forEach((path) => {
        document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
      });
      deletedNames.push(name);
    });

    // 2. Clear localStorage keys managed by PassAm
    const lsKeys = [
      "passam_demo_profile",
      "passam_demo_survey",
      "passam_demo_arrays",
      "passam_chat_sessions",
    ];
    lsKeys.forEach((key) => {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    });

    setCleared(deletedNames);
    setStep("done");

    // 3. Redirect after a brief pause so the user can read the message
    const t = setTimeout(() => {
      window.location.replace("/login");
    }, 2500);

    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
        padding: "2rem",
        textAlign: "center",
        gap: "1.25rem",
      }}
    >
      {step === "clearing" ? (
        <>
          <div
            style={{
              width: 56,
              height: 56,
              border: "4px solid rgba(255,255,255,0.2)",
              borderTopColor: "#a78bfa",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            Clearing session data…
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", margin: 0 }}>
            Your previous session had oversized headers. Resetting now.
          </p>
        </>
      ) : (
        <>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(167,139,250,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
            }}
          >
            ✓
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            Session reset complete
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", margin: 0, maxWidth: 420 }}>
            Cleared <strong>{cleared.length}</strong> cookie
            {cleared.length !== 1 ? "s" : ""} and local storage. Redirecting
            you to login&hellip;
          </p>
          <div
            style={{
              width: 200,
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "linear-gradient(90deg,#a78bfa,#60a5fa)",
                animation: "progress 2.5s linear forwards",
              }}
            />
            <style>{`@keyframes progress{from{width:0}to{width:100%}}`}</style>
          </div>
        </>
      )}
    </div>
  );
}
