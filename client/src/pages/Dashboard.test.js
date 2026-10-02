import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import * as destinationService from "../services/destinationService";

jest.mock("../auth/AuthContext", () => ({ useAuth: () => ({ user: { username: "traveller" } }) }));
jest.mock("../services/destinationService", () => ({
  getDestinations: jest.fn(),
  getSavedDestinations: jest.fn(),
  saveDestination: jest.fn(),
  removeSavedDestination: jest.fn(),
}));

const goa = {
  id: "goa", name: "Goa", state: "Goa", country: "India", short_description: "Coastal beaches and heritage.",
  description: "A coastal destination.", category: "Beach", image: null, latitude: 15.3, longitude: 74.1,
  best_time_to_visit: "November to February", estimated_budget: "₹2,500–₹6,000 per person/day (estimate)", tags: ["coast"],
};

beforeEach(() => jest.clearAllMocks());

test("shows destination and saved-list loading states, then helpful empty states", async () => {
  let finishDestinations;
  let finishSaved;
  destinationService.getDestinations.mockReturnValue(new Promise((resolve) => { finishDestinations = resolve; }));
  destinationService.getSavedDestinations.mockReturnValue(new Promise((resolve) => { finishSaved = resolve; }));
  render(<MemoryRouter><Dashboard /></MemoryRouter>);

  expect(screen.getByRole("status", { name: "Loading destinations" })).toBeInTheDocument();
  expect(screen.getByRole("status", { name: "Loading saved destinations" })).toBeInTheDocument();
  finishDestinations([]);
  finishSaved([]);
  expect(await screen.findByText("No destinations match those filters")).toBeInTheDocument();
  expect(screen.getByText("Your travel list is waiting.")).toBeInTheDocument();
});

test("shows a catalogue error and a retry action", async () => {
  destinationService.getDestinations.mockRejectedValue({ response: { status: 503, data: { detail: "Catalogue unavailable." } } });
  destinationService.getSavedDestinations.mockResolvedValue([]);
  render(<MemoryRouter><Dashboard /></MemoryRouter>);

  expect(await screen.findByText("Catalogue unavailable.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry destinations" })).toBeEnabled();
});

test("reports saved-destination failures without losing the catalogue", async () => {
  destinationService.getDestinations.mockResolvedValue([goa]);
  destinationService.getSavedDestinations.mockResolvedValue([]);
  destinationService.saveDestination.mockRejectedValue({ response: { status: 503, data: { detail: "Save unavailable." } } });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);

  fireEvent.click(await screen.findByRole("button", { name: "Save Goa" }));
  expect(await screen.findByText("Save unavailable.")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Goa" })).toBeInTheDocument();
});
