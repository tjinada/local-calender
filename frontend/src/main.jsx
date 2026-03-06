import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registerSW } from "./utils/registerSW";
import "./styles/touch.css";

// Register service worker for PWA + push notifications
registerSW();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
