import { useState } from "react";

const FAMILY_MEMBERS = [
  { name: "You", color: "#E8927C", lightBg: "#FDF0ED", initial: "Y" },
  { name: "Partner", color: "#7CAABD", lightBg: "#EDF5F8", initial: "P" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM - 7 PM

const WEATHER = { temp: "22°", icon: "☀️", condition: "Sunny" };

// Sample events for the week
const EVENTS = [
  // Monday
  { id: 1, title: "Team Standup", day: 0, startHour: 9, duration: 0.5, member: 0 },
  { id: 2, title: "Dentist Appointment", day: 0, startHour: 11, duration: 1, member: 1 },
  { id: 3, title: "Grocery Run", day: 0, startHour: 14, duration: 1, member: 0 },
  // Tuesday
  { id: 4, title: "Yoga Class", day: 1, startHour: 7, duration: 1, member: 1 },
  { id: 5, title: "Project Review", day: 1, startHour: 10, duration: 1.5, member: 0 },
  { id: 6, title: "Coffee with Sarah", day: 1, startHour: 13, duration: 1, member: 1 },
  // Wednesday
  { id: 7, title: "Doctor Checkup", day: 2, startHour: 9, duration: 1, member: 0 },
  { id: 8, title: "Lunch Date", day: 2, startHour: 12, duration: 1.5, member: 0 },
  { id: 8.5, title: "Lunch Date", day: 2, startHour: 12, duration: 1.5, member: 1 },
  { id: 9, title: "Book Club", day: 2, startHour: 18, duration: 1, member: 1 },
  // Thursday
  { id: 10, title: "Sprint Planning", day: 3, startHour: 9, duration: 1, member: 0 },
  { id: 11, title: "Oil Change", day: 3, startHour: 11, duration: 1, member: 1 },
  { id: 12, title: "Gym", day: 3, startHour: 17, duration: 1.5, member: 0 },
  // Friday
  { id: 13, title: "Work from Home", day: 4, startHour: 9, duration: 4, member: 0 },
  { id: 14, title: "Meal Prep", day: 4, startHour: 14, duration: 2, member: 1 },
  { id: 15, title: "Movie Night", day: 4, startHour: 19, duration: 0.5, member: 0 },
  { id: 15.5, title: "Movie Night", day: 4, startHour: 19, duration: 0.5, member: 1 },
  // Saturday
  { id: 16, title: "Farmers Market", day: 5, startHour: 8, duration: 1.5, member: 0 },
  { id: 16.5, title: "Farmers Market", day: 5, startHour: 8, duration: 1.5, member: 1 },
  { id: 17, title: "Home Depot Trip", day: 5, startHour: 11, duration: 1.5, member: 0 },
  { id: 18, title: "Brunch with Mom", day: 5, startHour: 11, duration: 1.5, member: 1 },
  // Sunday
  { id: 19, title: "Sleep In 😴", day: 6, startHour: 10, duration: 1, member: 0 },
  { id: 20, title: "Meal Planning", day: 6, startHour: 13, duration: 1, member: 1 },
  { id: 21, title: "Walk in the Park", day: 6, startHour: 15, duration: 1.5, member: 0 },
  { id: 21.5, title: "Walk in the Park", day: 6, startHour: 15, duration: 1.5, member: 1 },
];

const ALL_DAY_EVENTS = [
  { id: 100, title: "Anniversary Week! 🎉", startDay: 0, spanDays: 7, member: -1, color: "#F5E6D3", textColor: "#B8860B" },
];

const NAV_ITEMS = [
  { icon: "📅", label: "Calendar", active: true },
  { icon: "✅", label: "Tasks" },
  { icon: "🍽️", label: "Meals" },
  { icon: "📝", label: "Lists" },
  { icon: "📸", label: "Photos" },
];

const BOTTOM_NAV = [
  { icon: "⚙️", label: "Settings" },
];

function formatHour(h) {
  if (h === 0 || h === 12) return "12";
  return h > 12 ? `${h - 12}` : `${h}`;
}

function formatAMPM(h) {
  return h >= 12 ? "PM" : "AM";
}

function getWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  return DAYS.map((day, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return {
      day,
      date: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
      month: date.toLocaleString("default", { month: "short" }),
    };
  });
}

export default function FamilyCalendar() {
  const [activeNav, setActiveNav] = useState("Calendar");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const weekDates = getWeekDates();
  const today = new Date();
  const currentMonth = today.toLocaleString("default", { month: "long" });
  const currentYear = today.getFullYear();
  const currentHour = today.getHours();
  const currentMinutes = today.getMinutes();

  const HOUR_HEIGHT = 64;
  const HEADER_OFFSET = 0;

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      display: "flex",
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      background: "#FAFAF7",
      overflow: "hidden",
      userSelect: "none",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* Sidebar Navigation */}
      <div style={{
        width: 78,
        minWidth: 78,
        background: "#F0EFEA",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 20,
        paddingBottom: 16,
        borderRight: "1px solid #E5E4DF",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          {/* Logo */}
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: "linear-gradient(135deg, #7CAABD, #5B8FA3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 20,
            fontWeight: 800,
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(124,170,189,0.3)",
          }}>
            H
          </div>
          
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              style={{
                width: 60,
                height: 56,
                borderRadius: 14,
                border: "none",
                background: activeNav === item.label ? "white" : "transparent",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                transition: "all 0.2s ease",
                boxShadow: activeNav === item.label ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{
                fontSize: 9,
                fontWeight: activeNav === item.label ? 700 : 600,
                color: activeNav === item.label ? "#3D5A5B" : "#9B9A95",
                letterSpacing: "0.02em",
              }}>{item.label}</span>
            </button>
          ))}
        </div>
        
        <div>
          {BOTTOM_NAV.map((item) => (
            <button
              key={item.label}
              style={{
                width: 60,
                height: 56,
                borderRadius: 14,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: "#9B9A95" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* Top Header Bar */}
        <div style={{
          height: 56,
          minHeight: 56,
          background: "white",
          borderBottom: "1px solid #E8E7E3",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <h1 style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#2D3B3C",
              letterSpacing: "-0.02em",
            }}>
              {currentMonth} {currentYear}
            </h1>
            <div style={{ display: "flex", gap: 4 }}>
              <button style={{
                width: 30, height: 30, borderRadius: 8, border: "1px solid #E0DFD9",
                background: "white", cursor: "pointer", fontSize: 14, color: "#6B6A65",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>‹</button>
              <button style={{
                width: 30, height: 30, borderRadius: 8, border: "1px solid #E0DFD9",
                background: "white", cursor: "pointer", fontSize: 14, color: "#6B6A65",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>›</button>
            </div>
            <button style={{
              padding: "5px 14px",
              borderRadius: 8,
              border: "1px solid #E0DFD9",
              background: "white",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              color: "#6B6A65",
              fontFamily: "inherit",
            }}>Today</button>
          </div>

          {/* Weather + Time + Family Members */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            
            {/* Weather Widget */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "#F7F6F2",
              borderRadius: 12,
            }}>
              <span style={{ fontSize: 20 }}>{WEATHER.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#2D3B3C" }}>{WEATHER.temp}</span>
              <span style={{ fontSize: 11, color: "#9B9A95", fontWeight: 600 }}>{WEATHER.condition}</span>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 28, background: "#E8E7E3" }} />
            
            {/* Family Member Pills */}
            <div style={{ display: "flex", gap: 8 }}>
              {FAMILY_MEMBERS.map((member) => (
                <div key={member.name} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px 5px 5px",
                  borderRadius: 20,
                  background: member.lightBg,
                  border: `1.5px solid ${member.color}40`,
                }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: member.color,
                    color: "white",
                    fontSize: 11,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>{member.initial}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#2D3B3C" }}>{member.name}</span>
                </div>
              ))}
            </div>

            {/* View Toggle */}
            <div style={{
              display: "flex",
              background: "#F0EFEA",
              borderRadius: 10,
              padding: 3,
            }}>
              {["Day", "Week"].map((v) => (
                <button key={v} style={{
                  padding: "5px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: v === "Week" ? "white" : "transparent",
                  fontSize: 12,
                  fontWeight: 700,
                  color: v === "Week" ? "#2D3B3C" : "#9B9A95",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: v === "Week" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                }}>{v}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          
          {/* Day Headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "54px repeat(7, 1fr)",
            borderBottom: "1px solid #E8E7E3",
            background: "white",
          }}>
            <div /> {/* empty corner */}
            {weekDates.map((d) => (
              <div key={d.day} style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "10px 0 8px",
                borderLeft: "1px solid #F0EFEA",
              }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: d.isToday ? "#7CAABD" : "#9B9A95",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}>{d.day}</span>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: d.isToday ? "#7CAABD" : "transparent",
                  color: d.isToday ? "white" : "#2D3B3C",
                  fontSize: 16,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 2,
                }}>{d.date}</div>
              </div>
            ))}
          </div>

          {/* All-day Events Row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "54px repeat(7, 1fr)",
            background: "white",
            borderBottom: "1px solid #E8E7E3",
            minHeight: 32,
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              color: "#BBBAB5",
              fontWeight: 600,
            }}>ALL DAY</div>
            <div style={{
              gridColumn: "2 / 9",
              padding: "4px 6px",
              display: "flex",
              alignItems: "center",
            }}>
              {ALL_DAY_EVENTS.map((e) => (
                <div key={e.id} style={{
                  width: "100%",
                  padding: "4px 12px",
                  borderRadius: 8,
                  background: e.color,
                  color: e.textColor,
                  fontSize: 12,
                  fontWeight: 700,
                  textAlign: "center",
                }}>{e.title}</div>
              ))}
            </div>
          </div>

          {/* Scrollable Time Grid */}
          <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "54px repeat(7, 1fr)",
              position: "relative",
            }}>
              {/* Time Labels */}
              <div style={{ position: "relative" }}>
                {HOURS.map((h) => (
                  <div key={h} style={{
                    height: HOUR_HEIGHT,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-end",
                    paddingRight: 10,
                    paddingTop: 0,
                    position: "relative",
                    top: -7,
                  }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#BBBAB5",
                      lineHeight: 1,
                    }}>
                      {formatHour(h)} <span style={{ fontSize: 9 }}>{formatAMPM(h)}</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {DAYS.map((_, dayIndex) => (
                <div key={dayIndex} style={{
                  position: "relative",
                  borderLeft: "1px solid #F0EFEA",
                  background: weekDates[dayIndex]?.isToday ? "#FAFCFD" : "transparent",
                }}>
                  {/* Hour grid lines */}
                  {HOURS.map((h) => (
                    <div key={h} style={{
                      height: HOUR_HEIGHT,
                      borderBottom: "1px solid #F0EFEA",
                    }} />
                  ))}

                  {/* Events */}
                  {EVENTS.filter((e) => e.day === dayIndex).map((event) => {
                    const member = FAMILY_MEMBERS[event.member];
                    const eventsAtSameTime = EVENTS.filter(
                      (e) => e.day === dayIndex && 
                      ((e.startHour >= event.startHour && e.startHour < event.startHour + event.duration) ||
                       (event.startHour >= e.startHour && event.startHour < e.startHour + e.duration))
                    );
                    const hasOverlap = eventsAtSameTime.length > 1;
                    const overlapIndex = hasOverlap ? eventsAtSameTime.findIndex((e) => e.id === event.id) : 0;
                    const width = hasOverlap ? `calc(${100 / eventsAtSameTime.length}% - 3px)` : "calc(100% - 6px)";
                    const left = hasOverlap ? `calc(${(overlapIndex * 100) / eventsAtSameTime.length}% + 3px)` : 3;
                    
                    const top = (event.startHour - 7) * HOUR_HEIGHT + HEADER_OFFSET;
                    const height = event.duration * HOUR_HEIGHT - 3;

                    return (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                        style={{
                          position: "absolute",
                          top,
                          left,
                          width,
                          height,
                          background: member.lightBg,
                          borderLeft: `3px solid ${member.color}`,
                          borderRadius: 8,
                          padding: "5px 8px",
                          cursor: "pointer",
                          overflow: "hidden",
                          transition: "box-shadow 0.15s ease, transform 0.15s ease",
                          boxShadow: selectedEvent?.id === event.id
                            ? `0 2px 12px ${member.color}40`
                            : "0 1px 2px rgba(0,0,0,0.04)",
                          zIndex: selectedEvent?.id === event.id ? 10 : 1,
                          transform: selectedEvent?.id === event.id ? "scale(1.02)" : "scale(1)",
                        }}
                      >
                        <div style={{
                          fontSize: event.duration <= 0.5 ? 10 : 12,
                          fontWeight: 700,
                          color: "#2D3B3C",
                          lineHeight: 1.3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>{event.title}</div>
                        {event.duration > 0.5 && (
                          <div style={{
                            fontSize: 10,
                            color: "#9B9A95",
                            fontWeight: 600,
                            marginTop: 2,
                          }}>
                            {formatHour(event.startHour)}{formatAMPM(event.startHour)} - {formatHour(event.startHour + event.duration)}{formatAMPM(event.startHour + event.duration)}
                          </div>
                        )}
                        {event.duration >= 1.5 && (
                          <div style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: member.color,
                            color: "white",
                            fontSize: 9,
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 4,
                          }}>{member.initial}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Current Time Indicator */}
              {(() => {
                const todayIndex = weekDates.findIndex((d) => d.isToday);
                if (todayIndex === -1 || currentHour < 7 || currentHour > 19) return null;
                const topPos = (currentHour - 7 + currentMinutes / 60) * HOUR_HEIGHT;
                return (
                  <div style={{
                    position: "absolute",
                    top: topPos,
                    left: `calc(54px + ${todayIndex} * ((100% - 54px) / 7))`,
                    width: `calc((100% - 54px) / 7)`,
                    height: 2,
                    background: "#E8927C",
                    zIndex: 20,
                    pointerEvents: "none",
                  }}>
                    <div style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#E8927C",
                      position: "absolute",
                      left: -5,
                      top: -4,
                    }} />
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Add Event FAB */}
        <button style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: 16,
          border: "none",
          background: "linear-gradient(135deg, #7CAABD, #5B8FA3)",
          color: "white",
          fontSize: 26,
          fontWeight: 300,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(124,170,189,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          transition: "transform 0.15s ease",
        }}>
          +
        </button>
      </div>
    </div>
  );
}
