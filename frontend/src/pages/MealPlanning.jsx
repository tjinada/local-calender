import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../hooks/useApi";
import { theme } from "../styles/theme";
import { getWeekDates, getWeekStart } from "../utils/dates";
import Header from "../components/Header";

const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast", icon: "🌅", color: "#F5E6D3", borderColor: "#E8C9A0" },
  { key: "lunch", label: "Lunch", icon: "☀️", color: "#D4EDDA", borderColor: "#A3D4AE" },
  { key: "dinner", label: "Dinner", icon: "🌙", color: "#E8DFF5", borderColor: "#C4B0E0" },
  { key: "snack", label: "Snack", icon: "🍎", color: "#FDE2E4", borderColor: "#F0B3B8" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MealPlanning() {
  const [meals, setMeals] = useState([]);
  const [groceryItems, setGroceryItems] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("plan");

  const [settings, setSettings] = useState({});

  const weekDates = useMemo(() => getWeekDates("sun"), []);
  const weekStart = weekDates[0].fullDate;
  const today = new Date();
  const currentMonth = today.toLocaleString("default", { month: "long" });
  const currentYear = today.getFullYear();

  useEffect(() => {
    apiFetch(`/meals?week=${weekStart}`).then(setMeals).catch(console.error);
    apiFetch(`/meals/grocery?week=${weekStart}`).then(setGroceryItems).catch(console.error);
    apiFetch("/settings").then(setSettings).catch(console.error);
  }, [weekStart]);

  const getMeal = (date, mealType) => meals.find((m) => m.date === date && m.meal_type === mealType);

  const toggleGrocery = async (item) => {
    try {
      const updated = await apiFetch(`/meals/grocery/${item.id}`, {
        method: "PUT",
        body: { checked: !item.checked },
      });
      setGroceryItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err) {
      console.error(err);
    }
  };

  const headerLeft = (
    <>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: theme.colors.textPrimary, letterSpacing: "-0.02em" }}>
        🍽️ Meal Plan
      </h1>
      <span style={{ fontSize: 14, color: theme.colors.textMuted, fontWeight: 600 }}>
        {currentMonth} {currentYear}
      </span>
      <div style={{ display: "flex", gap: 4 }}>
        <button style={navBtnStyle}>‹</button>
        <button style={navBtnStyle}>›</button>
      </div>
      <button style={todayBtnStyle}>This Week</button>
    </>
  );

  const headerRight = (
    <div style={{ display: "flex", gap: 10 }}>
      <button
        onClick={() => { setShowSidebar(!showSidebar || sidebarTab !== "grocery"); setSidebarTab("grocery"); }}
        style={{
          padding: "7px 16px", borderRadius: 10, border: "1px solid #E0DFD9",
          background: showSidebar && sidebarTab === "grocery" ? theme.colors.sidebarBg : "white",
          cursor: "pointer", fontSize: 12, fontWeight: 700, color: theme.colors.textPrimary,
          fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
        }}
      >
        🛒 Grocery List
        <span style={{ background: "#E8927C", color: "white", fontSize: 10, fontWeight: 800, padding: "1px 7px", borderRadius: 10 }}>
          {groceryItems.filter((i) => !i.checked).length}
        </span>
      </button>
      <button
        onClick={() => { setShowSidebar(!showSidebar || sidebarTab !== "plan"); setSidebarTab("plan"); }}
        style={{
          padding: "7px 16px", borderRadius: 10, border: "none",
          background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
          cursor: "pointer", fontSize: 12, fontWeight: 700, color: "white",
          fontFamily: "inherit", boxShadow: "0 2px 8px rgba(124,170,189,0.3)",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        ✨ Generate Plan
      </button>
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header leftContent={headerLeft} rightContent={headerRight} familyName={settings.family_name} />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Meal Grid */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "90px repeat(7, 1fr)", height: "100%" }}>
            {/* Day Header Row */}
            <div style={{ background: "white", borderBottom: `1px solid ${theme.colors.border}`, borderRight: `1px solid ${theme.colors.borderLight}`, position: "sticky", top: 0, zIndex: 5 }} />
            {weekDates.map((d) => (
              <div key={d.day} style={{
                background: d.isToday ? "#F5FAFB" : "white",
                borderBottom: `1px solid ${theme.colors.border}`, borderRight: `1px solid ${theme.colors.borderLight}`,
                padding: "12px 0", textAlign: "center", position: "sticky", top: 0, zIndex: 5,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: d.isToday ? theme.colors.accent : theme.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{d.day}</div>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: d.isToday ? theme.colors.accent : "transparent",
                  color: d.isToday ? "white" : theme.colors.textPrimary,
                  fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", margin: "3px auto 0",
                }}>{d.date}</div>
              </div>
            ))}

            {/* Meal Rows */}
            {MEAL_TYPES.map((meal) => (
              <MealRow key={meal.key} meal={meal} weekDates={weekDates} getMeal={getMeal} hoveredCell={hoveredCell} setHoveredCell={setHoveredCell} />
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        {showSidebar && (
          <div style={{
            width: 320, minWidth: 320, borderLeft: `1px solid ${theme.colors.border}`,
            background: "white", display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            <div style={{ display: "flex", borderBottom: `1px solid ${theme.colors.border}`, background: theme.colors.background }}>
              {[{ key: "plan", label: "✨ Generate" }, { key: "grocery", label: "🛒 Grocery" }].map((tab) => (
                <button key={tab.key} onClick={() => setSidebarTab(tab.key)} style={{
                  flex: 1, padding: "12px 0", border: "none",
                  borderBottom: sidebarTab === tab.key ? `2px solid ${theme.colors.accent}` : "2px solid transparent",
                  background: "transparent", fontSize: 12, fontWeight: 700,
                  color: sidebarTab === tab.key ? theme.colors.textPrimary : theme.colors.textMuted,
                  cursor: "pointer", fontFamily: "inherit",
                }}>{tab.label}</button>
              ))}
              <button onClick={() => setShowSidebar(false)} style={{ width: 40, border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: theme.colors.textMuted }}>✕</button>
            </div>

            {sidebarTab === "plan" ? (
              <GeneratePlanPanel />
            ) : (
              <GroceryListPanel items={groceryItems} onToggle={toggleGrocery} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MealRow({ meal, weekDates, getMeal, hoveredCell, setHoveredCell }) {
  return (
    <>
      <div style={{
        borderRight: `1px solid ${theme.colors.borderLight}`, borderBottom: `1px solid ${theme.colors.borderLight}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "16px 8px", background: theme.colors.background,
      }}>
        <span style={{ fontSize: 22 }}>{meal.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: theme.colors.textPrimary, marginTop: 4, textAlign: "center" }}>{meal.label}</span>
      </div>
      {weekDates.map((d) => {
        const mealData = getMeal(d.fullDate, meal.key);
        const cellKey = `${d.fullDate}-${meal.key}`;
        const isHovered = hoveredCell === cellKey;
        return (
          <div key={cellKey} onMouseEnter={() => setHoveredCell(cellKey)} onMouseLeave={() => setHoveredCell(null)} style={{
            borderRight: `1px solid ${theme.colors.borderLight}`, borderBottom: `1px solid ${theme.colors.borderLight}`,
            padding: 6, background: d.isToday ? "#F5FAFB" : "transparent", minHeight: 90, display: "flex", alignItems: "stretch",
          }}>
            {mealData ? (
              <div style={{
                flex: 1, background: meal.color, borderRadius: 12, padding: "10px", display: "flex",
                flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer",
                transition: "all 0.15s ease", transform: isHovered ? "scale(1.03)" : "scale(1)",
                boxShadow: isHovered ? `0 4px 12px ${meal.borderColor}50` : "0 1px 2px rgba(0,0,0,0.03)",
                border: `1.5px solid ${meal.borderColor}40`,
              }}>
                <span style={{ fontSize: 24 }}>{mealData.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: theme.colors.textPrimary, textAlign: "center", lineHeight: 1.25 }}>{mealData.name}</span>
              </div>
            ) : (
              <div style={{
                flex: 1, borderRadius: 12, border: "2px dashed #E0DFD9",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                transition: "all 0.15s ease", background: isHovered ? "#F5F4F0" : "transparent",
              }}>
                <span style={{ fontSize: 22, color: "#CCCBC6", fontWeight: 300 }}>+</span>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function GeneratePlanPanel() {
  return (
    <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: theme.colors.textPrimary }}>Create Meal Plan</h3>
      <p style={{ margin: "0 0 20px", fontSize: 12, color: theme.colors.textMuted, fontWeight: 600 }}>Let AI help plan your meals for the week</p>
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>Notes & Preferences</label>
        <textarea placeholder="e.g. No shellfish, love Italian food..." style={{
          width: "100%", height: 70, borderRadius: 10, border: "1.5px solid #E0DFD9",
          padding: "10px 12px", fontSize: 12, fontFamily: "inherit", resize: "none",
          outline: "none", boxSizing: "border-box", color: theme.colors.textPrimary,
        }} />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>Which days?</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["All", ...DAYS].map((d) => (
            <button key={d} style={{
              padding: "6px 12px", borderRadius: 8, border: "1.5px solid #E0DFD9",
              background: d === "All" ? theme.colors.accent : "white",
              color: d === "All" ? "white" : theme.colors.textSubtle,
              fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>{d}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>How many to feed?</label>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button key={n} style={{
              width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E0DFD9",
              background: n === 2 ? theme.colors.accent : "white",
              color: n === 2 ? "white" : theme.colors.textSubtle,
              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>{n}</button>
          ))}
        </div>
      </div>
      <button style={{
        width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
        background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
        color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
        boxShadow: "0 4px 12px rgba(124,170,189,0.35)", letterSpacing: "0.02em",
      }}>✨ Create Meal Plan</button>
    </div>
  );
}

function GroceryListPanel({ items, onToggle }) {
  const categories = [...new Set(items.map((i) => i.category))];
  const doneCount = items.filter((i) => i.checked).length;
  return (
    <div style={{ flex: 1, overflow: "auto" }}>
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: theme.colors.textPrimary }}>Grocery List</h3>
          <span style={{ fontSize: 11, fontWeight: 600, color: theme.colors.textMuted }}>{doneCount}/{items.length} done</span>
        </div>
        <div style={{ width: "100%", height: 4, borderRadius: 2, background: theme.colors.sidebarBg, marginTop: 10 }}>
          <div style={{
            width: items.length > 0 ? `${(doneCount / items.length) * 100}%` : "0%",
            height: "100%", borderRadius: 2,
            background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
            transition: "width 0.3s ease",
          }} />
        </div>
      </div>
      {categories.map((cat) => (
        <div key={cat} style={{ padding: "0 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", padding: "12px 0 6px" }}>{cat}</div>
          {items.filter((i) => i.category === cat).map((item) => (
            <div key={item.id} onClick={() => onToggle(item)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
              borderBottom: "1px solid #F5F4F0", cursor: "pointer", minHeight: 44,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                border: item.checked ? "none" : "2px solid #D0CFC9",
                background: item.checked ? theme.colors.accent : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {item.checked && <span style={{ color: "white", fontSize: 14, fontWeight: 800 }}>✓</span>}
              </div>
              <span style={{
                fontSize: 14, fontWeight: 600,
                color: item.checked ? "#BBBAB5" : theme.colors.textPrimary,
                textDecoration: item.checked ? "line-through" : "none",
              }}>{item.name}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const navBtnStyle = {
  width: 30, height: 30, borderRadius: 8, border: "1px solid #E0DFD9",
  background: "white", cursor: "pointer", fontSize: 14, color: "#6B6A65",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const todayBtnStyle = {
  padding: "5px 14px", borderRadius: 8, border: "1px solid #E0DFD9",
  background: "white", cursor: "pointer", fontSize: 12, fontWeight: 700,
  color: "#6B6A65", fontFamily: "inherit",
};
const labelStyle = { fontSize: 12, fontWeight: 700, color: theme.colors.textPrimary, display: "block", marginBottom: 8 };
