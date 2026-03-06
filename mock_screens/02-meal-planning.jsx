import { useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast", icon: "🌅", color: "#F5E6D3", borderColor: "#E8C9A0" },
  { key: "lunch", label: "Lunch", icon: "☀️", color: "#D4EDDA", borderColor: "#A3D4AE" },
  { key: "dinner", label: "Dinner", icon: "🌙", color: "#E8DFF5", borderColor: "#C4B0E0" },
  { key: "snack", label: "Snack", icon: "🍎", color: "#FDE2E4", borderColor: "#F0B3B8" },
];

function getWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);

  return DAYS.map((day, i) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    return {
      day,
      date: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
      month: date.toLocaleString("default", { month: "short" }),
      fullDate: date.toISOString().split("T")[0],
    };
  });
}

const weekDates = getWeekDates();

const SAMPLE_MEALS = {
  [weekDates[0].fullDate]: {
    breakfast: { name: "Blueberry Pancakes", emoji: "🫐🥞" },
    lunch: { name: "Homemade Pizza", emoji: "🍕" },
    dinner: { name: "Tacos", emoji: "🌮🌮🌮" },
    snack: { name: "Pretzels", emoji: "🥨" },
  },
  [weekDates[1].fullDate]: {
    breakfast: { name: "Eggs Benedict", emoji: "🍳" },
    lunch: { name: "Grilled Cheese", emoji: "🧀" },
    dinner: { name: "Hamburgers", emoji: "🍔" },
    snack: { name: "Apple", emoji: "🍎" },
  },
  [weekDates[2].fullDate]: {
    breakfast: { name: "Bagels", emoji: "🥯" },
    lunch: { name: "Salad Bowl", emoji: "🥗" },
    dinner: { name: "Spaghetti", emoji: "🍝" },
    snack: { name: "Banana", emoji: "🍌" },
  },
  [weekDates[3].fullDate]: {
    breakfast: { name: "Cereal", emoji: "🥣" },
    lunch: { name: "Hotdogs", emoji: "🌭" },
    dinner: { name: "Salmon & Broccoli", emoji: "🐟🥦" },
    snack: { name: "Pretzels", emoji: "🥨" },
  },
  [weekDates[4].fullDate]: {
    breakfast: { name: "Breakfast Burritos", emoji: "🌯" },
    lunch: { name: "Wraps", emoji: "🫔" },
    dinner: { name: "Mac & Cheese", emoji: "🧀🍝" },
    snack: { name: "Carrots & Hummus", emoji: "🥕" },
  },
  [weekDates[5].fullDate]: {
    breakfast: { name: "French Toast", emoji: "🍞" },
    lunch: { name: "Soup & Bread", emoji: "🍲🍞" },
    dinner: { name: "Stir Fry", emoji: "🥘" },
    snack: { name: "Trail Mix", emoji: "🥜" },
  },
  [weekDates[6].fullDate]: {
    breakfast: { name: "Smoothie Bowl", emoji: "🫐🍓" },
    lunch: { name: "Leftovers", emoji: "📦" },
    dinner: { name: "Chicken Curry", emoji: "🍛" },
    snack: { name: "Cookies", emoji: "🍪" },
  },
};

const NAV_ITEMS = [
  { icon: "📅", label: "Calendar" },
  { icon: "✅", label: "Tasks" },
  { icon: "🍽️", label: "Meals", active: true },
  { icon: "📝", label: "Lists" },
  { icon: "📸", label: "Photos" },
];

const BOTTOM_NAV = [{ icon: "⚙️", label: "Settings" }];

export default function MealPlanning() {
  const [activeNav, setActiveNav] = useState("Meals");
  const [hoveredCell, setHoveredCell] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("plan");

  const today = new Date();
  const currentMonth = today.toLocaleString("default", { month: "long" });
  const currentYear = today.getFullYear();

  const GROCERY_ITEMS = [
    { name: "Blueberries", checked: false, category: "Produce" },
    { name: "Broccoli", checked: false, category: "Produce" },
    { name: "Carrots", checked: true, category: "Produce" },
    { name: "Bananas", checked: false, category: "Produce" },
    { name: "Salmon Fillets", checked: false, category: "Protein" },
    { name: "Ground Beef", checked: true, category: "Protein" },
    { name: "Chicken Breast", checked: false, category: "Protein" },
    { name: "Eggs (1 dozen)", checked: false, category: "Dairy" },
    { name: "Shredded Cheese", checked: false, category: "Dairy" },
    { name: "Spaghetti Noodles", checked: true, category: "Pantry" },
    { name: "Taco Shells", checked: false, category: "Pantry" },
    { name: "Curry Paste", checked: false, category: "Pantry" },
    { name: "Bagels (6-pack)", checked: false, category: "Bakery" },
    { name: "Bread Loaf", checked: true, category: "Bakery" },
  ];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        fontFamily: "'Nunito', 'Segoe UI', sans-serif",
        background: "#FAFAF7",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Sidebar Navigation */}
      <div
        style={{
          width: 78,
          minWidth: 78,
          background: "#F0EFEA",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 20,
          paddingBottom: 16,
          borderRight: "1px solid #E5E4DF",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "linear-gradient(135deg, #7CAABD, #5B8FA3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 20,
              fontWeight: 800,
              marginBottom: 20,
              boxShadow: "0 2px 8px rgba(124,170,189,0.3)",
            }}
          >
            H
          </div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              style={{
                width: 60,
                height: 56,
                borderRadius: 14,
                border: "none",
                background: activeNav === item.label ? "white" : "transparent",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                transition: "all 0.2s ease",
                boxShadow: activeNav === item.label ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: activeNav === item.label ? 700 : 600,
                  color: activeNav === item.label ? "#3D5A5B" : "#9B9A95",
                  letterSpacing: "0.02em",
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
        <div>
          {BOTTOM_NAV.map((item) => (
            <button
              key={item.label}
              style={{
                width: 60,
                height: 56,
                borderRadius: 14,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: "#9B9A95" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top Header */}
        <div
          style={{
            height: 56,
            minHeight: 56,
            background: "white",
            borderBottom: "1px solid #E8E7E3",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                color: "#2D3B3C",
                letterSpacing: "-0.02em",
              }}
            >
              🍽️ Meal Plan
            </h1>
            <span style={{ fontSize: 14, color: "#9B9A95", fontWeight: 600 }}>
              {currentMonth} {currentYear}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: "1px solid #E0DFD9",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#6B6A65",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ‹
              </button>
              <button
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: "1px solid #E0DFD9",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#6B6A65",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ›
              </button>
            </div>
            <button
              style={{
                padding: "5px 14px",
                borderRadius: 8,
                border: "1px solid #E0DFD9",
                background: "white",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                color: "#6B6A65",
                fontFamily: "inherit",
              }}
            >
              This Week
            </button>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { setShowSidebar(!showSidebar); setSidebarTab("grocery"); }}
              style={{
                padding: "7px 16px",
                borderRadius: 10,
                border: "1px solid #E0DFD9",
                background: showSidebar && sidebarTab === "grocery" ? "#F0EFEA" : "white",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                color: "#2D3B3C",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              🛒 Grocery List
              <span style={{
                background: "#E8927C",
                color: "white",
                fontSize: 10,
                fontWeight: 800,
                padding: "1px 7px",
                borderRadius: 10,
              }}>
                {GROCERY_ITEMS.filter(i => !i.checked).length}
              </span>
            </button>
            <button
              onClick={() => { setShowSidebar(!showSidebar); setSidebarTab("plan"); }}
              style={{
                padding: "7px 16px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #7CAABD, #5B8FA3)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                color: "white",
                fontFamily: "inherit",
                boxShadow: "0 2px 8px rgba(124,170,189,0.3)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ✨ Generate Plan
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Meal Grid */}
          <div style={{ flex: 1, overflow: "auto", padding: 0 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "90px repeat(7, 1fr)",
                gridTemplateRows: "auto",
                height: "100%",
              }}
            >
              {/* Day Header Row */}
              <div
                style={{
                  background: "white",
                  borderBottom: "1px solid #E8E7E3",
                  borderRight: "1px solid #F0EFEA",
                  position: "sticky",
                  top: 0,
                  zIndex: 5,
                }}
              />
              {weekDates.map((d) => (
                <div
                  key={d.day}
                  style={{
                    background: d.isToday ? "#F5FAFB" : "white",
                    borderBottom: "1px solid #E8E7E3",
                    borderRight: "1px solid #F0EFEA",
                    padding: "12px 0",
                    textAlign: "center",
                    position: "sticky",
                    top: 0,
                    zIndex: 5,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: d.isToday ? "#7CAABD" : "#9B9A95",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {d.day}
                  </div>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: d.isToday ? "#7CAABD" : "transparent",
                      color: d.isToday ? "white" : "#2D3B3C",
                      fontSize: 15,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "3px auto 0",
                    }}
                  >
                    {d.date}
                  </div>
                </div>
              ))}

              {/* Meal Rows */}
              {MEAL_TYPES.map((meal) => (
                <>
                  {/* Row Label */}
                  <div
                    key={`label-${meal.key}`}
                    style={{
                      borderRight: "1px solid #F0EFEA",
                      borderBottom: "1px solid #F0EFEA",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "16px 8px",
                      background: "#FAFAF7",
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{meal.icon}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#2D3B3C",
                        marginTop: 4,
                        textAlign: "center",
                      }}
                    >
                      {meal.label}
                    </span>
                  </div>

                  {/* Day Cells */}
                  {weekDates.map((d) => {
                    const mealData = SAMPLE_MEALS[d.fullDate]?.[meal.key];
                    const cellKey = `${d.fullDate}-${meal.key}`;
                    const isHovered = hoveredCell === cellKey;

                    return (
                      <div
                        key={cellKey}
                        onMouseEnter={() => setHoveredCell(cellKey)}
                        onMouseLeave={() => setHoveredCell(null)}
                        style={{
                          borderRight: "1px solid #F0EFEA",
                          borderBottom: "1px solid #F0EFEA",
                          padding: 6,
                          background: d.isToday ? "#F5FAFB" : "transparent",
                          position: "relative",
                          minHeight: 90,
                          display: "flex",
                          alignItems: "stretch",
                        }}
                      >
                        {mealData ? (
                          <div
                            style={{
                              flex: 1,
                              background: meal.color,
                              borderRadius: 12,
                              padding: "10px 10px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              transform: isHovered ? "scale(1.03)" : "scale(1)",
                              boxShadow: isHovered
                                ? `0 4px 12px ${meal.borderColor}50`
                                : "0 1px 2px rgba(0,0,0,0.03)",
                              border: `1.5px solid ${meal.borderColor}40`,
                            }}
                          >
                            <span style={{ fontSize: 24 }}>{mealData.emoji}</span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#2D3B3C",
                                textAlign: "center",
                                lineHeight: 1.25,
                              }}
                            >
                              {mealData.name}
                            </span>
                          </div>
                        ) : (
                          <div
                            style={{
                              flex: 1,
                              borderRadius: 12,
                              border: "2px dashed #E0DFD9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              background: isHovered ? "#F5F4F0" : "transparent",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 22,
                                color: "#CCCBC6",
                                fontWeight: 300,
                              }}
                            >
                              +
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>

          {/* Right Sidebar (Grocery List / Generate Plan) */}
          {showSidebar && (
            <div
              style={{
                width: 320,
                minWidth: 320,
                borderLeft: "1px solid #E8E7E3",
                background: "white",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                animation: "slideIn 0.2s ease",
              }}
            >
              {/* Sidebar Tabs */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid #E8E7E3",
                  background: "#FAFAF7",
                }}
              >
                {[
                  { key: "plan", label: "✨ Generate Plan" },
                  { key: "grocery", label: "🛒 Grocery" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSidebarTab(tab.key)}
                    style={{
                      flex: 1,
                      padding: "12px 0",
                      border: "none",
                      borderBottom: sidebarTab === tab.key ? "2px solid #7CAABD" : "2px solid transparent",
                      background: "transparent",
                      fontSize: 12,
                      fontWeight: 700,
                      color: sidebarTab === tab.key ? "#2D3B3C" : "#9B9A95",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowSidebar(false)}
                  style={{
                    width: 40,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 16,
                    color: "#9B9A95",
                  }}
                >
                  ✕
                </button>
              </div>

              {sidebarTab === "plan" ? (
                <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: "#2D3B3C" }}>
                    Create Meal Plan
                  </h3>
                  <p style={{ margin: "0 0 20px", fontSize: 12, color: "#9B9A95", fontWeight: 600 }}>
                    Let AI help plan your meals for the week
                  </p>

                  {/* Preferences */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#2D3B3C", display: "block", marginBottom: 6 }}>
                      Notes & Preferences
                    </label>
                    <textarea
                      placeholder="e.g. No shellfish, love Italian food, kid-friendly..."
                      style={{
                        width: "100%",
                        height: 70,
                        borderRadius: 10,
                        border: "1.5px solid #E0DFD9",
                        padding: "10px 12px",
                        fontSize: 12,
                        fontFamily: "inherit",
                        resize: "none",
                        outline: "none",
                        boxSizing: "border-box",
                        color: "#2D3B3C",
                      }}
                    />
                  </div>

                  {/* Which Days */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#2D3B3C", display: "block", marginBottom: 8 }}>
                      Which days?
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {["All", ...DAYS].map((d) => (
                        <button
                          key={d}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1.5px solid #E0DFD9",
                            background: d === "All" ? "#7CAABD" : "white",
                            color: d === "All" ? "white" : "#6B6A65",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* How many mouths */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#2D3B3C", display: "block", marginBottom: 8 }}>
                      How many to feed?
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <button
                          key={n}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            border: "1.5px solid #E0DFD9",
                            background: n === 2 ? "#7CAABD" : "white",
                            color: n === 2 ? "white" : "#6B6A65",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Which meals */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#2D3B3C", display: "block", marginBottom: 8 }}>
                      Which meals?
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {MEAL_TYPES.map((m) => (
                        <label
                          key={m.key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 12px",
                            borderRadius: 10,
                            background: "#F7F6F2",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 6,
                              border: "2px solid #7CAABD",
                              background: "#7CAABD",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span style={{ color: "white", fontSize: 12, fontWeight: 800 }}>✓</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#2D3B3C" }}>
                            {m.icon} {m.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Auto grocery list toggle */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: "#F7F6F2",
                      borderRadius: 12,
                      marginBottom: 20,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#2D3B3C" }}>
                      🛒 Auto-generate grocery list
                    </span>
                    <div
                      style={{
                        width: 42,
                        height: 24,
                        borderRadius: 12,
                        background: "#7CAABD",
                        padding: 2,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "white",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    style={{
                      width: "100%",
                      padding: "14px 0",
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg, #7CAABD, #5B8FA3)",
                      color: "white",
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      boxShadow: "0 4px 12px rgba(124,170,189,0.35)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    ✨ Create Meal Plan
                  </button>
                </div>
              ) : (
                /* Grocery List Tab */
                <div style={{ flex: 1, overflow: "auto", padding: 0 }}>
                  <div style={{ padding: "16px 20px 8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#2D3B3C" }}>
                        Grocery List
                      </h3>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#9B9A95" }}>
                        {GROCERY_ITEMS.filter((i) => i.checked).length}/{GROCERY_ITEMS.length} done
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div
                      style={{
                        width: "100%",
                        height: 4,
                        borderRadius: 2,
                        background: "#F0EFEA",
                        marginTop: 10,
                      }}
                    >
                      <div
                        style={{
                          width: `${(GROCERY_ITEMS.filter((i) => i.checked).length / GROCERY_ITEMS.length) * 100}%`,
                          height: "100%",
                          borderRadius: 2,
                          background: "linear-gradient(90deg, #7CAABD, #5B8FA3)",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Grouped items */}
                  {["Produce", "Protein", "Dairy", "Pantry", "Bakery"].map((cat) => {
                    const items = GROCERY_ITEMS.filter((i) => i.category === cat);
                    if (items.length === 0) return null;
                    return (
                      <div key={cat} style={{ padding: "0 20px" }}>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: "#9B9A95",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            padding: "12px 0 6px",
                          }}
                        >
                          {cat}
                        </div>
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "9px 0",
                              borderBottom: "1px solid #F5F4F0",
                              cursor: "pointer",
                            }}
                          >
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 7,
                                border: item.checked ? "none" : "2px solid #D0CFC9",
                                background: item.checked ? "#7CAABD" : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {item.checked && (
                                <span style={{ color: "white", fontSize: 12, fontWeight: 800 }}>✓</span>
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: item.checked ? "#BBBAB5" : "#2D3B3C",
                                textDecoration: item.checked ? "line-through" : "none",
                              }}
                            >
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  {/* Add item */}
                  <div style={{ padding: "14px 20px 20px" }}>
                    <button
                      style={{
                        width: "100%",
                        padding: "10px 0",
                        borderRadius: 10,
                        border: "2px dashed #D0CFC9",
                        background: "transparent",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#9B9A95",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      + Add item
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
