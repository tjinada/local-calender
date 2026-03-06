const { getDb } = require("./database");

function initSchema() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS family_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      light_bg TEXT NOT NULL,
      initial TEXT NOT NULL,
      google_calendar_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_event_id TEXT UNIQUE,
      title TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      all_day INTEGER DEFAULT 0,
      member_id INTEGER,
      color TEXT,
      description TEXT,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES family_members(id)
    );

    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast','lunch','dinner','snack')),
      name TEXT NOT NULL,
      emoji TEXT,
      recipe_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, meal_type)
    );

    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT NOT NULL,
      light_bg TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS list_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      checked INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS grocery_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_date TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      checked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT UNIQUE NOT NULL,
      keys_p256dh TEXT NOT NULL,
      keys_auth TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default family members if empty
  const memberCount = db.prepare("SELECT COUNT(*) as count FROM family_members").get();
  if (memberCount.count === 0) {
    const insert = db.prepare(
      "INSERT INTO family_members (name, color, light_bg, initial) VALUES (?, ?, ?, ?)"
    );
    insert.run("You", "#E8927C", "#FDF0ED", "Y");
    insert.run("Partner", "#7CAABD", "#EDF5F8", "P");
  }

  // Seed default lists if empty
  const listCount = db.prepare("SELECT COUNT(*) as count FROM lists").get();
  if (listCount.count === 0) {
    const insert = db.prepare(
      "INSERT INTO lists (name, icon, color, light_bg, sort_order) VALUES (?, ?, ?, ?, ?)"
    );
    insert.run("Grocery List", "🛒", "#E8927C", "#FDF0ED", 0);
    insert.run("Packing List", "🧳", "#D4A574", "#FBF3EB", 1);
    insert.run("To-Do", "✅", "#7CAABD", "#EDF5F8", 2);
    insert.run("Travel Bucket List", "✈️", "#A3B88C", "#F0F5EA", 3);
  }

  // Seed default settings if empty
  const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get();
  if (settingsCount.count === 0) {
    const insert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
    insert.run("weather_location", "Toronto,CA");
    insert.run("temperature_unit", "metric");
    insert.run("family_name", "Family Hub");
  }
}

module.exports = { initSchema };
