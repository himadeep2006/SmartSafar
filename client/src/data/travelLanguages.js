export const TRAVEL_LANGUAGE_OPTIONS = [
  { code: "en", name: "English", nativeName: "English", speechRecognition: "en-IN", speechSynthesis: "en-IN", providerCode: "eng_Latn" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", speechRecognition: "hi-IN", speechSynthesis: "hi-IN", providerCode: "hin_Deva" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", speechRecognition: "ta-IN", speechSynthesis: "ta-IN", providerCode: "tam_Taml" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", speechRecognition: "te-IN", speechSynthesis: "te-IN", providerCode: "tel_Telu" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", speechRecognition: "kn-IN", speechSynthesis: "kn-IN", providerCode: "kan_Knda" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", speechRecognition: "ml-IN", speechSynthesis: "ml-IN", providerCode: "mal_Mlym" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", speechRecognition: "bn-IN", speechSynthesis: "bn-IN", providerCode: "ben_Beng" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", speechRecognition: "mr-IN", speechSynthesis: "mr-IN", providerCode: "mar_Deva" },
];

export const TRAVEL_LANGUAGES = TRAVEL_LANGUAGE_OPTIONS.map(({ name }) => name);
export const languageByCode = (code) => TRAVEL_LANGUAGE_OPTIONS.find((language) => language.code === code);
