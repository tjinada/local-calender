require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");

const { initSchema } = require("./db/schema");
const { syncCalendarEvents } = require("./services/googleCalendar");
const { initVapid } = require("./services/pushNotification");
const errorHandler = require("./middleware/errorHandler");

const calendarRoutes = require("./routes/calendar");
const mealRoutes = require("./routes/meals");
const listRoutes = require("./routes/lists");
const weatherRoutes = require("./routes/weather");
const memberRoutes = require("./routes/members");
const settingsRoutes = require("./routes/settings");
const notificationRoutes = require("./routes/notifications");

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
process.env.DATA_DIR = DATA_DIR;

// Initialize database
initSchema();

// Initialize VAPID
initVapid();

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/calendar", calendarRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/notifications", notificationRoutes);

// Serve frontend in production
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(frontendDist, "index.html"));
    }
  });
}

app.use(errorHandler);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[SERVER] Family Hub running on http://0.0.0.0:${PORT}`);
});

// Sync Google Calendar every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("[CRON] Running calendar sync...");
  try {
    await syncCalendarEvents();
  } catch (err) {
    console.error("[CRON] Sync failed:", err.message);
  }
});
