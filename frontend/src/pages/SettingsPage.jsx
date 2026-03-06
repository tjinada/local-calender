import { useState, useEffect } from "react";
import { apiFetch } from "../hooks/useApi";
import { usePush } from "../hooks/usePush";
import { theme } from "../styles/theme";
import Header from "../components/Header";

export default function SettingsPage() {
  const [members, setMembers] = useState([]);
  const [googleAuth, setGoogleAuth] = useState({ authenticated: false });
  const [googleCalendars, setGoogleCalendars] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [settings, setSettings] = useState({});
  const { supported: pushSupported, subscribed: pushSubscribed, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePush();

  useEffect(() => {
    apiFetch("/members").then(setMembers).catch(console.error);
    apiFetch("/calendar/auth/status").then(setGoogleAuth).catch(console.error);
    apiFetch("/settings").then(setSettings).catch(console.error);
  }, []);

  // Load Google calendars once authenticated
  useEffect(() => {
    if (googleAuth.authenticated) {
      apiFetch("/calendar/calendars").then(setGoogleCalendars).catch(console.error);
    }
  }, [googleAuth.authenticated]);

  const handleGoogleConnect = () => {
    window.location.href = "/api/calendar/auth";
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage("");
    try {
      await apiFetch("/calendar/sync");
      setSyncMessage("Sync complete!");
    } catch (err) {
      setSyncMessage("Sync failed: " + err.message);
    }
    setSyncing(false);
  };

  const linkCalendar = async (memberId, calendarId) => {
    try {
      // Send empty string as null to properly unlink
      const updated = await apiFetch(`/members/${memberId}`, {
        method: "PUT",
        body: { google_calendar_id: calendarId && calendarId.length > 0 ? calendarId : null },
      });
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
    } catch (err) {
      console.error(err);
    }
  };

  const updateMember = async (memberId, field, value) => {
    try {
      const updated = await apiFetch(`/members/${memberId}`, {
        method: "PUT",
        body: { [field]: value },
      });
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
    } catch (err) {
      console.error(err);
    }
  };

  const MEMBER_COLORS = ["#E8927C", "#7CAABD", "#A3B88C", "#D4A574", "#B48EAD", "#E6C86E"];
  const MEMBER_LIGHT_BGS = ["#FDF0ED", "#EDF5F8", "#F0F5EA", "#FBF3EB", "#F3EDF5", "#FBF6E3"];

  const addMember = async () => {
    const idx = members.length;
    const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];
    const lightBg = MEMBER_LIGHT_BGS[idx % MEMBER_LIGHT_BGS.length];
    try {
      const created = await apiFetch("/members", {
        method: "POST",
        body: { name: `Member ${idx + 1}`, color, light_bg: lightBg, initial: "M" },
      });
      setMembers((prev) => [...prev, created]);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMember = async (memberId) => {
    try {
      await apiFetch(`/members/${memberId}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      console.error(err);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const updated = await apiFetch("/settings", { method: "PUT", body: { [key]: value } });
      setSettings(updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="⚙️ Settings" familyName={settings.family_name} />

      <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>

          {/* Display */}
          <Section title="Display">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: theme.colors.textPrimary, minWidth: 100 }}>Family Name:</label>
              <input
                value={settings.family_name || ""}
                onChange={(e) => setSettings((s) => ({ ...s, family_name: e.target.value }))}
                onBlur={(e) => updateSetting("family_name", e.target.value)}
                placeholder="e.g. The Smiths"
                style={inputStyle}
              />
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 11, color: theme.colors.textMuted }}>This appears in the center of the header bar on all screens.</p>
          </Section>

          {/* Google Calendar Section */}
          <Section title="Google Calendar">
            {!googleAuth.authenticated ? (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, color: theme.colors.textMuted, fontWeight: 600 }}>
                    Connect your Google account to sync calendar events for all family members.
                  </p>
                </div>
                <button onClick={handleGoogleConnect} style={primaryBtnStyle}>
                  Connect Google Calendar
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", background: "#4CAF50",
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: theme.colors.textPrimary }}>
                    Google Calendar connected
                  </span>
                  <div style={{ flex: 1 }} />
                  <button onClick={handleSync} disabled={syncing} style={{
                    ...secondaryBtnStyle,
                    opacity: syncing ? 0.6 : 1,
                  }}>
                    {syncing ? "Syncing..." : "🔄 Sync Now"}
                  </button>
                </div>
                {syncMessage && (
                  <div style={{
                    padding: "8px 14px", borderRadius: 8, marginBottom: 16,
                    background: syncMessage.includes("failed") ? "#FDE2E4" : "#D4EDDA",
                    color: syncMessage.includes("failed") ? "#C0392B" : "#2D6A4F",
                    fontSize: 12, fontWeight: 600,
                  }}>{syncMessage}</div>
                )}

                {/* Link calendars to members */}
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 10 }}>
                  Link calendars to family members:
                </div>
                {members.map((member) => (
                  <div key={member.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", marginBottom: 8, borderRadius: 12,
                    background: "#F7F6F2",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: member.color, color: "white", fontSize: 13, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>{member.initial}</div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: theme.colors.textPrimary, minWidth: 70 }}>
                      {member.name}
                    </span>
                    <select
                      value={member.google_calendar_id && googleCalendars.some(c => c.id === member.google_calendar_id) ? member.google_calendar_id : ""}
                      onChange={(e) => linkCalendar(member.id, e.target.value)}
                      style={{
                        flex: 1, padding: "8px 12px", borderRadius: 8,
                        border: "1.5px solid #E0DFD9", fontSize: 12,
                        fontFamily: "inherit", color: theme.colors.textPrimary,
                        background: "white", outline: "none",
                      }}
                    >
                      <option value="">— Not linked —</option>
                      {googleCalendars.map((cal) => (
                        <option key={cal.id} value={cal.id}>
                          {cal.name} {cal.primary ? "(Primary)" : ""}
                        </option>
                      ))}
                    </select>
                    {member.google_calendar_id ? (
                      <span style={{ fontSize: 11, color: "#4CAF50", fontWeight: 700 }}>✓ Linked</span>
                    ) : (
                      <span style={{ fontSize: 11, color: theme.colors.textMuted, fontWeight: 600 }}>Not linked</span>
                    )}
                  </div>
                ))}
                <p style={{ margin: "12px 0 0", fontSize: 11, color: theme.colors.textMuted }}>
                  Events sync automatically every 5 minutes, or click "Sync Now" for instant sync.
                </p>
              </>
            )}
          </Section>

          {/* Family Members */}
          <Section title="Family Members">
            {members.map((member) => (
              <div key={member.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", marginBottom: 8, borderRadius: 12,
                background: "white", border: `1px solid ${theme.colors.border}`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: member.color, color: "white", fontSize: 16, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>{member.initial}</div>
                <div style={{ flex: 1 }}>
                  <input
                    value={member.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, name: newName, initial: newName.charAt(0).toUpperCase() } : m));
                    }}
                    onBlur={(e) => {
                      const name = e.target.value;
                      updateMember(member.id, "name", name);
                      updateMember(member.id, "initial", name.charAt(0).toUpperCase());
                    }}
                    style={{
                      border: "none", background: "transparent", fontSize: 14, fontWeight: 700,
                      color: theme.colors.textPrimary, fontFamily: "inherit", outline: "none", width: "100%",
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 11, color: theme.colors.textMuted, fontWeight: 600 }}>Color:</label>
                  <input
                    type="color"
                    value={member.color}
                    onChange={(e) => updateMember(member.id, "color", e.target.value)}
                    style={{ width: 28, height: 28, border: "none", borderRadius: 6, cursor: "pointer", padding: 0 }}
                  />
                </div>
                {members.length > 1 && (
                  <button onClick={() => deleteMember(member.id)} style={{
                    width: 32, height: 32, borderRadius: 8, border: "1px solid #F0B3B8",
                    background: "#FDE2E4", color: "#C0392B", fontSize: 14, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>✕</button>
                )}
              </div>
            ))}
            <button onClick={addMember} style={{
              width: "100%", padding: "12px 0", borderRadius: 12,
              border: "2px dashed #D0CFC9", background: "transparent",
              fontSize: 13, fontWeight: 700, color: theme.colors.textMuted,
              cursor: "pointer", fontFamily: "inherit", marginTop: 8,
            }}>+ Add Family Member</button>
          </Section>

          {/* Weather */}
          <Section title="Weather">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: theme.colors.textPrimary, minWidth: 80 }}>Location:</label>
              <input
                value={settings.weather_location || ""}
                onChange={(e) => setSettings((s) => ({ ...s, weather_location: e.target.value }))}
                onBlur={(e) => updateSetting("weather_location", e.target.value)}
                placeholder="e.g. Toronto,CA"
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: theme.colors.textPrimary, minWidth: 80 }}>Units:</label>
              <select
                value={settings.temperature_unit || "metric"}
                onChange={(e) => updateSetting("temperature_unit", e.target.value)}
                style={{ ...inputStyle, width: 200 }}
              >
                <option value="metric">Celsius (°C)</option>
                <option value="imperial">Fahrenheit (°F)</option>
              </select>
            </div>
          </Section>

          {/* Push Notifications */}
          <Section title="Push Notifications">
            {!pushSupported ? (
              <p style={{ margin: 0, fontSize: 13, color: theme.colors.textMuted }}>
                Push notifications are not supported in this browser.
              </p>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: theme.colors.textPrimary }}>
                    {pushSubscribed ? "Notifications enabled" : "Notifications disabled"}
                  </div>
                  <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>
                    Get alerts for new events and list changes on this device
                  </div>
                </div>
                <button
                  onClick={pushSubscribed ? pushUnsubscribe : pushSubscribe}
                  style={pushSubscribed ? secondaryBtnStyle : primaryBtnStyle}
                >
                  {pushSubscribed ? "Disable" : "Enable"}
                </button>
              </div>
            )}
          </Section>

          {/* About */}
          <Section title="About">
            <p style={{ margin: 0, fontSize: 13, color: theme.colors.textMuted, lineHeight: 1.6 }}>
              <strong style={{ color: theme.colors.textPrimary }}>Family Hub v1.0</strong>
              <br />A self-hosted family calendar, meal planner, and list manager.
              <br />Inspired by Skylight Calendar.
            </p>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{
        fontSize: 16, fontWeight: 800, color: theme.colors.textPrimary,
        margin: "0 0 14px", paddingBottom: 10,
        borderBottom: `1px solid ${theme.colors.border}`,
      }}>{title}</h2>
      {children}
    </div>
  );
}

const primaryBtnStyle = {
  padding: "9px 18px", borderRadius: 10, border: "none",
  background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
  color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
  fontFamily: "'Nunito', sans-serif", boxShadow: "0 2px 8px rgba(124,170,189,0.3)",
};
const secondaryBtnStyle = {
  padding: "9px 18px", borderRadius: 10,
  border: "1px solid #E0DFD9", background: "white",
  color: theme.colors.textPrimary, fontSize: 12, fontWeight: 700,
  cursor: "pointer", fontFamily: "'Nunito', sans-serif",
};
const inputStyle = {
  flex: 1, padding: "8px 12px", borderRadius: 8,
  border: "1.5px solid #E0DFD9", fontSize: 12,
  fontFamily: "'Nunito', sans-serif", color: theme.colors.textPrimary,
  outline: "none", boxSizing: "border-box",
};
