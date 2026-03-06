import { useState, useEffect } from "react";
import { apiFetch } from "./useApi";

export function usePush() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    setSupported("serviceWorker" in navigator && "PushManager" in window);
  }, []);

  async function subscribe() {
    if (!supported) return false;
    try {
      const { key } = await apiFetch("/notifications/vapid-key");
      if (!key) return false;

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      await apiFetch("/notifications/subscribe", {
        method: "POST",
        body: { subscription: sub.toJSON() },
      });

      setSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscribe failed:", err);
      return false;
    }
  }

  async function unsubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await apiFetch("/notifications/unsubscribe", {
          method: "POST",
          body: { endpoint: sub.endpoint },
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    }
  }

  // Check existing subscription on mount
  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, [supported]);

  return { supported, subscribed, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
