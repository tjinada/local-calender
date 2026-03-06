const { Router } = require("express");
const { getDb } = require("../db/database");

const router = Router();

// Cache weather data for 15 minutes
let weatherCache = { data: null, timestamp: 0 };
const CACHE_DURATION = 15 * 60 * 1000;

router.get("/", async (req, res, next) => {
  try {
    const now = Date.now();
    if (weatherCache.data && now - weatherCache.timestamp < CACHE_DURATION) {
      return res.json(weatherCache.data);
    }

    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return res.json({
        temp: "--",
        icon: "🌤️",
        condition: "No API key",
        configured: false,
      });
    }

    const db = getDb();
    const locationSetting = db.prepare("SELECT value FROM settings WHERE key = 'weather_location'").get();
    const location = locationSetting?.value || process.env.WEATHER_LOCATION || "Toronto,CA";
    const unitSetting = db.prepare("SELECT value FROM settings WHERE key = 'temperature_unit'").get();
    const units = unitSetting?.value || "metric";

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=${units}&appid=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== 200) {
      return res.json({ temp: "--", icon: "❓", condition: data.message || "Error", configured: true });
    }

    const weatherIcons = {
      "01d": "☀️", "01n": "🌙", "02d": "⛅", "02n": "☁️",
      "03d": "☁️", "03n": "☁️", "04d": "☁️", "04n": "☁️",
      "09d": "🌧️", "09n": "🌧️", "10d": "🌦️", "10n": "🌧️",
      "11d": "⛈️", "11n": "⛈️", "13d": "🌨️", "13n": "🌨️",
      "50d": "🌫️", "50n": "🌫️",
    };

    const result = {
      temp: `${Math.round(data.main.temp)}°`,
      icon: weatherIcons[data.weather[0]?.icon] || "🌤️",
      condition: data.weather[0]?.main || "Unknown",
      feels_like: `${Math.round(data.main.feels_like)}°`,
      humidity: data.main.humidity,
      configured: true,
    };

    weatherCache = { data: result, timestamp: now };
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
