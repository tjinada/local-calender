const { Router } = require("express");
const { saveSubscription, removeSubscription, sendToAll } = require("../services/pushNotification");

const router = Router();

// Get VAPID public key
router.get("/vapid-key", (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return res.json({ key: null, enabled: false });
  res.json({ key, enabled: true });
});

// Subscribe to push
router.post("/subscribe", (req, res) => {
  const { subscription } = req.body;
  if (!subscription?.endpoint || !subscription?.keys) {
    return res.status(400).json({ error: "Invalid subscription object" });
  }
  saveSubscription(subscription);
  res.status(201).json({ success: true });
});

// Unsubscribe
router.post("/unsubscribe", (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: "endpoint required" });
  removeSubscription(endpoint);
  res.json({ success: true });
});

// Send notification to all subscribers (internal use)
router.post("/send", async (req, res, next) => {
  try {
    const { title, body, url } = req.body;
    if (!title) return res.status(400).json({ error: "title required" });
    const sent = await sendToAll({ title, body: body || "", url: url || "/" });
    res.json({ sent });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
