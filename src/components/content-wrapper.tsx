"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function ContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Read initial collapse state on mount
    setIsCollapsed(localStorage.getItem("passam_sidebar_collapsed") === "true");

    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setIsCollapsed(customEvent.detail);
    };

    window.addEventListener("sidebar-toggle", handleToggle);
    return () => window.removeEventListener("sidebar-toggle", handleToggle);
  }, []);

  // Don't apply structural margins/paddings on landing, login, and survey pages
  const isAuthPage = pathname === "/" || pathname === "/login" || pathname === "/survey";

  return (
    <main 
      className={`flex-1 pb-16 md:pb-0 relative z-10 transition-all duration-300 ${
        isAuthPage ? "" : "pt-16 md:pt-0"
      } ${
        isAuthPage ? "" : isCollapsed ? "md:pl-20" : "md:pl-64"
      }`}
    >
      <div className="max-w-7xl mx-auto h-full w-full">
        {children}
      </div>
    </main>
  );
}
