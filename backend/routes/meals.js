const { Router } = require("express");
const { getDb } = require("../db/database");

const router = Router();

// Get meals for a week (pass ?week=YYYY-MM-DD for the Sunday of that week)
router.get("/", (req, res) => {
  const { week } = req.query;
  if (!week) return res.status(400).json({ error: "week query param required (YYYY-MM-DD)" });

  const db = getDb();
  const sunday = new Date(week + "T00:00:00");
  const saturday = new Date(sunday);
  saturday.setDate(saturday.getDate() + 6);

  const meals = db
    .prepare("SELECT * FROM meals WHERE date >= ? AND date <= ? ORDER BY date, meal_type")
    .all(week, saturday.toISOString().split("T")[0]);

  res.json(meals);
});

// Create or update a meal
router.post("/", (req, res) => {
  const { date, meal_type, name, emoji, recipe_url } = req.body;
  if (!date || !meal_type || !name) {
    return res.status(400).json({ error: "date, meal_type, name required" });
  }

  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO meals (date, meal_type, name, emoji, recipe_url)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(date, meal_type) DO UPDATE SET
         name = excluded.name,
         emoji = excluded.emoji,
         recipe_url = excluded.recipe_url`
    )
    .run(date, meal_type, name, emoji || null, recipe_url || null);

  const meal = db.prepare("SELECT * FROM meals WHERE date = ? AND meal_type = ?").get(date, meal_type);
  res.status(201).json(meal);
});

// Delete a meal
router.delete("/:id", (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM meals WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Get grocery list for a week
router.get("/grocery", (req, res) => {
  const { week } = req.query;
  if (!week) return res.status(400).json({ error: "week query param required" });

  const db = getDb();
  const items = db
    .prepare("SELECT * FROM grocery_items WHERE week_date = ? ORDER BY category, name")
    .all(week);
  res.json(items);
});

// Add grocery item
router.post("/grocery", (req, res) => {
  const { week_date, name, category } = req.body;
  if (!week_date || !name) return res.status(400).json({ error: "week_date, name required" });

  const db = getDb();
  const result = db
    .prepare("INSERT INTO grocery_items (week_date, name, category) VALUES (?, ?, ?)")
    .run(week_date, name, category || "Other");

  const item = db.prepare("SELECT * FROM grocery_items WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(item);
});

// Toggle grocery item checked
router.put("/grocery/:id", (req, res) => {
  const { checked } = req.body;
  const db = getDb();
  db.prepare("UPDATE grocery_items SET checked = ? WHERE id = ?").run(checked ? 1 : 0, req.params.id);
  const item = db.prepare("SELECT * FROM grocery_items WHERE id = ?").get(req.params.id);
  res.json(item);
});

// Delete grocery item
router.delete("/grocery/:id", (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM grocery_items WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Bulk set grocery items for a week
router.post("/grocery/bulk", (req, res) => {
  const { week_date, items } = req.body;
  if (!week_date || !Array.isArray(items)) {
    return res.status(400).json({ error: "week_date and items[] required" });
  }

  const db = getDb();
  db.prepare("DELETE FROM grocery_items WHERE week_date = ?").run(week_date);
  const insert = db.prepare("INSERT INTO grocery_items (week_date, name, category) VALUES (?, ?, ?)");
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(week_date, row.name, row.category || "Other");
  });
  insertMany(items);

  const result = db.prepare("SELECT * FROM grocery_items WHERE week_date = ? ORDER BY category, name").all(week_date);
  res.status(201).json(result);
});

module.exports = router;
