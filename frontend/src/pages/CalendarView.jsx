import { useState, useEffect, useMemo, useRef } from "react";
import { apiFetch } from "../hooks/useApi";
import { theme } from "../styles/theme";
import { getNDayDates, getWeekDates, formatHour, formatAMPM, formatTime } from "../utils/dates";
import Header from "../components/Header";

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6);
const HOUR_HEIGHT = 72; // bigger rows

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState("4-Day"); // "Day" | "4-Day" | "Week"
  const [navOffset, setNavOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({ title: "", member_id: "", date: "", startHour: 9, duration: 1 });
  const scrollRef = useRef(null);

  // Compute visible dates based on view mode
  const visibleDates = useMemo(() => {
    if (viewMode === "Day") return getNDayDates(1, navOffset);
    if (viewMode === "4-Day") return getNDayDates(4, navOffset);
    return getWeekDates("mon", navOffset);
  }, [viewMode, navOffset]);

  const numCols = visibleDates.length;
  const displayMonth = visibleDates[Math.floor(numCols / 2)]?.monthLong || "";
  const displayYear = visibleDates[Math.floor(numCols / 2)]?.year || "";
  const currentHour = new Date().getHours();
  const currentMinutes = new Date().getMinutes();

  const [settings, setSettings] = useState({});

  useEffect(() => {
    apiFetch("/members").then(setMembers).catch(console.error);
    apiFetch("/settings").then(setSettings).catch(console.error);
  }, []);

  useEffect(() => {
    const start = visibleDates[0].fullDate;
    const end = visibleDates[numCols - 1].fullDate + "T23:59:59";
    apiFetch(`/calendar/events?start=${start}&end=${end}`).then(setEvents).catch(console.error);
  }, [visibleDates]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max((currentHour - 7) * HOUR_HEIGHT - 100, 0);
    }
  }, [viewMode]);

  // Map events onto columns
  const mappedEvents = useMemo(() => {
    return events.map((e) => {
      const isAllDay = e.all_day || !e.start_time.includes("T");
      if (isAllDay) {
        const sd = e.start_time.split("T")[0];
        const ed = (e.end_time || e.start_time).split("T")[0];
        const dayIndices = visibleDates
          .map((d, i) => (d.fullDate >= sd && d.fullDate < ed) || d.fullDate === sd ? i : -1)
          .filter((i) => i >= 0);
        return { ...e, isAllDay: true, dayIndices, dayIndex: dayIndices[0] ?? -1 };
      }
      const start = new Date(e.start_time);
      const end = new Date(e.end_time);
      const dayIndex = visibleDates.findIndex((d) => d.fullDate === start.toISOString().split("T")[0]);
      const startHour = start.getHours() + start.getMinutes() / 60;
      const duration = (end - start) / (1000 * 60 * 60);
      return { ...e, isAllDay: false, dayIndex, startHour, duration };
    });
  }, [events, visibleDates]);

  const allDayEvents = mappedEvents.filter((e) => e.isAllDay);
  const timedEvents = mappedEvents.filter((e) => !e.isAllDay && e.dayIndex >= 0);

  // --- Handlers ---
  const openNewEventModal = (date, startHour) => {
    setEditingEvent(null);
    setFormData({
      title: "", member_id: members[0]?.id || "",
      date: date || new Date().toISOString().split("T")[0],
      startHour: startHour || Math.max(new Date().getHours(), 6), duration: 1,
    });
    setShowModal(true);
  };

  const openEditEventModal = (event) => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    setEditingEvent(event);
    setFormData({
      title: event.title, member_id: event.member_id || members[0]?.id || "",
      date: start.toISOString().split("T")[0],
      startHour: start.getHours() + start.getMinutes() / 60,
      duration: (end - start) / (1000 * 60 * 60),
    });
    setSelectedEvent(null);
    setShowModal(true);
  };

  const handleSaveEvent = async () => {
    if (!formData.title.trim()) return;
    const startDate = new Date(`${formData.date}T${String(Math.floor(formData.startHour)).padStart(2, "0")}:${String(Math.round((formData.startHour % 1) * 60)).padStart(2, "0")}:00`);
    const endDate = new Date(startDate.getTime() + formData.duration * 60 * 60 * 1000);
    const body = {
      title: formData.title, start_time: startDate.toISOString(), end_time: endDate.toISOString(),
      all_day: false, member_id: formData.member_id || members[0]?.id || null,
    };
    try {
      if (editingEvent) {
        const updated = await apiFetch(`/calendar/events/${editingEvent.id}`, { method: "PUT", body });
        setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? updated : e)));
      } else {
        const created = await apiFetch("/calendar/events", { method: "POST", body });
        setEvents((prev) => [...prev, created]);
      }
      setShowModal(false);
    } catch (err) { console.error(err); }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await apiFetch(`/calendar/events/${eventId}`, { method: "DELETE" });
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setSelectedEvent(null); setShowModal(false);
    } catch (err) { console.error(err); }
  };

  const handleCellClick = (dayIndex, hour) => openNewEventModal(visibleDates[dayIndex]?.fullDate, hour);

  const stepSize = viewMode === "Day" ? 1 : viewMode === "4-Day" ? 4 : 1;
  const goPrev = () => setNavOffset((n) => n - stepSize);
  const goNext = () => setNavOffset((n) => n + stepSize);
  const goToday = () => setNavOffset(0);

  // Overlap calculation
  function getOverlapInfo(event, eventsInCol) {
    const same = eventsInCol.filter(
      (e) => (e.startHour >= event.startHour && e.startHour < event.startHour + event.duration) ||
        (event.startHour >= e.startHour && event.startHour < e.startHour + e.duration)
    );
    return { count: same.length, index: same.findIndex((e) => e.id === event.id) };
  }

  // Event chip sizes scale with view
  const isCompact = viewMode === "Week";
  const eventFontTitle = isCompact ? 12 : 14;
  const eventFontTime = isCompact ? 10 : 12;
  const eventInitialSize = isCompact ? 18 : 22;
  const timeColWidth = isCompact ? 54 : 64;

  // --- Header ---
  const headerTitle = viewMode === "Day"
    ? `${visibleDates[0]?.dayLong}, ${visibleDates[0]?.month} ${visibleDates[0]?.date}`
    : `${displayMonth} ${displayYear}`;

  const headerLeft = (
    <>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: theme.colors.textPrimary, letterSpacing: "-0.02em" }}>
        {headerTitle}
      </h1>
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={goPrev} style={navBtnStyle}>‹</button>
        <button onClick={goNext} style={navBtnStyle}>›</button>
      </div>
      <button onClick={goToday} style={{
        ...todayBtnStyle, background: navOffset === 0 ? theme.colors.accent : "white",
        color: navOffset === 0 ? "white" : "#6B6A65", border: navOffset === 0 ? "none" : "1px solid #E0DFD9",
      }}>Today</button>
    </>
  );

  const headerRight = (
    <>
      <div style={{ display: "flex", gap: 8 }}>
        {members.map((m) => (
          <div key={m.id} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "5px 12px 5px 5px",
            borderRadius: 20, background: m.light_bg, border: `1.5px solid ${m.color}40`,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", background: m.color, color: "white",
              fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
            }}>{m.initial}</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: theme.colors.textPrimary }}>{m.name}</span>
          </div>
        ))}
      </div>
      <div style={{ width: 1, height: 28, background: theme.colors.border }} />
      <div style={{ display: "flex", background: theme.colors.sidebarBg, borderRadius: 10, padding: 3 }}>
        {["Day", "4-Day", "Week"].map((v) => (
          <button key={v} onClick={() => { setViewMode(v); setNavOffset(0); }} style={{
            padding: "6px 14px", borderRadius: 8, border: "none",
            background: viewMode === v ? "white" : "transparent",
            fontSize: 12, fontWeight: 700, color: viewMode === v ? theme.colors.textPrimary : theme.colors.textMuted,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: viewMode === v ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
          }}>{v}</button>
        ))}
      </div>
    </>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header leftContent={headerLeft} rightContent={headerRight} familyName={settings.family_name} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Day Headers */}
        <div style={{ display: "grid", gridTemplateColumns: `${timeColWidth}px repeat(${numCols}, 1fr)`, borderBottom: `1px solid ${theme.colors.border}`, background: "white" }}>
          <div />
          {visibleDates.map((d) => (
            <div key={d.fullDate} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: isCompact ? "10px 0 8px" : "14px 0 10px", borderLeft: `1px solid ${theme.colors.borderLight}`,
            }}>
              <span style={{
                fontSize: isCompact ? 10 : 13, fontWeight: 700,
                color: d.isToday ? theme.colors.accent : theme.colors.textMuted,
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>{d.day} {d.month !== visibleDates[0].month ? d.month : ""}</span>
              <div style={{
                width: isCompact ? 32 : 40, height: isCompact ? 32 : 40, borderRadius: "50%",
                background: d.isToday ? theme.colors.accent : "transparent",
                color: d.isToday ? "white" : theme.colors.textPrimary,
                fontSize: isCompact ? 16 : 20, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center", marginTop: 3,
              }}>{d.date}</div>
            </div>
          ))}
        </div>

        {/* All-day events */}
        {allDayEvents.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: `${timeColWidth}px repeat(${numCols}, 1fr)`, background: "white", borderBottom: `1px solid ${theme.colors.border}`, minHeight: 40 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#BBBAB5", fontWeight: 700 }}>All day</div>
            {visibleDates.map((_, i) => {
              const dayAllDay = allDayEvents.filter((e) => e.dayIndices?.includes(i));
              return (
                <div key={i} style={{ borderLeft: `1px solid ${theme.colors.borderLight}`, padding: "4px 6px", display: "flex", flexDirection: "column", gap: 3 }}>
                  {dayAllDay.map((e) => (
                    <div key={e.id} onClick={() => setSelectedEvent(selectedEvent?.id === e.id ? null : e)} style={{
                      padding: "5px 10px", borderRadius: 8,
                      background: e.member_light_bg || "#F5E6D3",
                      borderLeft: `3px solid ${e.member_color || "#D4A574"}`,
                      fontSize: isCompact ? 11 : 13, fontWeight: 700, color: theme.colors.textPrimary,
                      cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{e.title}</div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Scrollable Time Grid */}
        <div ref={scrollRef} style={{ flex: 1, overflow: "auto", position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: `${timeColWidth}px repeat(${numCols}, 1fr)`, position: "relative" }}>
            {/* Time labels */}
            <div style={{ position: "relative" }}>
              {HOURS.map((h) => (
                <div key={h} style={{ height: HOUR_HEIGHT, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingRight: 10, position: "relative", top: -8 }}>
                  <span style={{ fontSize: isCompact ? 11 : 13, fontWeight: 600, color: "#BBBAB5", lineHeight: 1 }}>
                    {formatHour(h)} <span style={{ fontSize: isCompact ? 9 : 10 }}>{formatAMPM(h)}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {visibleDates.map((wd, dayIndex) => {
              const dayEvents = timedEvents.filter((e) => e.dayIndex === dayIndex);
              return (
                <div key={dayIndex} style={{ position: "relative", borderLeft: `1px solid ${theme.colors.borderLight}`, background: wd.isToday ? "#FAFCFD" : "transparent" }}>
                  {HOURS.map((h) => (
                    <div key={h} onClick={() => handleCellClick(dayIndex, h)} style={{
                      height: HOUR_HEIGHT, borderBottom: `1px solid ${theme.colors.borderLight}`, cursor: "pointer",
                    }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,170,189,0.04)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }} />
                  ))}
                  {/* Events */}
                  {dayEvents.map((event) => {
                    const { count, index } = getOverlapInfo(event, dayEvents);
                    const hasOverlap = count > 1;
                    const width = hasOverlap ? `calc(${100 / count}% - 4px)` : "calc(100% - 8px)";
                    const left = hasOverlap ? `calc(${(index * 100) / count}% + 4px)` : 4;
                    const top = (event.startHour - 6) * HOUR_HEIGHT;
                    const height = Math.max(event.duration * HOUR_HEIGHT - 4, 28);
                    const mColor = event.member_color || theme.colors.accent;
                    const mBg = event.member_light_bg || theme.colors.sidebarBg;
                    const isSelected = selectedEvent?.id === event.id;

                    return (
                      <div key={event.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(isSelected ? null : event); }}
                        style={{
                          position: "absolute", top, left, width, height,
                          background: mBg, borderLeft: `4px solid ${mColor}`,
                          borderRadius: 10, padding: "6px 10px", cursor: "pointer", overflow: "hidden",
                          transition: "box-shadow 0.15s ease, transform 0.15s ease",
                          boxShadow: isSelected ? `0 4px 16px ${mColor}40` : "0 1px 3px rgba(0,0,0,0.05)",
                          zIndex: isSelected ? 10 : 1, transform: isSelected ? "scale(1.02)" : "scale(1)",
                        }}>
                        <div style={{ fontSize: eventFontTitle, fontWeight: 700, color: theme.colors.textPrimary, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: event.duration < 1 ? "nowrap" : "normal" }}>{event.title}</div>
                        {event.duration > 0.5 && (
                          <div style={{ fontSize: eventFontTime, color: theme.colors.textMuted, fontWeight: 600, marginTop: 2 }}>
                            {formatHour(Math.floor(event.startHour))}:{String(Math.round((event.startHour % 1) * 60)).padStart(2, "0")} {formatAMPM(Math.floor(event.startHour))} – {formatHour(Math.floor(event.startHour + event.duration))}:{String(Math.round(((event.startHour + event.duration) % 1) * 60)).padStart(2, "0")} {formatAMPM(Math.floor(event.startHour + event.duration))}
                          </div>
                        )}
                        {event.duration >= 1 && event.member_initial && (
                          <div style={{
                            width: eventInitialSize, height: eventInitialSize, borderRadius: "50%",
                            background: mColor, color: "white", fontSize: isCompact ? 9 : 11, fontWeight: 800,
                            display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4,
                          }}>{event.member_initial}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Current time line */}
            {(() => {
              const todayIdx = visibleDates.findIndex((d) => d.isToday);
              if (todayIdx === -1 || currentHour < 6 || currentHour > 20) return null;
              const topPos = (currentHour - 6 + currentMinutes / 60) * HOUR_HEIGHT;
              return (
                <div style={{
                  position: "absolute", top: topPos,
                  left: `calc(${timeColWidth}px + ${todayIdx} * ((100% - ${timeColWidth}px) / ${numCols}))`,
                  width: `calc((100% - ${timeColWidth}px) / ${numCols})`,
                  height: 2, background: "#E8927C", zIndex: 20, pointerEvents: "none",
                }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#E8927C", position: "absolute", left: -6, top: -5 }} />
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Event Detail Popup */}
      {selectedEvent && (
        <div style={{
          position: "fixed", bottom: 90, right: 28, width: 320,
          background: "white", borderRadius: 18, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          border: `1px solid ${theme.colors.border}`, padding: 22, zIndex: 200, fontFamily: theme.fonts.family,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: theme.colors.textPrimary, marginBottom: 4 }}>{selectedEvent.title}</div>
              <div style={{ fontSize: 13, color: theme.colors.textMuted, fontWeight: 600 }}>
                {selectedEvent.isAllDay ? "All day" : `${formatTime(selectedEvent.start_time)} – ${formatTime(selectedEvent.end_time)}`}
              </div>
              {selectedEvent.member_name && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: selectedEvent.member_color || theme.colors.accent,
                    color: "white", fontSize: 10, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{selectedEvent.member_initial}</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textPrimary }}>{selectedEvent.member_name}</span>
                </div>
              )}
            </div>
            <button onClick={() => setSelectedEvent(null)} style={{ background: "none", border: "none", fontSize: 20, color: theme.colors.textMuted, cursor: "pointer", padding: 0 }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {!selectedEvent.isAllDay && (
              <button onClick={() => openEditEventModal(selectedEvent)} style={{
                flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${theme.colors.border}`,
                background: "white", color: theme.colors.textPrimary, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>✏️ Edit</button>
            )}
            <button onClick={() => handleDeleteEvent(selectedEvent.id)} style={{
              flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #F0B3B8",
              background: "#FDE2E4", color: "#C0392B", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>🗑 Delete</button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: "white", borderRadius: 20, padding: 30, width: 400, boxShadow: "0 16px 48px rgba(0,0,0,0.15)", fontFamily: theme.fonts.family }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: theme.colors.textPrimary }}>
              {editingEvent ? "Edit Event" : "New Event"}
            </h2>
            <label style={modalLabelStyle}>Title</label>
            <input autoFocus value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleSaveEvent()}
              placeholder="e.g. Doctor Appointment" style={modalInputStyle} />
            <label style={modalLabelStyle}>Date</label>
            <input type="date" value={formData.date}
              onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))} style={modalInputStyle} />
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={modalLabelStyle}>Start Time</label>
                <select value={formData.startHour}
                  onChange={(e) => setFormData((p) => ({ ...p, startHour: Number(e.target.value) }))} style={modalInputStyle}>
                  {Array.from({ length: 30 }, (_, i) => 6 + i * 0.5).filter((h) => h <= 20).map((h) => (
                    <option key={h} value={h}>{formatHour(Math.floor(h))}:{String(Math.round((h % 1) * 60)).padStart(2, "0")} {formatAMPM(Math.floor(h))}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={modalLabelStyle}>Duration</label>
                <select value={formData.duration}
                  onChange={(e) => setFormData((p) => ({ ...p, duration: Number(e.target.value) }))} style={modalInputStyle}>
                  {[0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8].map((d) => (
                    <option key={d} value={d}>{d === 0.5 ? "30 min" : `${d} hr${d > 1 ? "s" : ""}`}</option>
                  ))}
                </select>
              </div>
            </div>
            <label style={modalLabelStyle}>Family Member</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
              {members.map((m) => (
                <button key={m.id} onClick={() => setFormData((p) => ({ ...p, member_id: m.id }))} style={{
                  flex: 1, padding: "12px", borderRadius: 12, cursor: "pointer",
                  border: formData.member_id === m.id ? `2px solid ${m.color}` : "2px solid #E0DFD9",
                  background: formData.member_id === m.id ? m.light_bg : "white",
                  fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", background: m.color, color: "white",
                    fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{m.initial}</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: theme.colors.textPrimary }}>{m.name}</span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {editingEvent && (
                <button onClick={() => handleDeleteEvent(editingEvent.id)} style={{
                  padding: "12px 18px", borderRadius: 12, border: "1px solid #F0B3B8",
                  background: "#FDE2E4", color: "#C0392B", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>🗑</button>
              )}
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, padding: "14px 0", borderRadius: 12, border: "1px solid #E0DFD9",
                background: "white", fontSize: 14, fontWeight: 700, color: theme.colors.textSubtle, cursor: "pointer", fontFamily: "inherit",
              }}>Cancel</button>
              <button onClick={handleSaveEvent} style={{
                flex: 1, padding: "14px 0", borderRadius: 12, border: "none",
                background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
                color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 12px rgba(124,170,189,0.35)", opacity: formData.title.trim() ? 1 : 0.5,
              }}>{editingEvent ? "Save Changes" : "Create Event"}</button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => openNewEventModal(visibleDates[0]?.fullDate)} style={{
        position: "fixed", bottom: 28, right: 28, width: 62, height: 62, borderRadius: 20,
        border: "none", background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
        color: "white", fontSize: 32, fontWeight: 300, cursor: "pointer",
        boxShadow: "0 6px 20px rgba(124,170,189,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
      }}>+</button>
    </div>
  );
}

const navBtnStyle = { width: 34, height: 34, borderRadius: 10, border: "1px solid #E0DFD9", background: "white", cursor: "pointer", fontSize: 16, color: "#6B6A65", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" };
const todayBtnStyle = { padding: "6px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" };
const modalLabelStyle = { fontSize: 13, fontWeight: 700, color: "#2D3B3C", display: "block", marginBottom: 6, marginTop: 14 };
const modalInputStyle = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #E0DFD9", fontSize: 14, fontFamily: "'Nunito', sans-serif", color: "#2D3B3C", outline: "none", boxSizing: "border-box" };
