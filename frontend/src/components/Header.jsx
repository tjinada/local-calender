import { useState, useEffect } from "react";
import { theme } from "../styles/theme";
import WeatherWidget from "./WeatherWidget";

function useCurrentTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);
  return time.toLocaleString("default", { hour: "numeric", minute: "2-digit" }).toLowerCase();
}

export default function Header({ title, leftContent, rightContent, familyName }) {
  const currentTime = useCurrentTime();

  return (
    <div
      style={{
        height: theme.layout.headerHeight,
        minHeight: theme.layout.headerHeight,
        background: "white",
        borderBottom: `1px solid ${theme.colors.border}`,
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "0 24px",
        fontFamily: theme.fonts.family,
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {leftContent || (
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: theme.colors.textPrimary, letterSpacing: "-0.02em" }}>
            {title}
          </h1>
        )}
      </div>

      {/* Center — Family name + time + weather */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: theme.colors.textPrimary }}>
          {familyName || "Family Hub"}
        </span>
        <span style={{ fontSize: 15, fontWeight: 600, color: theme.colors.textMuted }}>
          {currentTime}
        </span>
        <WeatherWidget />
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, justifyContent: "flex-end" }}>
        {rightContent}
      </div>
    </div>
  );
}
