import { useState, useEffect } from "react";
import { apiFetch } from "../hooks/useApi";
import { theme } from "../styles/theme";
import Header from "../components/Header";

export default function SharedLists() {
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [settings, setSettings] = useState({});

  const today = new Date();
  const currentDay = today.toLocaleString("default", { weekday: "short" });
  const currentDate = today.toLocaleString("default", { month: "short", day: "numeric" });
  const currentTime = today.toLocaleString("default", { hour: "numeric", minute: "2-digit" });

  useEffect(() => {
    apiFetch("/lists").then(setLists).catch(console.error);
    apiFetch("/settings").then(setSettings).catch(console.error);
  }, []);

  const toggleItem = async (listId, itemId, currentChecked) => {
    try {
      const updated = await apiFetch(`/lists/${listId}/items/${itemId}`, {
        method: "PUT",
        body: { checked: !currentChecked },
      });
      setLists((prev) =>
        prev.map((list) => {
          if (list.id !== listId) return list;
          return { ...list, items: list.items.map((item) => (item.id === itemId ? updated : item)) };
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  const addItem = async (listId, text) => {
    try {
      const item = await apiFetch(`/lists/${listId}/items`, { method: "POST", body: { text } });
      setLists((prev) =>
        prev.map((list) => {
          if (list.id !== listId) return list;
          return { ...list, items: [...list.items, item] };
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  const getStats = (list) => {
    const done = list.items.filter((i) => i.checked).length;
    return { done, total: list.items.length };
  };

  const headerLeft = selectedList ? (
    <>
      <button onClick={() => setSelectedList(null)} style={{
        width: 32, height: 32, borderRadius: 8, border: "1px solid #E0DFD9",
        background: "white", cursor: "pointer", fontSize: 16, color: "#6B6A65",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>←</button>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: theme.colors.textPrimary, letterSpacing: "-0.02em" }}>
        {lists.find((l) => l.id === selectedList)?.icon} {lists.find((l) => l.id === selectedList)?.name}
      </h1>
    </>
  ) : (
    <>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: theme.colors.textPrimary, letterSpacing: "-0.02em" }}>📝 Lists</h1>
      <span style={{ fontSize: 14, color: theme.colors.textMuted, fontWeight: 600 }}>{currentDay}, {currentDate} · {currentTime}</span>
    </>
  );

  const headerRight = (
    <button style={{
      padding: "7px 16px", borderRadius: 10, border: "none",
      background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
      cursor: "pointer", fontSize: 12, fontWeight: 700, color: "white", fontFamily: "inherit",
      boxShadow: "0 2px 8px rgba(124,170,189,0.3)", display: "flex", alignItems: "center", gap: 6,
    }}>+ New List</button>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header leftContent={headerLeft} rightContent={headerRight} familyName={settings.family_name} />

      <div style={{ flex: 1, overflow: "auto" }}>
        {!selectedList ? (
          <ColumnView lists={lists} onToggle={toggleItem} onSelect={setSelectedList} getStats={getStats} />
        ) : (
          <DetailView list={lists.find((l) => l.id === selectedList)} onToggle={toggleItem} onAddItem={addItem} getStats={getStats} />
        )}
      </div>

      <button style={{
        position: "fixed", bottom: 24, right: 24, width: 52, height: 52, borderRadius: 16,
        border: "none", background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
        color: "white", fontSize: 26, fontWeight: 300, cursor: "pointer",
        boxShadow: "0 4px 16px rgba(124,170,189,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
      }}>+</button>
    </div>
  );
}

function ColumnView({ lists, onToggle, onSelect, getStats }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${lists.length}, 1fr)`, height: "100%" }}>
      {lists.map((list) => {
        const stats = getStats(list);
        return (
          <div key={list.id} style={{ borderRight: `1px solid ${theme.colors.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div onClick={() => onSelect(list.id)} style={{
              padding: "16px 20px 12px", background: "white", borderBottom: `1px solid ${theme.colors.border}`,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 2,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{list.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: theme.colors.textPrimary }}>{list.name}</span>
              </div>
              <div style={{ background: list.light_bg, color: list.color, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 10 }}>
                {stats.total - stats.done} items
              </div>
            </div>
            <div style={{ width: "100%", height: 3, background: theme.colors.sidebarBg }}>
              <div style={{ width: stats.total > 0 ? `${(stats.done / stats.total) * 100}%` : "0%", height: "100%", background: list.color, transition: "width 0.3s ease", borderRadius: "0 2px 2px 0" }} />
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "4px 0" }}>
              {list.items.map((item) => (
                <div key={item.id} onClick={() => onToggle(list.id, item.id, item.checked)} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", cursor: "pointer", borderBottom: "1px solid #F5F4F0",
                  minHeight: 48,
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    border: item.checked ? "none" : `2px solid ${list.color}50`,
                    background: item.checked ? list.color : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {item.checked && <span style={{ color: "white", fontSize: 16, fontWeight: 800 }}>✓</span>}
                  </div>
                  <span style={{
                    fontSize: 15, fontWeight: 600,
                    color: item.checked ? "#C0BFB9" : theme.colors.textPrimary,
                    textDecoration: item.checked ? "line-through" : "none",
                  }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailView({ list, onToggle, onAddItem, getStats }) {
  const [newItem, setNewItem] = useState("");
  if (!list) return null;
  const stats = getStats(list);
  const unchecked = list.items.filter((i) => !i.checked);
  const checked = list.items.filter((i) => i.checked);

  const handleAdd = () => {
    if (!newItem.trim()) return;
    onAddItem(list.id, newItem.trim());
    setNewItem("");
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 32px" }}>
      {/* Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Remaining", value: stats.total - stats.done, color: theme.colors.textPrimary },
          { label: "Completed", value: stats.done, color: list.color },
          { label: "Progress", value: stats.total > 0 ? `${Math.round((stats.done / stats.total) * 100)}%` : "0%", color: theme.colors.textPrimary },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: "white", borderRadius: 14, padding: "16px 20px", border: `1px solid ${theme.colors.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ width: "100%", height: 6, borderRadius: 3, background: theme.colors.sidebarBg, marginBottom: 28 }}>
        <div style={{ width: stats.total > 0 ? `${(stats.done / stats.total) * 100}%` : "0%", height: "100%", borderRadius: 3, background: list.color, transition: "width 0.3s ease" }} />
      </div>

      {/* Active Items */}
      <div style={{ background: "white", borderRadius: 16, border: `1px solid ${theme.colors.border}`, overflow: "hidden", marginBottom: 20 }}>
        {unchecked.map((item) => (
          <div key={item.id} onClick={() => onToggle(list.id, item.id, item.checked)} style={{
            display: "flex", alignItems: "center", gap: 16, padding: "16px 22px", cursor: "pointer", borderBottom: "1px solid #F5F4F0",
            minHeight: 52,
          }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, border: `2px solid ${list.color}60`, flexShrink: 0 }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary }}>{item.text}</span>
          </div>
        ))}
        {/* Add row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 22px" }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, border: "2px dashed #D8D7D2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16, color: "#D0CFC9" }}>+</span>
          </div>
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add item"
            style={{
              border: "none", outline: "none", fontSize: 14, fontWeight: 600,
              color: theme.colors.textPrimary, fontFamily: "inherit", flex: 1, background: "transparent",
            }}
          />
        </div>
      </div>

      {/* Completed */}
      {checked.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", padding: "8px 0 10px" }}>
            Completed ({checked.length})
          </div>
          <div style={{ background: "white", borderRadius: 16, border: `1px solid ${theme.colors.border}`, overflow: "hidden" }}>
            {checked.map((item) => (
              <div key={item.id} onClick={() => onToggle(list.id, item.id, item.checked)} style={{
                display: "flex", alignItems: "center", gap: 16, padding: "14px 22px", cursor: "pointer", borderBottom: "1px solid #F5F4F0",
                minHeight: 48,
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: list.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "white", fontSize: 16, fontWeight: 800 }}>✓</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#C0BFB9", textDecoration: "line-through" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
