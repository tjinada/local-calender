import { useState, useEffect, useRef } from "react";
import { theme } from "../styles/theme";

const LAYOUTS = {
  lower: [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["shift", "z", "x", "c", "v", "b", "n", "m", "backspace"],
    ["123", "space", ".", "done"],
  ],
  upper: [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["shift", "Z", "X", "C", "V", "B", "N", "M", "backspace"],
    ["123", "space", ".", "done"],
  ],
  numbers: [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["-", "/", ":", ";", "(", ")", "$", "&", "@", '"'],
    ["#+=", ".", ",", "?", "!", "'", "backspace"],
    ["abc", "space", ".", "done"],
  ],
};

const SPECIAL_KEYS = {
  shift: { label: "⇧", width: 1.4 },
  backspace: { label: "⌫", width: 1.4 },
  space: { label: " ", width: 4 },
  done: { label: "Done", width: 1.4 },
  "123": { label: "123", width: 1.4 },
  abc: { label: "ABC", width: 1.4 },
  "#+=": { label: "#+=", width: 1.4 },
};

export default function VirtualKeyboard() {
  const [visible, setVisible] = useState(false);
  const [layout, setLayout] = useState("lower");
  const [activeInput, setActiveInput] = useState(null);
  const keyboardRef = useRef(null);

  useEffect(() => {
    function handleFocusIn(e) {
      const tag = e.target.tagName;
      const type = e.target.type;
      // Show keyboard for text inputs, textareas, and contenteditable
      if (
        tag === "INPUT" && ["text", "search", "email", "url", "tel", "password", ""].includes(type) ||
        tag === "TEXTAREA" ||
        e.target.contentEditable === "true"
      ) {
        setActiveInput(e.target);
        setVisible(true);
      }
    }

    function handleFocusOut(e) {
      // Delay hide to allow keyboard tap to register
      setTimeout(() => {
        if (keyboardRef.current && keyboardRef.current.contains(document.activeElement)) return;
        // Don't hide if the new focus is another input
        const active = document.activeElement;
        if (
          active?.tagName === "INPUT" ||
          active?.tagName === "TEXTAREA" ||
          active?.contentEditable === "true"
        ) return;
        setVisible(false);
        setActiveInput(null);
      }, 150);
    }

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  const handleKey = (key) => {
    if (!activeInput) return;

    // Keep focus on input
    activeInput.focus();

    if (key === "done") {
      setVisible(false);
      activeInput.blur();
      return;
    }
    if (key === "shift") {
      setLayout((l) => (l === "lower" ? "upper" : "lower"));
      return;
    }
    if (key === "123") {
      setLayout("numbers");
      return;
    }
    if (key === "abc" || key === "#+=") {
      setLayout("lower");
      return;
    }
    if (key === "backspace") {
      // Trigger backspace via input event
      const start = activeInput.selectionStart;
      const end = activeInput.selectionEnd;
      if (start === end && start > 0) {
        const val = activeInput.value;
        activeInput.value = val.slice(0, start - 1) + val.slice(end);
        activeInput.selectionStart = activeInput.selectionEnd = start - 1;
      } else if (start !== end) {
        const val = activeInput.value;
        activeInput.value = val.slice(0, start) + val.slice(end);
        activeInput.selectionStart = activeInput.selectionEnd = start;
      }
      triggerInputEvent(activeInput);
      return;
    }
    if (key === "space") {
      insertText(activeInput, " ");
      return;
    }

    insertText(activeInput, key);

    // Auto-shift back to lowercase after typing one uppercase letter
    if (layout === "upper") setLayout("lower");
  };

  function insertText(input, text) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const val = input.value;
    input.value = val.slice(0, start) + text + val.slice(end);
    input.selectionStart = input.selectionEnd = start + text.length;
    triggerInputEvent(input);
  }

  function triggerInputEvent(input) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, "value"
    )?.set || Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, "value"
    )?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, input.value);
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  if (!visible) return null;

  const currentLayout = LAYOUTS[layout] || LAYOUTS.lower;

  return (
    <div
      ref={keyboardRef}
      onMouseDown={(e) => e.preventDefault()} // Prevent stealing focus from input
      onTouchStart={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#D1D5DB",
        padding: "8px 4px 12px",
        zIndex: 10000,
        fontFamily: theme.fonts.family,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {currentLayout.map((row, rowIdx) => (
        <div key={rowIdx} style={{ display: "flex", justifyContent: "center", gap: 5 }}>
          {row.map((key) => {
            const special = SPECIAL_KEYS[key];
            const isActive = key === "shift" && layout === "upper";
            const width = special?.width || 1;

            return (
              <button
                key={key}
                onMouseDown={(e) => { e.preventDefault(); handleKey(key); }}
                onTouchStart={(e) => { e.preventDefault(); handleKey(key); }}
                style={{
                  flex: width,
                  height: 48,
                  borderRadius: 8,
                  border: "none",
                  background: key === "done"
                    ? theme.colors.accent
                    : special
                      ? isActive ? "#8B9DAF" : "#A8B4C0"
                      : "white",
                  color: key === "done" ? "white" : "#1C1C1E",
                  fontSize: special ? 14 : 18,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                }}
              >
                {special?.label || key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
