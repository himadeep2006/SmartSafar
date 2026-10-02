import React, { useCallback, useEffect, useState } from "react";
import { FaCloudSun, FaTint, FaWind, FaThermometerHalf } from "react-icons/fa";
import Card from "./Card";
import Button from "./Button";
import { getDestinationWeather } from "../services/weatherService";

function displayDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function WeatherPanel({ destination }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const loadWeather = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      setWeather(await getDestinationWeather(destination.latitude, destination.longitude, { signal }));
    } catch (requestError) {
      if (!signal.aborted) setError(requestError.message || "Weather is temporarily unavailable.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [destination.latitude, destination.longitude]);

  useEffect(() => {
    const controller = new AbortController();
    loadWeather(controller.signal);
    return () => controller.abort();
  }, [loadWeather, attempt]);

  return (
    <Card variant="darkGlass" hoverable={false} className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10 text-amber-300"><FaCloudSun /></span>
        <div><h2 className="font-bold text-white">Local weather</h2><p className="text-xs text-slate-400">Open-Meteo forecast</p></div>
      </div>
      {loading ? (
        <div role="status" aria-label="Loading local weather" className="space-y-3">
          <div className="h-12 w-28 animate-pulse rounded-lg bg-white/10" />
          <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
          <div className="h-16 animate-pulse rounded-xl bg-white/5" />
        </div>
      ) : error ? (
        <div role="status" className="space-y-3">
          <p className="text-sm text-slate-300">{error}</p>
          <p className="text-xs text-slate-500">Destination details and map are still available.</p>
          <Button variant="secondary" size="sm" onClick={() => setAttempt((value) => value + 1)}>Retry weather</Button>
        </div>
      ) : weather ? (
        <>
          <div className="flex items-end gap-3">
            <p className="text-5xl font-extrabold tracking-tight text-white">{Math.round(weather.temperature)}°C</p>
            <div className="pb-1"><p className="font-semibold text-amber-200">{weather.condition}</p><p className="text-xs text-slate-400">Feels like {Math.round(weather.feelsLike)}°C</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <p className="flex items-center gap-2 rounded-lg bg-white/5 p-2.5"><FaTint className="text-sky-300" /> {weather.humidity}% humidity</p>
            <p className="flex items-center gap-2 rounded-lg bg-white/5 p-2.5"><FaWind className="text-sky-300" /> {Math.round(weather.windSpeed)} km/h wind</p>
          </div>
          <div className="border-t border-white/10 pt-3">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">3-day forecast</h3>
            <div className="grid grid-cols-3 gap-2">
              {weather.forecast.map((day) => <div key={day.date} className="rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center">
                <p className="text-[11px] font-semibold text-slate-300">{displayDate(day.date)}</p>
                <FaThermometerHalf className="mx-auto my-1 text-amber-300" aria-hidden="true" />
                <p className="text-xs text-white">{Math.round(day.high)}° / {Math.round(day.low)}°C</p>
              </div>)}
            </div>
          </div>
          <p className="text-[10px] text-slate-500">Forecast data from Open-Meteo · {weather.updatedAt}</p>
        </>
      ) : null}
    </Card>
  );
}
