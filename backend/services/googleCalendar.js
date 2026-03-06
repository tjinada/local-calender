const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const { getDb } = require("../db/database");

const DATA_DIR = process.env.DATA_DIR || "./data";
const TOKEN_PATH = path.join(DATA_DIR, "google-tokens.json");

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
  });
}

async function handleCallback(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  return tokens;
}

function getAuthenticatedClient() {
  if (!fs.existsSync(TOKEN_PATH)) return null;
  const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);

  oauth2Client.on("tokens", (newTokens) => {
    const merged = { ...tokens, ...newTokens };
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(merged));
  });

  return oauth2Client;
}

async function syncCalendarEvents() {
  const auth = getAuthenticatedClient();
  if (!auth) {
    console.log("[SYNC] No Google tokens found, skipping sync");
    return;
  }

  const db = getDb();
  const members = db.prepare("SELECT * FROM family_members WHERE google_calendar_id IS NOT NULL").all();

  if (members.length === 0) {
    console.log("[SYNC] No members have linked calendars, skipping");
    return;
  }

  const calendar = google.calendar({ version: "v3", auth });
  const now = new Date();
  const timeMin = new Date(now);
  timeMin.setDate(timeMin.getDate() - 7);
  const timeMax = new Date(now);
  timeMax.setDate(timeMax.getDate() + 30);

  const upsert = db.prepare(`
    INSERT INTO calendar_events (google_event_id, title, start_time, end_time, all_day, member_id, description, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(google_event_id) DO UPDATE SET
      title = excluded.title,
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      all_day = excluded.all_day,
      description = excluded.description,
      synced_at = CURRENT_TIMESTAMP
  `);

  for (const member of members) {
    try {
      const res = await calendar.events.list({
        calendarId: member.google_calendar_id,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 250,
      });

      const events = res.data.items || [];
      for (const event of events) {
        const allDay = !!event.start.date;
        const startTime = event.start.dateTime || event.start.date;
        const endTime = event.end.dateTime || event.end.date;
        upsert.run(
          event.id,
          event.summary || "(No title)",
          startTime,
          endTime,
          allDay ? 1 : 0,
          member.id,
          event.description || null
        );
      }
      console.log(`[SYNC] Synced ${events.length} events for ${member.name}`);
    } catch (err) {
      console.error(`[SYNC] Error syncing ${member.name}:`, err.message);
    }
  }
}

async function listCalendars() {
  const auth = getAuthenticatedClient();
  if (!auth) return [];

  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.calendarList.list();
  return (res.data.items || []).map((cal) => ({
    id: cal.id,
    name: cal.summary,
    primary: cal.primary || false,
    color: cal.backgroundColor,
  }));
}

async function createGoogleEvent(calendarId, event) {
  const auth = getAuthenticatedClient();
  if (!auth || !calendarId) return null;

  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: event.title,
      description: event.description || "",
      start: event.all_day
        ? { date: event.start_time.split("T")[0] }
        : { dateTime: event.start_time, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end: event.all_day
        ? { date: event.end_time.split("T")[0] }
        : { dateTime: event.end_time, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    },
  });
  return res.data.id;
}

async function updateGoogleEvent(calendarId, googleEventId, event) {
  const auth = getAuthenticatedClient();
  if (!auth || !calendarId || !googleEventId) return;

  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.update({
    calendarId,
    eventId: googleEventId,
    requestBody: {
      summary: event.title,
      description: event.description || "",
      start: event.all_day
        ? { date: event.start_time.split("T")[0] }
        : { dateTime: event.start_time, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end: event.all_day
        ? { date: event.end_time.split("T")[0] }
        : { dateTime: event.end_time, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    },
  });
}

async function deleteGoogleEvent(calendarId, googleEventId) {
  const auth = getAuthenticatedClient();
  if (!auth || !calendarId || !googleEventId) return;

  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({
    calendarId,
    eventId: googleEventId,
  });
}

function isAuthenticated() {
  return fs.existsSync(TOKEN_PATH);
}

module.exports = {
  getAuthUrl, handleCallback, syncCalendarEvents, isAuthenticated,
  listCalendars, createGoogleEvent, updateGoogleEvent, deleteGoogleEvent,
};
