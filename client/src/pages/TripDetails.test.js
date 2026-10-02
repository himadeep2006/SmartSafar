import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TripDetails from "./TripDetails";
import * as tripService from "../services/tripService";

jest.mock("../components/WeatherPanel", () => () => <div>Weather panel</div>);
jest.mock("../components/DestinationMap", () => ({ __esModule: true, default: () => <div>Destination map</div> }));
jest.mock("../services/tripService", () => ({ getTrip: jest.fn(), updateTrip: jest.fn(), regenerateTrip: jest.fn(), deleteTrip: jest.fn() }));

const trip = {
  id: 7, user_id: 2, destination_id: "jaipur", destination: { id: "jaipur", name: "Jaipur", state: "Rajasthan", image: null, latitude: 26.9, longitude: 75.7 },
  title: "Jaipur escape", duration_days: 2, budget_inr: 12000, travel_style: "balanced", interests: ["heritage"], preferred_activities: [], starting_location: null, companions: 1, start_date: null, itinerary: [], itinerary_stale: true, planner_label: "Smart itinerary generated from your preferences",
};

beforeEach(() => { jest.clearAllMocks(); tripService.getTrip.mockResolvedValue(trip); });

test("keeps a stale itinerary until the traveler confirms regeneration", async () => {
  tripService.regenerateTrip.mockResolvedValue({ ...trip, itinerary_stale: false, itinerary: [{ day_number: 1, title: "Day 1", morning: { title: "Morning" }, afternoon: { title: "Afternoon" }, evening: { title: "Evening" }, estimated_daily_spending_inr: 1000 }] });
  render(<MemoryRouter initialEntries={["/trips/7"]}><Routes><Route path="/trips/:tripId" element={<TripDetails/>}/><Route path="/trips" element={<div>My trips</div>}/></Routes></MemoryRouter>);
  expect(await screen.findByText(/preferences have changed/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /regenerate itinerary/i }));
  expect(screen.getByRole("alertdialog")).toHaveTextContent(/replace the current itinerary/i);
  expect(tripService.regenerateTrip).not.toHaveBeenCalled();
  await act(async () => { fireEvent.click(screen.getByRole("alertdialog").querySelector("button:last-child")); });
  await waitFor(() => expect(tripService.regenerateTrip).toHaveBeenCalledWith(7));
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  expect(screen.queryByText(/preferences have changed/i)).not.toBeInTheDocument();
});

test("requires an explicit delete confirmation", async () => {
  render(<MemoryRouter initialEntries={["/trips/7"]}><Routes><Route path="/trips/:tripId" element={<TripDetails/>}/><Route path="/trips" element={<div>My trips</div>}/></Routes></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: "Delete" }));
  expect(screen.getByRole("alertdialog")).toHaveTextContent(/permanently removed/i);
  expect(tripService.deleteTrip).not.toHaveBeenCalled();
  await act(async () => { fireEvent.click(screen.getByRole("alertdialog").querySelector("button:last-child")); });
  await waitFor(() => expect(tripService.deleteTrip).toHaveBeenCalledWith(7));
});
