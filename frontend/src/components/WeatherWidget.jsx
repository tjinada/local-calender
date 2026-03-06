import { useState, useEffect } from "react";
import { apiFetch } from "../hooks/useApi";
import { theme } from "../styles/theme";

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    apiFetch("/weather")
      .then(setWeather)
      .catch(() => setWeather({ temp: "--", icon: "🌤️", condition: "" }));

    // Refresh every 15 minutes
    const interval = setInterval(() => {
      apiFetch("/weather").then(setWeather).catch(() => {});
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!weather) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px",
        background: "#F7F6F2",
        borderRadius: 12,
        fontFamily: theme.fonts.family,
      }}
    >
      <span style={{ fontSize: 20 }}>{weather.icon}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: theme.colors.textPrimary }}>
        {weather.temp}
      </span>
      <span style={{ fontSize: 11, color: theme.colors.textMuted, fontWeight: 600 }}>
        {weather.condition}
      </span>
    </div>
  );
}
