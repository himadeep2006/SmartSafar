import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Assistant from "./Assistant";
import * as assistantService from "../services/assistantService";
import TripPlanner from "./TripPlanner";
import * as destinationService from "../services/destinationService";

jest.mock("../services/assistantService", () => ({ getAssistantStatus: jest.fn(), sendAssistantMessage: jest.fn() }));
jest.mock("../services/destinationService", () => ({ getDestinations: jest.fn() }));
jest.mock("../services/tripService", () => ({ generateTripPlan: jest.fn(), createTrip: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  assistantService.getAssistantStatus.mockResolvedValue({ available: true, provider: "Groq" });
  destinationService.getDestinations.mockResolvedValue([{ id: "goa", name: "Goa", state: "Goa" }]);
});

function renderAssistant() {
  return render(<MemoryRouter initialEntries={["/assistant"]}><Routes><Route path="/assistant" element={<Assistant />} /><Route path="/planner" element={<TripPlanner />} /></Routes></MemoryRouter>);
}

test("shows provider unavailable state without displaying a fake assistant answer", async () => {
  assistantService.getAssistantStatus.mockResolvedValue({ available: false, provider: null });
  renderAssistant();
  expect(await screen.findByText("AI provider unavailable")).toBeInTheDocument();
  expect(screen.getByText(/messages will not receive a generated answer/i)).toBeInTheDocument();
  expect(screen.queryByText(/here are some ideas/i)).not.toBeInTheDocument();
});

test("sends a real chat request, displays loading, response and a grounded destination action", async () => {
  let finishRequest;
  assistantService.sendAssistantMessage.mockReturnValue(new Promise((resolve) => { finishRequest = resolve; }));
  renderAssistant();
  const input = await screen.findByRole("textbox", { name: /ask smartsafar/i });
  await userEvent.type(input, "What should I visit in Goa?");
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));
  expect(await screen.findByText(/thinking through your travel question/i)).toBeInTheDocument();
  expect(assistantService.sendAssistantMessage).toHaveBeenCalledWith("What should I visit in Goa?", []);
  finishRequest({
    message: "SmartSafar has Goa in its destination catalogue.",
    suggestions: [{ type: "destination", destination_id: "goa", days: null, trip_id: null }],
    context: { destinations: [{ id: "goa", name: "Goa" }], saved_destinations: [], trip: null },
  });
  expect(await screen.findByText(/has goa in its destination catalogue/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /explore goa/i })).toHaveAttribute("href", "/destinations/goa");
});

test("quick prompts populate the composer and shift-enter leaves the draft unsent", async () => {
  renderAssistant();
  const prompt = await screen.findByRole("button", { name: "What should I pack for a monsoon trip?" });
  await userEvent.click(prompt);
  const input = screen.getByRole("textbox", { name: /ask smartsafar/i });
  expect(input).toHaveValue("What should I pack for a monsoon trip?");
  fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
  expect(assistantService.sendAssistantMessage).not.toHaveBeenCalled();
  expect(input).toHaveValue("What should I pack for a monsoon trip?");
});

test("shows a safe error and retries without duplicating the failed user message", async () => {
  assistantService.sendAssistantMessage
    .mockRejectedValueOnce({ response: { data: { detail: "The AI travel assistant is not available right now. Please try again later." } } })
    .mockResolvedValueOnce({ message: "Pack light layers and rain protection.", suggestions: [], context: { destinations: [], saved_destinations: [], trip: null } });
  renderAssistant();
  const input = await screen.findByRole("textbox", { name: /ask smartsafar/i });
  await userEvent.type(input, "What should I pack?");
  await userEvent.click(screen.getByRole("button", { name: /send message/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/assistant is not available/i);
  await userEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByText("Pack light layers and rain protection.")).toBeInTheDocument();
  expect(assistantService.sendAssistantMessage).toHaveBeenNthCalledWith(2, "What should I pack?", []);
  expect(screen.getAllByText("What should I pack?")).toHaveLength(1);
});

test("opens the planner with an action destination and duration preselected", async () => {
  let resolveDestinations;
  destinationService.getDestinations.mockReturnValue(new Promise((resolve) => { resolveDestinations = resolve; }));
  assistantService.sendAssistantMessage.mockResolvedValue({
    message: "I can open a 3-day planner for Goa.",
    suggestions: [{ type: "trip_plan", destination_id: "goa", days: 3, trip_id: null }],
    context: { destinations: [{ id: "goa", name: "Goa" }], saved_destinations: [], trip: null },
  });
  renderAssistant();
  const input = await screen.findByRole("textbox", { name: /ask smartsafar/i });
  await userEvent.type(input, "Plan three days in Goa");
  await userEvent.click(screen.getByRole("button", { name: /send message/i }));
  await userEvent.click(await screen.findByRole("link", { name: /open 3-day goa planner/i }));
  await act(async () => { resolveDestinations([{ id: "goa", name: "Goa", state: "Goa" }]); });
  expect(await screen.findByRole("combobox", { name: /destination/i })).toHaveValue("goa");
  expect(screen.getByRole("spinbutton", { name: /days/i })).toHaveValue(3);
  await waitFor(() => expect(screen.queryByText("Loading the destination catalogue…")).not.toBeInTheDocument());
});

test("does not submit when blank and reports backend service failures", async () => {
  assistantService.sendAssistantMessage.mockRejectedValue({ response: { data: { detail: "Assistant offline." } } });
  renderAssistant();
  const send = await screen.findByRole("button", { name: /send message/i });
  expect(send).toBeDisabled();
  const input = screen.getByRole("textbox", { name: /ask smartsafar/i });
  await userEvent.type(input, "Plan Goa");
  await userEvent.keyboard("{Enter}");
  expect(await screen.findByRole("alert")).toHaveTextContent("Assistant offline.");
  await waitFor(() => expect(assistantService.sendAssistantMessage).toHaveBeenCalledTimes(1));
});
