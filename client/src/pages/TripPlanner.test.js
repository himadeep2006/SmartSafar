import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TripPlanner from "./TripPlanner";
import * as destinationService from "../services/destinationService";
import * as tripService from "../services/tripService";

jest.mock("../services/destinationService", () => ({ getDestinations: jest.fn() }));
jest.mock("../services/tripService", () => ({ generateTripPlan: jest.fn(), createTrip: jest.fn() }));

const goa = { id: "goa", name: "Goa", state: "Goa", image: null };
const plan = { destination: goa, planner_label: "Smart itinerary generated from your preferences", itinerary: [{ day_number: 1, title: "Day 1", estimated_daily_spending_inr: 3000, morning: { title: "Coast", description: "Explore", place: "Goa coast", estimated_travel_time: "Nearby", meal_suggestion: "Breakfast" }, afternoon: { title: "Fort", description: "Visit", place: "Fort Aguada", estimated_travel_time: "Nearby", meal_suggestion: "Lunch" }, evening: { title: "Dinner", description: "Rest", place: "Town", estimated_travel_time: "Nearby", meal_suggestion: "Dinner" }, travel_notes: "Check locally." }] };

beforeEach(() => { jest.clearAllMocks(); destinationService.getDestinations.mockResolvedValue([goa]); });

test("preselects destination, validates interests, generates a preview, and saves only by explicit action", async () => {
  let finishPlan;
  tripService.generateTripPlan.mockReturnValue(new Promise((resolve) => { finishPlan = resolve; }));
  tripService.createTrip.mockResolvedValue({ id: 41 });
  render(<MemoryRouter initialEntries={["/planner?destination=goa"]}><TripPlanner /></MemoryRouter>);
  expect(await screen.findByRole("combobox", { name: /destination/i })).toHaveValue("goa");
  fireEvent.click(screen.getByRole("checkbox", { name: /culture/i }));
  fireEvent.click(screen.getByRole("checkbox", { name: /^food$/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my itinerary/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/choose at least one interest/i);
  fireEvent.click(screen.getByRole("checkbox", { name: /heritage/i }));
  fireEvent.click(screen.getByRole("button", { name: /build my itinerary/i }));
  expect(await screen.findByRole("button", { name: /building your plan/i })).toBeDisabled();
  finishPlan(plan);
  expect(await screen.findByText(/smart itinerary generated from your preferences/i)).toBeInTheDocument();
  expect(tripService.generateTripPlan).toHaveBeenCalledWith(expect.objectContaining({ destination_id: "goa", interests: ["heritage"] }));
  expect(tripService.createTrip).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Save trip" }));
  await waitFor(() => expect(tripService.createTrip).toHaveBeenCalledTimes(1));
});

test("shows destination catalogue loading failures", async () => {
  destinationService.getDestinations.mockRejectedValue({ response: { data: { detail: "Catalogue unavailable." } } });
  render(<MemoryRouter><TripPlanner /></MemoryRouter>);
  expect(await screen.findByText("Catalogue unavailable.")).toBeInTheDocument();
});

test("shows a helpful planner API failure", async () => {
  tripService.generateTripPlan.mockRejectedValue({ response: { data: { detail: "Planner unavailable." } } });
  render(<MemoryRouter><TripPlanner /></MemoryRouter>);
  fireEvent.change(await screen.findByRole("combobox", { name: /destination/i }), { target: { value: "goa" } });
  fireEvent.click(await screen.findByRole("button", { name: /build my itinerary/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Planner unavailable.");
});
