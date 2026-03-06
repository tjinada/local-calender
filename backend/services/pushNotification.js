const webpush = require("web-push");
const { getDb } = require("../db/database");

function initVapid() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("[PUSH] VAPID keys not configured, push notifications disabled");
    return false;
  }
  webpush.setVapidDetails(VAPID_EMAIL || "mailto:admin@familyhub.local", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log("[PUSH] VAPID push notifications enabled");
  return true;
}

function saveSubscription(subscription) {
  const db = getDb();
  db.prepare(`
    INSERT INTO push_subscriptions (endpoint, keys_p256dh, keys_auth)
    VALUES (?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET
      keys_p256dh = excluded.keys_p256dh,
      keys_auth = excluded.keys_auth
  `).run(subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth);
}

function removeSubscription(endpoint) {
  const db = getDb();
  db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(endpoint);
}

async function sendToAll(payload) {
  const db = getDb();
  const subs = db.prepare("SELECT * FROM push_subscriptions").all();
  const message = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
          },
          message
        )
        .catch((err) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            removeSubscription(sub.endpoint);
          }
          throw err;
        })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  console.log(`[PUSH] Sent to ${sent}/${subs.length} subscribers`);
  return sent;
}

module.exports = { initVapid, saveSubscription, removeSubscription, sendToAll };
