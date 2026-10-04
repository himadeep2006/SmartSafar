import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Languages from "./Languages";
import * as profileService from "../services/phase4Service";
import translationService from "../services/translationService";

jest.mock("../services/phase4Service", () => ({ getProfile: jest.fn(), updateProfile: jest.fn() }));
jest.mock("../services/translationService", () => ({ translate: jest.fn() }));

const profile = { display_name: "A", email: "a@example.com", username: "a", preferred_language: "Hindi", phone: null, home_city: null, travel_interests: "", travel_preferences: {} };

beforeEach(() => {
  jest.clearAllMocks();
  ["SpeechRecognition", "webkitSpeechRecognition", "SpeechSynthesisUtterance", "speechSynthesis"].forEach((key) => {
    Object.defineProperty(window, key, { configurable: true, value: undefined });
  });
  profileService.getProfile.mockResolvedValue(profile);
  profileService.updateProfile.mockImplementation((next) => Promise.resolve(next));
  translationService.translate.mockResolvedValue({ translation: "रेलवे स्टेशन कहाँ है?", source_language: "en", target_language: "hi", provider: "Test provider" });
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: jest.fn().mockResolvedValue() } });
});

test("source and target selection, swap, and phrasebook insertion preserve user input", async () => {
  render(<Languages />);
  const input = await screen.findByLabelText(/Your message/);
  fireEvent.change(screen.getByLabelText(/I speak/), { target: { value: "ta" } });
  fireEvent.change(screen.getByLabelText(/I want to communicate in/), { target: { value: "en" } });
  fireEvent.change(input, { target: { value: "எங்கே ரயில் நிலையம்?" } });
  fireEvent.click(screen.getByRole("button", { name: "Swap source and target languages" }));
  expect(screen.getByLabelText(/I speak/)).toHaveValue("en");
  expect(screen.getByLabelText(/I want to communicate in/)).toHaveValue("ta");
  expect(input).toHaveValue("எங்கே ரயில் நிலையம்?");
  fireEvent.click(screen.getAllByRole("button", { name: /Use this phrase in translator/ })[0]);
  expect(input).toHaveValue("Hello");
  expect(screen.getByLabelText(/I speak/)).toHaveValue("en");
  expect(screen.getByLabelText(/I want to communicate in/)).toHaveValue("ta");
});

test("translates arbitrary text and shows the returned text and provider actions", async () => {
  render(<Languages />);
  const input = await screen.findByLabelText(/Your message/);
  fireEvent.change(input, { target: { value: "Where is the railway station?" } });
  fireEvent.change(screen.getByLabelText(/I want to communicate in/), { target: { value: "hi" } });
  fireEvent.click(screen.getByRole("button", { name: "Translate" }));
  expect(await screen.findByText("रेलवे स्टेशन कहाँ है?")).toBeInTheDocument();
  expect(translationService.translate).toHaveBeenCalledWith({ text: "Where is the railway station?", sourceLanguage: "en", targetLanguage: "hi" });
  expect(screen.getByRole("button", { name: "Listen" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
});

test("shows provider failure and retry without inventing translated text", async () => {
  translationService.translate.mockRejectedValueOnce(new Error("Translation service is temporarily unavailable."));
  render(<Languages />);
  fireEvent.change(await screen.findByLabelText(/Your message/), { target: { value: "How much does this cost?" } });
  fireEvent.click(screen.getByRole("button", { name: "Translate" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Translation service is temporarily unavailable.");
  expect(screen.getByText("Your translation will appear here.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByText("रेलवे स्टेशन कहाँ है?")).toBeInTheDocument();
});

test("validates empty, identical-language, and excessive text before requests", async () => {
  render(<Languages />);
  await screen.findByLabelText(/Your message/);
  fireEvent.click(screen.getByRole("button", { name: "Translate" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Enter text to translate.");
  fireEvent.change(screen.getByLabelText(/Your message/), { target: { value: "Hello" } });
  fireEvent.change(screen.getByLabelText(/I want to communicate in/), { target: { value: "en" } });
  fireEvent.click(screen.getByRole("button", { name: "Translate" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Choose two different languages.");
  fireEvent.change(screen.getByLabelText(/I want to communicate in/), { target: { value: "hi" } });
  fireEvent.change(screen.getByLabelText(/Your message/), { target: { value: "x".repeat(501) } });
  fireEvent.click(screen.getByRole("button", { name: "Translate" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Please shorten your text and try again.");
  expect(translationService.translate).not.toHaveBeenCalled();
});

test("supports browser speech recognition, uses selected source language, and handles permission errors", async () => {
  let recognition;
  class MockRecognition {
    constructor() { recognition = this; }
    start() { this.onstart?.(); }
    stop() { this.onend?.(); }
  }
  Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: MockRecognition });
  render(<Languages />);
  await screen.findByLabelText(/Your message/);
  fireEvent.change(screen.getByLabelText(/I speak/), { target: { value: "ta" } });
  fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
  expect(recognition.lang).toBe("ta-IN");
  expect(recognition.continuous).toBe(false);
  act(() => recognition.onresult({ results: [[{ transcript: "வணக்கம்" }]] }));
  expect(screen.getByLabelText(/Your message/)).toHaveValue("வணக்கம்");
  act(() => recognition.onend());
  fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
  act(() => recognition.onerror({ error: "not-allowed" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Microphone permission was denied");
});

test("explains unsupported speech recognition and uses target-language speech synthesis", async () => {
  render(<Languages />);
  await screen.findByLabelText(/Your message/);
  fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Voice input isn't supported in this browser");

  translationService.translate.mockResolvedValueOnce({ translation: "नमस्ते" });
  fireEvent.change(screen.getByLabelText(/Your message/), { target: { value: "Hello" } });
  fireEvent.change(screen.getByLabelText(/I want to communicate in/), { target: { value: "hi" } });
  fireEvent.click(screen.getByRole("button", { name: "Translate" }));
  await screen.findByRole("button", { name: "Listen" });
  fireEvent.click(screen.getByRole("button", { name: "Listen" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Text-to-speech isn't supported in this browser");
  const speak = jest.fn();
  const cancel = jest.fn();
  class MockUtterance { constructor(text) { this.text = text; } }
  Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: MockUtterance });
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => [{ lang: "hi-IN" }], speak, cancel } });
  fireEvent.click(screen.getByRole("button", { name: "Listen" }));
  expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: "नमस्ते", lang: "hi-IN" }));
});

test("copies arbitrary translations and reports clipboard failure", async () => {
  render(<Languages />);
  fireEvent.change(await screen.findByLabelText(/Your message/), { target: { value: "Hello" } });
  fireEvent.click(screen.getByRole("button", { name: "Translate" }));
  await screen.findByText("रेलवे स्टेशन कहाँ है?");
  fireEvent.click(screen.getByRole("button", { name: "Copy" }));
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith("रेलवे स्टेशन कहाँ है?");
  expect(await screen.findByRole("status")).toHaveTextContent("Copied");
  navigator.clipboard.writeText.mockRejectedValueOnce(new Error("permission denied"));
  fireEvent.click(screen.getByRole("button", { name: "Copy" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Clipboard access is unavailable"));
});

test("conversation mode translates both speakers and clears session-only history", async () => {
  translationService.translate.mockResolvedValue({ translation: "Translated response" });
  render(<Languages />);
  await screen.findByLabelText(/Your message/);
  fireEvent.click(screen.getByRole("button", { name: "Conversation Mode" }));
  const traveller = screen.getByLabelText("Your side message");
  fireEvent.change(traveller, { target: { value: "How much does this cost?" } });
  fireEvent.click(screen.getAllByRole("button", { name: "Translate this message" })[0]);
  expect((await screen.findAllByText("How much does this cost?")).length).toBeGreaterThan(1);
  expect(screen.getAllByText("Translated response").length).toBeGreaterThan(0);
  expect(translationService.translate).toHaveBeenLastCalledWith({ text: "How much does this cost?", sourceLanguage: "en", targetLanguage: "te" });
  fireEvent.change(screen.getByLabelText("Local person’s side message"), { target: { value: "It costs five hundred rupees." } });
  fireEvent.click(screen.getAllByRole("button", { name: "Translate this message" })[1]);
  await waitFor(() => expect(translationService.translate).toHaveBeenLastCalledWith({ text: "It costs five hundred rupees.", sourceLanguage: "te", targetLanguage: "en" }));
  fireEvent.click(screen.getByRole("button", { name: "Clear conversation" }));
  expect(screen.getByText("Conversation messages will appear here after a translation succeeds.")).toBeInTheDocument();
});

test("keeps the curated phrasebook and saves preferred phrase language independently", async () => {
  render(<Languages />);
  expect(await screen.findByText("नमस्ते")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Filter phrase category"), { target: { value: "Emergency" } });
  expect(screen.getByText("कृपया मेरी मदद करें।")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/Preferred phrase language/), { target: { value: "Tamil" } });
  await waitFor(() => expect(profileService.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ preferred_language: "Tamil" })));
  expect(await screen.findByText("Tamil saved as your preferred phrase language.")).toBeInTheDocument();
});

test("phrase copy and no-result states remain available", async () => {
  render(<Languages />);
  fireEvent.change(await screen.findByLabelText("Search travel phrases"), { target: { value: "no such phrase" } });
  expect(screen.getByText("No phrases found")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search travel phrases"), { target: { value: "hello" } });
  fireEvent.click(await screen.findByRole("button", { name: "Copy greetings phrase" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Phrase copied");
});
