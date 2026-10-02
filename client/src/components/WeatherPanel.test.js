import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import WeatherPanel from "./WeatherPanel";
import { getDestinationWeather } from "../services/weatherService";

jest.mock("../services/weatherService", () => ({ getDestinationWeather: jest.fn() }));

const destination = { latitude: 15.3, longitude: 74.1 };
const weather = {
  temperature: 28,
  feelsLike: 31,
  humidity: 72,
  windSpeed: 8,
  condition: "Partly cloudy",
  updatedAt: "2026-10-02T12:00",
  forecast: [
    { date: "2026-10-02", condition: "Partly cloudy", high: 30, low: 24 },
    { date: "2026-10-03", condition: "Overcast", high: 29, low: 23 },
    { date: "2026-10-04", condition: "Rain", high: 27, low: 22 },
  ],
};

beforeEach(() => jest.clearAllMocks());

test("shows a loading state before rendering live current conditions and forecast", async () => {
  let complete;
  getDestinationWeather.mockReturnValue(new Promise((resolve) => { complete = resolve; }));
  render(<WeatherPanel destination={destination} />);

  expect(screen.getByRole("status", { name: "Loading local weather" })).toBeInTheDocument();
  complete(weather);
  expect(await screen.findAllByText("Partly cloudy")).toHaveLength(1);
  expect(screen.getByText("28°C")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "3-day forecast" })).toBeInTheDocument();
});

test("shows a graceful unavailable message and allows retry", async () => {
  getDestinationWeather
    .mockRejectedValueOnce(new Error("Weather service could not be reached. Check your connection and try again."))
    .mockResolvedValueOnce(weather);
  render(<WeatherPanel destination={destination} />);

  expect(await screen.findByText(/Weather service could not be reached/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry weather" }));
  expect(await screen.findAllByText("Partly cloudy")).toHaveLength(1);
  expect(getDestinationWeather).toHaveBeenCalledTimes(2);
});
