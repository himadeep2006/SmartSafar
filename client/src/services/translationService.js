/**
 * Provider boundary for arbitrary travel translation.
 *
 * No translation provider is configured in this project. The default service
 * therefore fails explicitly instead of returning curated or fabricated text.
 * A future adapter must implement `translate({ text, sourceLanguage,
 * targetLanguage })` and return `{ translatedText }`.
 */
export class TranslationUnavailableError extends Error {
  constructor() {
    super("Arbitrary translation is unavailable until a translation provider is configured.");
    this.name = "TranslationUnavailableError";
  }
}

export function createTranslationService(provider) {
  return {
    async translate({ text, sourceLanguage, targetLanguage } = {}) {
      if (typeof text !== "string" || !text.trim()) {
        throw new TypeError("Enter text to translate.");
      }
      if (!sourceLanguage || !targetLanguage || sourceLanguage === targetLanguage) {
        throw new TypeError("Choose different source and target languages.");
      }
      if (!provider || typeof provider.translate !== "function") {
        throw new TranslationUnavailableError();
      }

      const result = await provider.translate({
        text: text.trim(),
        sourceLanguage,
        targetLanguage,
      });
      if (!result || typeof result.translatedText !== "string" || !result.translatedText.trim()) {
        throw new Error("The translation provider returned an invalid response.");
      }
      return { translatedText: result.translatedText.trim() };
    },
  };
}

const translationService = createTranslationService(null);
export default translationService;
