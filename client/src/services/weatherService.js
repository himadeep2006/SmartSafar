const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const weatherDescriptions = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
  56: "Freezing drizzle", 57: "Heavy freezing drizzle", 61: "Light rain", 63: "Rain",
  65: "Heavy rain", 66: "Freezing rain", 67: "Heavy freezing rain", 71: "Light snow",
  73: "Snow", 75: "Heavy snow", 77: "Snow grains", 80: "Rain showers", 81: "Showers",
  82: "Heavy showers", 85: "Snow showers", 86: "Heavy snow showers", 95: "Thunderstorm",
  96: "Thunderstorm with hail", 99: "Severe thunderstorm with hail",
};

export async function getDestinationWeather(latitude, longitude, { signal } = {}) {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("Weather is unavailable for this location.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener("abort", abortFromCaller, { once: true });
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    forecast_days: "3",
    timezone: "auto",
  });

  try {
    const response = await fetch(`${FORECAST_URL}?${params}`, { signal: controller.signal });
    if (!response.ok) throw new Error("Weather service is temporarily unavailable.");
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("Weather data is temporarily unavailable.");
    }
    if (!data.current || !Array.isArray(data.daily?.time) || !data.daily.time.length) {
      throw new Error("Weather data is not available for this location right now.");
    }
    return {
      temperature: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      condition: weatherDescriptions[data.current.weather_code] || "Current conditions",
      forecast: data.daily.time.map((date, index) => ({
        date,
        condition: weatherDescriptions[data.daily.weather_code?.[index]] || "Forecast",
        high: data.daily.temperature_2m_max?.[index],
        low: data.daily.temperature_2m_min?.[index],
      })),
      updatedAt: data.current.time,
    };
  } catch (error) {
    if (error.name === "AbortError" && !signal?.aborted) {
      throw new Error("Weather request timed out. Please try again.");
    }
    if (signal?.aborted) throw error;
    const friendlyErrors = new Set([
      "Weather service is temporarily unavailable.",
      "Weather data is temporarily unavailable.",
      "Weather data is not available for this location right now.",
    ]);
    throw new Error(friendlyErrors.has(error.message) ? error.message : "Weather service could not be reached. Check your connection and try again.");
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
