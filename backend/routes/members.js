const { Router } = require("express");
const { getDb } = require("../db/database");

const router = Router();

// Get all members
router.get("/", (req, res) => {
  const db = getDb();
  const members = db.prepare("SELECT * FROM family_members ORDER BY id").all();
  res.json(members);
});

// Create or update member
router.post("/", (req, res) => {
  const { name, color, light_bg, initial, google_calendar_id } = req.body;
  if (!name || !color || !light_bg || !initial) {
    return res.status(400).json({ error: "name, color, light_bg, initial required" });
  }

  const db = getDb();
  const result = db
    .prepare("INSERT INTO family_members (name, color, light_bg, initial, google_calendar_id) VALUES (?, ?, ?, ?, ?)")
    .run(name, color, light_bg, initial, google_calendar_id || null);

  const member = db.prepare("SELECT * FROM family_members WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(member);
});

// Update member
router.put("/:id", (req, res) => {
  const { name, color, light_bg, initial, google_calendar_id } = req.body;
  const db = getDb();

  const existing = db.prepare("SELECT * FROM family_members WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Member not found" });

  db.prepare(
    "UPDATE family_members SET name=?, color=?, light_bg=?, initial=?, google_calendar_id=? WHERE id=?"
  ).run(
    name ?? existing.name,
    color ?? existing.color,
    light_bg ?? existing.light_bg,
    initial ?? existing.initial,
    google_calendar_id !== undefined ? google_calendar_id : existing.google_calendar_id,
    req.params.id
  );

  const member = db.prepare("SELECT * FROM family_members WHERE id = ?").get(req.params.id);
  res.json(member);
});

// Delete member
router.delete("/:id", (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM family_members WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
