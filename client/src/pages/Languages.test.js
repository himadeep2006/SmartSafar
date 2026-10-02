import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Languages from "./Languages";
import * as service from "../services/phase4Service";

jest.mock("../services/phase4Service", () => ({ getProfile: jest.fn(), updateProfile: jest.fn() }));
beforeEach(() => { jest.clearAllMocks(); service.getProfile.mockResolvedValue({ display_name: "A", email: "a@example.com", username: "a", preferred_language: "Hindi", phone: null, home_city: null, travel_interests: "", travel_preferences: {} }); });

test("loads phrasebook, filters categories and persists the preferred language", async () => {
  service.updateProfile.mockImplementation((profile) => Promise.resolve(profile));
  render(<Languages />);
  expect(await screen.findByText("नमस्ते")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Filter phrase category"), { target: { value: "Emergency" } });
  expect(screen.getByText("कृपया मेरी मदद करें।")).toBeInTheDocument();
  expect(screen.queryByText("मेरी बुकिंग है।")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Preferred phrase language"), { target: { value: "Tamil" } });
  await waitFor(() => expect(service.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ preferred_language: "Tamil" })));
  expect(await screen.findByText("Tamil saved as your preferred language.")).toBeInTheDocument();
});

test("shows helpful empty search state and clipboard feedback", async () => {
  service.updateProfile.mockResolvedValue({ display_name: "A", email: "a@example.com", username: "a", preferred_language: "Hindi" });
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: jest.fn().mockResolvedValue() } });
  render(<Languages />);
  fireEvent.change(await screen.findByLabelText("Search travel phrases"), { target: { value: "no such phrase" } });
  expect(screen.getByText("No phrases found")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search travel phrases"), { target: { value: "hello" } });
  fireEvent.click(await screen.findByRole("button", { name: "Copy greetings phrase" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Phrase copied");
});
