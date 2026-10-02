import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import api from "./lib/api";
import * as destinationService from "./services/destinationService";

jest.mock("./lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock("./services/destinationService", () => ({
  getDestinations: jest.fn().mockResolvedValue([]),
  getDestination: jest.fn(),
  getSavedDestinations: jest.fn().mockResolvedValue([]),
  saveDestination: jest.fn(),
  removeSavedDestination: jest.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  jest.clearAllMocks();
  destinationService.getDestinations.mockResolvedValue([]);
  destinationService.getSavedDestinations.mockResolvedValue([]);
});

test("login submits to the API and shows an invalid-credentials error", async () => {
  api.post.mockRejectedValue({
    response: { status: 401, data: { detail: "Email/username or password is incorrect." } },
  });
  render(<App />);

  fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: "traveller@example.com" } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "wrong-pass" } });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent(/password is incorrect/i);
  expect(api.post).toHaveBeenCalledWith("/auth/login", {
    identifier: "traveller@example.com",
    password: "wrong-pass",
  });
  expect(localStorage.getItem("token")).toBeNull();
});

test("login shows a disabled loading state and establishes the session on success", async () => {
  let completeLogin;
  api.post.mockReturnValue(new Promise((resolve) => { completeLogin = resolve; }));
  render(<App />);

  fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: "traveller@example.com" } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "Safari2026" } });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

  const loadingButton = await screen.findByRole("button", { name: /signing in/i });
  expect(loadingButton).toBeDisabled();
  expect(screen.getByLabelText(/email or username/i)).toBeDisabled();
  completeLogin({ data: { access_token: "test-session-token", user: { id: 7, username: "traveller", email: "traveller@example.com" } } });

  expect(await screen.findByRole("heading", { name: /namaste, traveller/i })).toBeInTheDocument();
  expect(localStorage.getItem("token")).toBe("test-session-token");
});

test("signup validates password policy before sending a request", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("link", { name: /create an account/i }));

  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "traveller01" } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "traveller@example.com" } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "weak" } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "weak" } });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent(/at least 8 characters/i);
  expect(api.post).not.toHaveBeenCalled();
});

test("protected routes redirect signed-out visitors to login", async () => {
  window.history.replaceState(null, "", "/safety");
  render(<App />);
  await waitFor(() => expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument());
  expect(api.get).not.toHaveBeenCalled();
});

test("a saved token is revalidated before a protected route is shown", async () => {
  localStorage.setItem("token", "server-validated-token");
  window.history.replaceState(null, "", "/dashboard");
  api.get.mockResolvedValue({ data: { id: 9, username: "refreshed-traveller", email: "safe@example.com" } });

  render(<App />);

  expect(await screen.findByRole("heading", { name: /namaste, refreshed-traveller/i })).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith("/auth/me");
});

test("an unavailable auth service fails closed and lets the user sign out", async () => {
  localStorage.setItem("token", "unverifiable-token");
  window.history.replaceState(null, "", "/profile");
  api.get.mockRejectedValue(new Error("Network unavailable"));

  render(<App />);

  expect(await screen.findByRole("alert")).toHaveTextContent(/could not reach the authentication service/i);
  fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
  expect(await screen.findByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  expect(localStorage.getItem("token")).toBeNull();
});
