const { Router } = require("express");
const { getDb } = require("../db/database");
const {
  getAuthUrl, handleCallback, syncCalendarEvents, isAuthenticated,
  listCalendars, createGoogleEvent, updateGoogleEvent, deleteGoogleEvent,
} = require("../services/googleCalendar");

const router = Router();

// Helper: get the Google Calendar ID for a member
function getMemberCalendarId(memberId) {
  if (!memberId) return null;
  const db = getDb();
  const member = db.prepare("SELECT google_calendar_id FROM family_members WHERE id = ?").get(memberId);
  return member?.google_calendar_id || null;
}

// Get auth status
router.get("/auth/status", (req, res) => {
  res.json({ authenticated: isAuthenticated() });
});

// Initiate OAuth flow
router.get("/auth", (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

// OAuth callback
router.get("/auth/callback", async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "Missing auth code" });
    await handleCallback(code);
    const frontendUrl = process.env.NODE_ENV === 'production'
      ? '/#/settings?google=connected'
      : 'http://localhost:5173/#/settings?google=connected';
    res.redirect(frontendUrl);
  } catch (err) {
    next(err);
  }
});

// List available Google calendars
router.get("/calendars", async (req, res, next) => {
  try {
    const calendars = await listCalendars();
    res.json(calendars);
  } catch (err) {
    next(err);
  }
});

// Trigger manual sync
router.get("/sync", async (req, res, next) => {
  try {
    await syncCalendarEvents();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Get events for a date range
router.get("/events", (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: "start and end query params required" });
  }

  const db = getDb();
  // Extract just the date portion for all-day event matching
  const startDate = start.split("T")[0];
  const endDate = end.split("T")[0];
  const events = db
    .prepare(
      `SELECT ce.*, fm.name as member_name, fm.color as member_color, fm.light_bg as member_light_bg, fm.initial as member_initial
       FROM calendar_events ce
       LEFT JOIN family_members fm ON ce.member_id = fm.id
       WHERE (
         (ce.start_time >= ? AND ce.start_time <= ?)
         OR (ce.all_day = 1 AND SUBSTR(ce.start_time, 1, 10) >= ? AND SUBSTR(ce.start_time, 1, 10) <= ?)
       )
       ORDER BY ce.start_time`
    )
    .all(start, end, startDate, endDate);

  res.json(events);
});

// Create event — saves locally AND pushes to Google Calendar
router.post("/events", async (req, res, next) => {
  try {
    const { title, start_time, end_time, all_day, member_id, description } = req.body;
    if (!title || !start_time || !end_time) {
      return res.status(400).json({ error: "title, start_time, end_time required" });
    }

    // Try to push to Google Calendar
    let googleEventId = null;
    const calendarId = getMemberCalendarId(member_id);
    if (calendarId && isAuthenticated()) {
      try {
        googleEventId = await createGoogleEvent(calendarId, {
          title, start_time, end_time, all_day, description,
        });
        console.log(`[GCAL] Created Google event: ${googleEventId}`);
      } catch (err) {
        console.error("[GCAL] Failed to create Google event:", err.message);
        // Continue — still save locally
      }
    }

    const db = getDb();
    const result = db
      .prepare(
        "INSERT INTO calendar_events (google_event_id, title, start_time, end_time, all_day, member_id, description) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(googleEventId, title, start_time, end_time, all_day ? 1 : 0, member_id || null, description || null);

    const event = db
      .prepare(
        `SELECT ce.*, fm.name as member_name, fm.color as member_color, fm.light_bg as member_light_bg, fm.initial as member_initial
         FROM calendar_events ce
         LEFT JOIN family_members fm ON ce.member_id = fm.id
         WHERE ce.id = ?`
      )
      .get(result.lastInsertRowid);

    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

// Update event — updates locally AND on Google Calendar
router.put("/events/:id", async (req, res, next) => {
  try {
    const { title, start_time, end_time, all_day, member_id, description } = req.body;
    const db = getDb();

    const existing = db.prepare("SELECT * FROM calendar_events WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Event not found" });

    // Try to update on Google Calendar
    if (existing.google_event_id && isAuthenticated()) {
      const calendarId = getMemberCalendarId(member_id || existing.member_id);
      if (calendarId) {
        try {
          await updateGoogleEvent(calendarId, existing.google_event_id, {
            title, start_time, end_time, all_day, description,
          });
          console.log(`[GCAL] Updated Google event: ${existing.google_event_id}`);
        } catch (err) {
          console.error("[GCAL] Failed to update Google event:", err.message);
        }
      }
    }

    db.prepare(
      "UPDATE calendar_events SET title=?, start_time=?, end_time=?, all_day=?, member_id=?, description=? WHERE id=?"
    ).run(title, start_time, end_time, all_day ? 1 : 0, member_id || null, description || null, req.params.id);

    const event = db
      .prepare(
        `SELECT ce.*, fm.name as member_name, fm.color as member_color, fm.light_bg as member_light_bg, fm.initial as member_initial
         FROM calendar_events ce
         LEFT JOIN family_members fm ON ce.member_id = fm.id
         WHERE ce.id = ?`
      )
      .get(req.params.id);

    res.json(event);
  } catch (err) {
    next(err);
  }
});

// Delete event — deletes locally AND from Google Calendar
router.delete("/events/:id", async (req, res, next) => {
  try {
    const db = getDb();
    const existing = db.prepare("SELECT * FROM calendar_events WHERE id = ?").get(req.params.id);

    if (existing?.google_event_id && isAuthenticated()) {
      const calendarId = getMemberCalendarId(existing.member_id);
      if (calendarId) {
        try {
          await deleteGoogleEvent(calendarId, existing.google_event_id);
          console.log(`[GCAL] Deleted Google event: ${existing.google_event_id}`);
        } catch (err) {
          console.error("[GCAL] Failed to delete Google event:", err.message);
        }
      }
    }

    db.prepare("DELETE FROM calendar_events WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
