import { theme } from "../styles/theme";

const NAV_ITEMS = [
  { icon: "📅", label: "Calendar", path: "/" },
  { icon: "✅", label: "Tasks", path: "/tasks" },
  { icon: "🍽️", label: "Meals", path: "/meals" },
  { icon: "📝", label: "Lists", path: "/lists" },
  { icon: "📸", label: "Photos", path: "/photos" },
];

const BOTTOM_NAV = [{ icon: "⚙️", label: "Settings", path: "/settings" }];

export default function Sidebar({ activePath, onNavigate }) {
  return (
    <div
      style={{
        width: theme.layout.sidebarWidth,
        minWidth: theme.layout.sidebarWidth,
        background: theme.colors.sidebarBg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 20,
        paddingBottom: 16,
        borderRight: `1px solid #E5E4DF`,
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        {/* Logo */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 20,
            fontWeight: 800,
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(124,170,189,0.3)",
            cursor: "pointer",
          }}
          onClick={() => onNavigate("/")}
        >
          H
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = activePath === item.path || (item.path === "/" && activePath === "");
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.path)}
              style={{
                width: 64,
                height: 60,
                borderRadius: 14,
                border: "none",
                background: isActive ? "white" : "transparent",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                transition: "all 0.15s ease",
                boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                fontFamily: theme.fonts.family,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? "#3D5A5B" : theme.colors.textMuted,
                  letterSpacing: "0.02em",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <div>
        {BOTTOM_NAV.map((item) => {
          const isActive = activePath === item.path;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.path)}
              style={{
                width: 60,
                height: 56,
                borderRadius: 14,
                border: "none",
                background: isActive ? "white" : "transparent",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                fontFamily: theme.fonts.family,
                boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: theme.colors.textMuted }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
