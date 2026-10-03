import translationService, {
  createTranslationService,
  TranslationUnavailableError,
} from "./translationService";

test("reports the missing translation provider instead of inventing translated text", async () => {
  await expect(translationService.translate({
    text: "Where is the station?",
    sourceLanguage: "en",
    targetLanguage: "te",
  })).rejects.toBeInstanceOf(TranslationUnavailableError);
});

test("validates translation input before contacting a provider", async () => {
  const provider = { translate: jest.fn() };
  const service = createTranslationService(provider);
  await expect(service.translate({ text: "  ", sourceLanguage: "en", targetLanguage: "te" }))
    .rejects.toThrow("Enter text to translate.");
  await expect(service.translate({ text: "hello", sourceLanguage: "en", targetLanguage: "en" }))
    .rejects.toThrow("Choose different source and target languages.");
  expect(provider.translate).not.toHaveBeenCalled();
});
