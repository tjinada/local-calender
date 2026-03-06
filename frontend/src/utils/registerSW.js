export function registerSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        console.log("[SW] Registered:", reg.scope);
      } catch (err) {
        console.error("[SW] Registration failed:", err);
      }
    });
  }
}
