"use client";

import { useEffect, useRef, useState } from "react";

type NetworkState = "offline" | "slow" | "back-online";

// Slow connection threshold: effective type 2g/slow-2g, or RTT > 800ms
function detectSlowConnection(): boolean {
  if (typeof navigator === "undefined") return false;
  // @ts-expect-error – NetworkInformation API not fully typed in TS
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return false;
  return (
    conn.effectiveType === "slow-2g" ||
    conn.effectiveType === "2g" ||
    conn.rtt > 800 ||
    conn.downlink < 0.5
  );
}

export function NetworkStatusBar() {
  const [state, setState] = useState<NetworkState | null>(null);
  const backOnlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Initial check
    if (!navigator.onLine) {
      setState("offline");
    } else if (detectSlowConnection()) {
      setState("slow");
    }

    function handleOnline() {
      if (backOnlineTimer.current) clearTimeout(backOnlineTimer.current);
      setState("back-online");
      // Auto-dismiss "Back online" after 3s
      backOnlineTimer.current = setTimeout(() => {
        setState(null);
      }, 3000);
    }

    function handleOffline() {
      if (backOnlineTimer.current) clearTimeout(backOnlineTimer.current);
      setState("offline");
    }

    // Poll for slow connection every 5s
    slowCheckInterval.current = setInterval(() => {
      if (!navigator.onLine) return;
      if (detectSlowConnection()) {
        setState((prev) => (prev === "offline" || prev === "back-online" ? prev : "slow"));
      } else {
        setState((prev) => (prev === "slow" ? null : prev));
      }
    }, 5000);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (backOnlineTimer.current) clearTimeout(backOnlineTimer.current);
      if (slowCheckInterval.current) clearInterval(slowCheckInterval.current);
    };
  }, []);

  useEffect(() => {
    if (state) {
      document.body.classList.add("has-network-status");
    } else {
      document.body.classList.remove("has-network-status");
    }
    return () => {
      document.body.classList.remove("has-network-status");
    };
  }, [state]);

  if (state === null) return null;

  const config = {
    "offline": {
      bg: "bg-[#1a1a1a]",
      icon: (
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
        </svg>
      ),
      text: "You're offline",
      subtext: "Changes will sync when you're back.",
      textColor: "text-white",
      subtextColor: "text-white/50",
      pulse: false,
    },
    "back-online": {
      bg: "bg-[#1DB954]",
      icon: (
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      ),
      text: "Back online",
      subtext: "Everything is synced.",
      textColor: "text-white",
      subtextColor: "text-white/70",
      pulse: false,
    },
    "slow": {
      bg: "bg-[#1a1a1a]",
      icon: (
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 6s4-2 11-2 11 2 11 2" />
          <path d="M5 10s3.5-1.5 7-1.5S19 10 19 10" />
          <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
        </svg>
      ),
      text: "Slow connection",
      subtext: "Things may take a moment to load.",
      textColor: "text-white/80",
      subtextColor: "text-white/40",
      pulse: true,
    },
  }[state];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-0 inset-x-0 z-50 mx-auto w-full max-w-3xl"
      style={{ animation: "networkSlideUp 0.25s cubic-bezier(0.16,1,0.3,1) forwards" }}
    >
      <div
        className={`${config.bg} flex w-full items-center justify-center gap-2 px-4 py-2`}
      >
        {/* Icon */}
        <span className={`${config.textColor} shrink-0`}>{config.icon}</span>

        {/* Single-line slim label */}
        <span className={`text-xs font-semibold tracking-wide ${config.textColor}`}>
          {config.text}
        </span>

        {/* Slow connection animated dots */}
        {config.pulse && (
          <div className="ml-auto flex items-center gap-1 shrink-0">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-white/30"
                style={{ animation: `slowPulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        )}

        {/* Offline: no dismiss; Back-online: auto dismisses */}
      </div>
    </div>
  );
}
