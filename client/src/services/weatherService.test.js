import { getDestinationWeather } from "./weatherService";

const sampleWeather = {
  current: {
    temperature_2m: 28.3,
    relative_humidity_2m: 72,
    apparent_temperature: 31.1,
    weather_code: 2,
    wind_speed_10m: 8.4,
    time: "2026-10-02T12:00",
  },
  daily: {
    time: ["2026-10-02", "2026-10-03", "2026-10-04"],
    weather_code: [2, 3, 61],
    temperature_2m_max: [30, 29, 27],
    temperature_2m_min: [24, 23, 22],
  },
};

afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

test("requests destination coordinates and normalizes current conditions and forecast", async () => {
  const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({ ok: true, json: async () => sampleWeather });
  const result = await getDestinationWeather(15.3, 74.1);

  const requestUrl = new URL(fetchMock.mock.calls[0][0]);
  expect(requestUrl.origin).toBe("https://api.open-meteo.com");
  expect(requestUrl.searchParams.get("latitude")).toBe("15.3");
  expect(requestUrl.searchParams.get("longitude")).toBe("74.1");
  expect(requestUrl.searchParams.get("daily")).toContain("temperature_2m_max");
  expect(result).toMatchObject({ temperature: 28.3, feelsLike: 31.1, humidity: 72, windSpeed: 8.4, condition: "Partly cloudy" });
  expect(result.forecast).toHaveLength(3);
  expect(result.forecast[0]).toMatchObject({ date: "2026-10-02", high: 30, low: 24 });
});

test("rejects invalid coordinates without making a network request", async () => {
  const fetchMock = jest.spyOn(global, "fetch");
  await expect(getDestinationWeather(91, 74)).rejects.toThrow("Weather is unavailable");
  expect(fetchMock).not.toHaveBeenCalled();
});

test("returns a graceful message when Open-Meteo is unavailable", async () => {
  jest.spyOn(global, "fetch").mockResolvedValue({ ok: false, status: 503 });
  await expect(getDestinationWeather(15.3, 74.1)).rejects.toThrow("Weather service is temporarily unavailable");
});

test("returns a friendly fallback when the weather network request fails", async () => {
  jest.spyOn(global, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
  await expect(getDestinationWeather(15.3, 74.1)).rejects.toThrow("Weather service could not be reached");
});

test("returns a useful timeout error when the weather request exceeds its limit", async () => {
  jest.useFakeTimers();
  jest.spyOn(global, "fetch").mockImplementation((_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  }));
  const request = getDestinationWeather(15.3, 74.1);
  jest.advanceTimersByTime(9000);
  await expect(request).rejects.toThrow("Weather request timed out");
  jest.useRealTimers();
});
