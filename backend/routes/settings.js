const { Router } = require("express");
const { getDb } = require("../db/database");

const router = Router();

// Get all settings
router.get("/", (req, res) => {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM settings").all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json(settings);
});

// Update a setting
router.put("/", (req, res) => {
  const db = getDb();
  const upsert = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );

  const transaction = db.transaction((entries) => {
    for (const [key, value] of entries) {
      upsert.run(key, String(value));
    }
  });

  transaction(Object.entries(req.body));

  const rows = db.prepare("SELECT * FROM settings").all();
  const settings = {};
  for (const row of rows) settings[row.key] = row.value;
  res.json(settings);
});

module.exports = router;
