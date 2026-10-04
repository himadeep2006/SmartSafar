import api from "../lib/api";

export class TranslationUnavailableError extends Error {
  constructor() {
    super("Translation service is temporarily unavailable.");
    this.name = "TranslationUnavailableError";
  }
}

export function createTranslationService(provider) {
  return {
    async translate({ text, sourceLanguage, targetLanguage } = {}) {
      if (typeof text !== "string" || !text.trim()) throw new TypeError("Enter text to translate.");
      if (!sourceLanguage || !targetLanguage || sourceLanguage === targetLanguage) {
        throw new TypeError("Choose two different languages.");
      }
      try {
        const result = await provider.translate({ text: text.trim(), sourceLanguage, targetLanguage });
        if (!result || typeof result.translation !== "string" || !result.translation.trim()) {
          throw new TranslationUnavailableError();
        }
        return { ...result, translation: result.translation.trim() };
      } catch (error) {
        if (error instanceof TypeError || error instanceof TranslationUnavailableError) throw error;
        const status = error.response?.status;
        if (status === 422 || status === 413) throw new TypeError("Please shorten your text and try again.");
        throw new TranslationUnavailableError();
      }
    },
  };
}

const apiProvider = {
  async translate({ text, sourceLanguage, targetLanguage }) {
    const response = await api.post("/translation/translate", {
      text,
      source_language: sourceLanguage,
      target_language: targetLanguage,
    });
    return response.data;
  },
};

const translationService = createTranslationService(apiProvider);
export default translationService;
