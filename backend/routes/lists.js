const { Router } = require("express");
const { getDb } = require("../db/database");

const router = Router();

// Get all lists with items
router.get("/", (req, res) => {
  const db = getDb();
  const lists = db.prepare("SELECT * FROM lists ORDER BY sort_order").all();
  const getItems = db.prepare("SELECT * FROM list_items WHERE list_id = ? ORDER BY sort_order, id");

  const result = lists.map((list) => ({
    ...list,
    items: getItems.all(list.id),
  }));
  res.json(result);
});

// Create a new list
router.post("/", (req, res) => {
  const { name, icon, color, light_bg } = req.body;
  if (!name || !color || !light_bg) {
    return res.status(400).json({ error: "name, color, light_bg required" });
  }

  const db = getDb();
  const maxOrder = db.prepare("SELECT MAX(sort_order) as max FROM lists").get();
  const result = db
    .prepare("INSERT INTO lists (name, icon, color, light_bg, sort_order) VALUES (?, ?, ?, ?, ?)")
    .run(name, icon || "📋", color, light_bg, (maxOrder.max || 0) + 1);

  const list = db.prepare("SELECT * FROM lists WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json({ ...list, items: [] });
});

// Update list
router.put("/:id", (req, res) => {
  const { name, icon, color, light_bg, sort_order } = req.body;
  const db = getDb();

  const existing = db.prepare("SELECT * FROM lists WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "List not found" });

  db.prepare("UPDATE lists SET name=?, icon=?, color=?, light_bg=?, sort_order=? WHERE id=?").run(
    name ?? existing.name,
    icon ?? existing.icon,
    color ?? existing.color,
    light_bg ?? existing.light_bg,
    sort_order ?? existing.sort_order,
    req.params.id
  );

  const list = db.prepare("SELECT * FROM lists WHERE id = ?").get(req.params.id);
  const items = db.prepare("SELECT * FROM list_items WHERE list_id = ? ORDER BY sort_order, id").all(req.params.id);
  res.json({ ...list, items });
});

// Delete list
router.delete("/:id", (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM lists WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Add item to list
router.post("/:id/items", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });

  const db = getDb();
  const maxOrder = db.prepare("SELECT MAX(sort_order) as max FROM list_items WHERE list_id = ?").get(req.params.id);
  const result = db
    .prepare("INSERT INTO list_items (list_id, text, sort_order) VALUES (?, ?, ?)")
    .run(req.params.id, text, (maxOrder.max || 0) + 1);

  const item = db.prepare("SELECT * FROM list_items WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(item);
});

// Update item
router.put("/:id/items/:itemId", (req, res) => {
  const { text, checked, sort_order } = req.body;
  const db = getDb();

  const existing = db.prepare("SELECT * FROM list_items WHERE id = ? AND list_id = ?").get(req.params.itemId, req.params.id);
  if (!existing) return res.status(404).json({ error: "Item not found" });

  db.prepare("UPDATE list_items SET text=?, checked=?, sort_order=? WHERE id=?").run(
    text ?? existing.text,
    checked !== undefined ? (checked ? 1 : 0) : existing.checked,
    sort_order ?? existing.sort_order,
    req.params.itemId
  );

  const item = db.prepare("SELECT * FROM list_items WHERE id = ?").get(req.params.itemId);
  res.json(item);
});

// Delete item
router.delete("/:id/items/:itemId", (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM list_items WHERE id = ? AND list_id = ?").run(req.params.itemId, req.params.id);
  res.json({ success: true });
});

module.exports = router;
