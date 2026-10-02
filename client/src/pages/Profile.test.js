import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Profile from "./Profile";
import * as service from "../services/phase4Service";

jest.mock("../services/phase4Service", () => ({ getProfile: jest.fn(), updateProfile: jest.fn() }));
const account = { display_name: "Riya", username: "riya", email: "riya@example.com", phone: null, home_city: "Pune", preferred_language: "Hindi", travel_interests: "Food", travel_preferences: {} };
beforeEach(() => { jest.clearAllMocks(); service.getProfile.mockResolvedValue(account); });

test("loads actual account details, saves changes, and keeps email read-only", async () => {
  service.updateProfile.mockImplementation((value) => Promise.resolve(value));
  render(<Profile />);
  expect(await screen.findByDisplayValue("Riya")).toBeInTheDocument();
  expect(screen.getByLabelText("Email address")).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Edit profile" }));
  fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Riya S" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(service.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ display_name: "Riya S" })));
  expect(await screen.findByRole("status")).toHaveTextContent("profile changes are saved");
});

test("reports profile load failures with a retry path", async () => {
  service.getProfile.mockRejectedValueOnce({ response: { data: { detail: "Profile offline." } } });
  render(<Profile />);
  expect(await screen.findByText("Profile offline.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
});
