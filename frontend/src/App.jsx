import { useState } from "react";
import { HashRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import CalendarView from "./pages/CalendarView";
import MealPlanning from "./pages/MealPlanning";
import SharedLists from "./pages/SharedLists";
import SettingsPage from "./pages/SettingsPage";
import { theme } from "./styles/theme";

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        fontFamily: theme.fonts.family,
        background: theme.colors.background,
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <Sidebar activePath={location.pathname} onNavigate={navigate} />
      <Routes>
        <Route path="/" element={<CalendarView />} />
        <Route path="/meals" element={<MealPlanning />} />
        <Route path="/lists" element={<SharedLists />} />
        {/* Placeholder routes for future features */}
        <Route path="/tasks" element={<PlaceholderPage title="✅ Tasks" subtitle="Coming soon" />} />
        <Route path="/photos" element={<PlaceholderPage title="📸 Photos" subtitle="Coming soon" />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}

function PlaceholderPage({ title, subtitle }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      color: theme.colors.textMuted, fontFamily: theme.fonts.family,
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{title}</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{subtitle}</div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  );
}
