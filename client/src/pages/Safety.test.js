import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Safety from "./Safety";
import * as service from "../services/phase4Service";

jest.mock("../components/SafetyMap", () => () => <div>Map</div>);
jest.mock("../services/phase4Service", () => ({ getEmergencyContacts: jest.fn(), createEmergencyContact: jest.fn(), updateEmergencyContact: jest.fn(), deleteEmergencyContact: jest.fn(), getNearbyServices: jest.fn() }));
beforeEach(() => { jest.clearAllMocks(); service.getEmergencyContacts.mockResolvedValue([]); });

test("shows honest SOS confirmation and emergency contact empty state", async () => {
  render(<Safety />);
  expect(await screen.findByText("No contacts saved")).toBeInTheDocument();
  expect(document.querySelectorAll('a[href^="tel:"]')).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "Emergency options" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("cannot dispatch SOS alerts");
  expect(screen.getByRole("link", { name: "Open phone to call 112" })).toHaveAttribute("href", "tel:112");
  expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
});

test("creates a contact and displays validation/API errors", async () => {
  service.createEmergencyContact.mockRejectedValueOnce({ response: { data: { errors: [{ message: "Enter a valid phone number." }] } } }).mockResolvedValueOnce({ id: 4, name: "Maya", phone: "9876543210" });
  service.getEmergencyContacts.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 4, name: "Maya", phone: "9876543210" }]);
  render(<Safety />);
  fireEvent.click(await screen.findByRole("button", { name: "Add contact" }));
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Maya" } });
  fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "9876543210" } });
  fireEvent.click(screen.getByRole("button", { name: "Save contact" }));
  expect(await screen.findByText("Enter a valid phone number.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Save contact" }));
  await waitFor(() => expect(service.createEmergencyContact).toHaveBeenCalledTimes(2));
  expect(await screen.findByText("Maya")).toBeInTheDocument();
});

test("handles browser location denial without making a lookup request", async () => {
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: (_success, failure) => failure({ code: 1 }) } });
  render(<Safety />);
  fireEvent.click(screen.getByRole("button", { name: "Use my location" }));
  expect(await screen.findByText(/Location permission was denied/)).toBeInTheDocument();
  expect(service.getNearbyServices).not.toHaveBeenCalled();
});

test("shows nearby service failure without presenting fake services", async () => {
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: (success) => success({ coords: { latitude: 12.9, longitude: 77.6 } }) } });
  service.getNearbyServices.mockRejectedValue({ response: { data: { detail: "OpenStreetMap nearby lookup is temporarily unavailable." } } });
  render(<Safety />);
  fireEvent.click(screen.getByRole("button", { name: "Use my location" }));
  expect(await screen.findByText("OpenStreetMap nearby lookup is temporarily unavailable.")).toBeInTheDocument();
  expect(service.getNearbyServices).toHaveBeenCalledWith(12.9, 77.6);
  expect(screen.queryByText("City Hospital")).not.toBeInTheDocument();
});

test("requires delete confirmation and removes an owned contact after confirmation", async () => {
  service.getEmergencyContacts.mockResolvedValue([{ id: 9, name: "Trusted person", phone: "9876543210" }]);
  service.deleteEmergencyContact.mockResolvedValue();
  const confirm = jest.spyOn(window, "confirm").mockReturnValue(true);
  render(<Safety />);
  fireEvent.click(await screen.findByRole("button", { name: "Delete Trusted person" }));
  expect(confirm).toHaveBeenCalledWith("Delete this emergency contact?");
  await waitFor(() => expect(service.deleteEmergencyContact).toHaveBeenCalledWith(9));
  expect(await screen.findByText("No contacts saved")).toBeInTheDocument();
  confirm.mockRestore();
});
