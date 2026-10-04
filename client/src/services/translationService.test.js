import api from "../lib/api";
import translationService, { createTranslationService, TranslationUnavailableError } from "./translationService";

jest.mock("../lib/api", () => ({ __esModule: true, default: { post: jest.fn() } }));

beforeEach(() => jest.clearAllMocks());

test("posts only arbitrary text and selected language codes to the protected API", async () => {
  api.post.mockResolvedValue({ data: { translation: "ನಮಸ್ಕಾರ", source_language: "en", target_language: "kn", provider: "IndicTrans2" } });
  const result = await translationService.translate({ text: "  Hello  ", sourceLanguage: "en", targetLanguage: "kn" });
  expect(api.post).toHaveBeenCalledWith("/translation/translate", { text: "Hello", source_language: "en", target_language: "kn" });
  expect(result.translation).toBe("ನಮಸ್ಕಾರ");
});

test("validates before the provider and maps outage and input-limit errors", async () => {
  const provider = { translate: jest.fn() };
  const service = createTranslationService(provider);
  await expect(service.translate({ text: " ", sourceLanguage: "en", targetLanguage: "hi" })).rejects.toThrow("Enter text to translate.");
  await expect(service.translate({ text: "Hello", sourceLanguage: "en", targetLanguage: "en" })).rejects.toThrow("Choose two different languages.");
  expect(provider.translate).not.toHaveBeenCalled();
  provider.translate.mockRejectedValueOnce({ response: { status: 422 } });
  await expect(service.translate({ text: "Hello", sourceLanguage: "en", targetLanguage: "hi" })).rejects.toThrow("Please shorten your text and try again.");
  provider.translate.mockRejectedValueOnce({ response: { status: 503 } });
  await expect(service.translate({ text: "Hello", sourceLanguage: "en", targetLanguage: "hi" })).rejects.toBeInstanceOf(TranslationUnavailableError);
});

test("rejects empty or malformed provider output", async () => {
  const service = createTranslationService({ translate: jest.fn().mockResolvedValue({ translation: "  " }) });
  await expect(service.translate({ text: "Hello", sourceLanguage: "en", targetLanguage: "hi" })).rejects.toBeInstanceOf(TranslationUnavailableError);
});
