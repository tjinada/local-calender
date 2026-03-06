export function getWeekDates(startDay = "mon", weekOffset = 0) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const offset = startDay === "sun" ? dayOfWeek : dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const start = new Date(today);
  start.setDate(today.getDate() - offset + weekOffset * 7);

  const days = startDay === "sun"
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return days.map((day, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return buildDateObj(date, day);
  });
}

// Get N days starting from today + offset
export function getNDayDates(numDays = 4, startOffset = 0) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() + startOffset);

  return Array.from({ length: numDays }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dayName = date.toLocaleString("default", { weekday: "short" });
    return buildDateObj(date, dayName);
  });
}

function buildDateObj(date, dayLabel) {
  const today = new Date();
  return {
    day: dayLabel,
    dayLong: date.toLocaleString("default", { weekday: "long" }),
    date: date.getDate(),
    isToday: date.toDateString() === today.toDateString(),
    month: date.toLocaleString("default", { month: "short" }),
    monthLong: date.toLocaleString("default", { month: "long" }),
    year: date.getFullYear(),
    fullDate: date.toISOString().split("T")[0],
  };
}

export function formatHour(h) {
  if (h === 0 || h === 12) return "12";
  return h > 12 ? `${h - 12}` : `${h}`;
}

export function formatAMPM(h) {
  return h >= 12 ? "PM" : "AM";
}

export function getWeekStart(date = new Date(), startDay = "sun") {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const offset = startDay === "sun" ? dayOfWeek : dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() - offset);
  return d.toISOString().split("T")[0];
}

export function formatTime(dateStr) {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${formatHour(h)}:${m.toString().padStart(2, "0")} ${formatAMPM(h)}`;
}
