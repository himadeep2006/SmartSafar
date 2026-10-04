import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaArrowRight, FaComments, FaCopy, FaExchangeAlt, FaLanguage, FaMicrophone, FaSearch, FaStop, FaVolumeUp } from "react-icons/fa";
import PageContainer from "../components/PageContainer";
import Card from "../components/Card";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { getProfile, updateProfile } from "../services/phase4Service";
import translationService from "../services/translationService";
import { TRAVEL_PHRASES, TRAVEL_LANGUAGES } from "../data/travelPhrases";
import { TRAVEL_LANGUAGE_OPTIONS, languageByCode } from "../data/travelLanguages";

const CATEGORIES = ["All", ...new Set(TRAVEL_PHRASES.map(({ category }) => category))];
const MAX_TRANSLATION_CHARACTERS = 500;

function SelectLanguage({ id, label, value, onChange, disabled = false }) {
  return <label htmlFor={id} className="block min-w-0 space-y-2">
    <span className="smart-label">{label}</span>
    <select id={id} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="smart-select w-full">
      {TRAVEL_LANGUAGE_OPTIONS.map((language) => <option key={language.code} value={language.code}>{language.name} · {language.nativeName}</option>)}
    </select>
  </label>;
}

function speechErrorMessage(error) {
  if (error === "not-allowed" || error === "service-not-allowed") return "Microphone permission was denied. You can type instead.";
  if (error === "no-speech") return "No speech was detected. Try again or type your message.";
  if (error === "audio-capture") return "No microphone is available. You can type instead.";
  return "Voice input could not be started. You can type instead.";
}

function MicrophoneButton({ listening, onClick, label }) {
  const stopLabel = label.replace(/^Start /, "");
  return <Button variant={listening ? "danger" : "glass"} size="sm" onClick={onClick} aria-label={listening ? `Stop ${stopLabel}` : label} aria-pressed={listening} icon={listening ? <FaStop aria-hidden="true" /> : <FaMicrophone aria-hidden="true" />}>
    {listening ? "Stop listening" : "Speak"}
  </Button>;
}

export default function Languages() {
  const [profile, setProfile] = useState(null);
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [preferenceLoading, setPreferenceLoading] = useState(true);
  const [savingPreference, setSavingPreference] = useState(false);
  const [preferenceError, setPreferenceError] = useState("");
  const [preferenceFeedback, setPreferenceFeedback] = useState("");

  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("te");
  const [sourceText, setSourceText] = useState("");
  const [translation, setTranslation] = useState("");
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState("");
  const [translationFeedback, setTranslationFeedback] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState("");

  const [conversationMode, setConversationMode] = useState(false);
  const [conversationDrafts, setConversationDrafts] = useState({ traveller: "", local: "" });
  const [conversation, setConversation] = useState([]);
  const [conversationError, setConversationError] = useState("");
  const [conversationBusy, setConversationBusy] = useState("");
  const [conversationRetrySide, setConversationRetrySide] = useState("");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [phraseFeedback, setPhraseFeedback] = useState("");

  useEffect(() => {
    let active = true;
    getProfile().then((data) => {
      if (!active) return;
      setProfile(data);
      setPreferredLanguage(data.preferred_language);
    }).catch(() => {
      if (active) setPreferenceError("Your preferred phrase language could not be loaded. Translator languages are still available.");
    }).finally(() => { if (active) setPreferenceLoading(false); });
    return () => {
      active = false;
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop?.();
        recognitionRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const phrases = useMemo(() => TRAVEL_PHRASES.filter((phrase) =>
    (category === "All" || phrase.category === category) &&
    `${phrase.english} ${phrase.translations[preferredLanguage] || ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  ), [category, preferredLanguage, query]);

  async function selectPreferredLanguage(next) {
    if (next === preferredLanguage || !profile) return;
    setSavingPreference(true); setPreferenceError(""); setPreferenceFeedback("");
    try {
      const saved = await updateProfile({ ...profile, preferred_language: next });
      setProfile(saved); setPreferredLanguage(saved.preferred_language); setPreferenceFeedback(`${next} saved as your preferred phrase language.`);
    } catch (error) {
      setPreferenceError(error.response?.data?.detail || "Could not save your preferred phrase language.");
    } finally { setSavingPreference(false); }
  }

  function swapLanguages() {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setTranslation("");
    setTranslationError("");
    setTranslationFeedback("");
  }

  async function translate(text = sourceText, from = sourceLanguage, to = targetLanguage) {
    setTranslationError(""); setTranslationFeedback("");
    if (!text.trim()) { setTranslationError("Enter text to translate."); return null; }
    if (text.length > MAX_TRANSLATION_CHARACTERS) { setTranslationError("Please shorten your text and try again."); return null; }
    if (from === to) { setTranslationError("Choose two different languages."); return null; }
    setTranslating(true); setTranslation("");
    try {
      const result = await translationService.translate({ text, sourceLanguage: from, targetLanguage: to });
      setTranslation(result.translation);
      return result.translation;
    } catch (error) {
      setTranslationError(error.message || "Translation service is temporarily unavailable.");
      return null;
    } finally { setTranslating(false); }
  }

  function startRecognition(id, languageCode, onTranscript) {
    setSpeechError("");
    const Recognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!Recognition) { setSpeechError("Voice input isn't supported in this browser. You can type instead."); return; }
    if (recognitionRef.current) {
      if (listening === id) recognitionRef.current.stop();
      else setSpeechError("Finish the current voice input before starting another.");
      return;
    }
    const speechLanguage = languageByCode(languageCode);
    const recognition = new Recognition();
    recognition.lang = speechLanguage.speechRecognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) onTranscript(transcript);
    };
    recognition.onerror = (event) => setSpeechError(speechErrorMessage(event.error));
    recognition.onend = () => { setListening(""); recognitionRef.current = null; };
    recognitionRef.current = recognition;
    setListening(id);
    try { recognition.start(); }
    catch { recognitionRef.current = null; setListening(""); setSpeechError("Voice input could not be started. You can type instead."); }
  }

  function speak(text, languageCode) {
    setSpeechError("");
    if (!text) return;
    if (typeof window === "undefined" || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      setSpeechError("Text-to-speech isn't supported in this browser."); return;
    }
    const language = languageByCode(languageCode);
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase() === language.speechSynthesis.toLowerCase())
      || window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith(language.code));
    if (!voice) { setSpeechError(`A ${language.name} speech voice isn't available in this browser.`); return; }
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = language.speechSynthesis;
    utterance.voice = voice;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => { setSpeaking(false); setSpeechError("The translated text could not be spoken."); };
    window.speechSynthesis.speak(utterance);
  }

  async function copyText(text, successMessage = "Copied") {
    try {
      await navigator.clipboard.writeText(text);
      setTranslationFeedback(successMessage);
    } catch { setTranslationFeedback("Clipboard access is unavailable. Select and copy the text manually."); }
  }

  async function translateConversationTurn(side) {
    const isTraveller = side === "traveller";
    const from = isTraveller ? sourceLanguage : targetLanguage;
    const to = isTraveller ? targetLanguage : sourceLanguage;
    const text = conversationDrafts[side];
    setConversationError(""); setConversationRetrySide("");
    if (!text.trim()) { setConversationError("Enter or speak a message before translating."); return; }
    if (text.length > MAX_TRANSLATION_CHARACTERS) { setConversationError("Please shorten your text and try again."); return; }
    if (from === to) { setConversationError("Choose two different languages."); return; }
    setConversationBusy(side);
    try {
      const result = await translationService.translate({ text, sourceLanguage: from, targetLanguage: to });
      setConversation((entries) => [...entries, { id: `${Date.now()}-${entries.length}`, side, sourceLanguage: from, targetLanguage: to, text: text.trim(), translation: result.translation }]);
      setConversationDrafts((drafts) => ({ ...drafts, [side]: "" }));
    } catch (error) {
      setConversationError(error.message || "Translation service is temporarily unavailable.");
      if (error.message === "Translation service is temporarily unavailable.") setConversationRetrySide(side);
    }
    finally { setConversationBusy(""); }
  }

  function applyPhrase(phrase) {
    setSourceText(phrase.english);
    setTranslation(""); setTranslationError(""); setTranslationFeedback("Phrase added to the translator. Choose a source language, then translate it.");
    document.getElementById("translator-input")?.focus();
  }

  async function copyPhrase(text) {
    try { await navigator.clipboard.writeText(text); setPhraseFeedback("Phrase copied."); }
    catch { setPhraseFeedback("Clipboard access is unavailable. Select and copy the phrase manually."); }
  }

  const sourceName = languageByCode(sourceLanguage).name;
  const targetName = languageByCode(targetLanguage).name;

  return <PageContainer title="Travel Languages" subtitle="Translate a conversation on the go, then browse reliable travel phrases" badge="INDIAN LANGUAGE COMPANION">
    <Card variant="glass" className="overflow-hidden !p-0">
      <div className="border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-slate-900/20 to-amber-400/10 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">Speak with confidence</p><h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">SmartSafar Translator</h2></div>
          <Button variant={conversationMode ? "gold" : "glass"} onClick={() => { setConversationMode((current) => !current); setConversationError(""); }} aria-pressed={conversationMode} icon={<FaComments aria-hidden="true" />}>Conversation Mode</Button>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">Type a message or use one-shot speech input. Translation sends only your text and selected languages.</p>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 sm:gap-4">
          <SelectLanguage id="source-language" label="I speak · source language" value={sourceLanguage} onChange={(value) => { setSourceLanguage(value); setTranslation(""); }} />
          <Button variant="gold" size="sm" className="mb-0.5 h-11 w-11 !p-0" onClick={swapLanguages} aria-label="Swap source and target languages" title="Swap languages"><FaExchangeAlt aria-hidden="true" /></Button>
          <SelectLanguage id="target-language" label="I want to communicate in · target language" value={targetLanguage} onChange={(value) => { setTargetLanguage(value); setTranslation(""); }} />
        </div>

        <label htmlFor="translator-input" className="block space-y-2">
          <span className="smart-label">Your message · {sourceName}</span>
          <textarea id="translator-input" value={sourceText} onChange={(event) => setSourceText(event.target.value)} maxLength={MAX_TRANSLATION_CHARACTERS} rows={4} placeholder="Type something to translate…" className="smart-input min-h-28 resize-y" aria-describedby="translation-character-count" />
          <span id="translation-character-count" className="block text-right text-xs text-slate-400">{sourceText.length}/{MAX_TRANSLATION_CHARACTERS}</span>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MicrophoneButton label="Start voice input" listening={listening === "translator"} onClick={() => startRecognition("translator", sourceLanguage, setSourceText)} />
          <Button variant="primary" size="lg" onClick={() => translate()} loading={translating} disabled={translating} icon={<FaLanguage aria-hidden="true" />}>{translating ? "Translating…" : "Translate"}</Button>
        </div>

        {translationError && <div className="rounded-xl border border-rose-300/25 bg-rose-950/35 p-3 text-sm text-rose-100" role="alert"><p>{translationError}</p>{translationError === "Translation service is temporarily unavailable." && <Button variant="secondary" size="sm" className="mt-3" onClick={() => translate()}>Retry</Button>}</div>}
        {speechError && <p role="alert" className="text-sm text-amber-200">{speechError}</p>}
        {translationFeedback && <p role="status" className="text-sm text-emerald-200">{translationFeedback}</p>}

        <section aria-labelledby="translation-output-heading" className="rounded-2xl border border-white/15 bg-slate-950/60 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="translation-output-heading" className="text-sm font-bold uppercase tracking-wider text-slate-300">Translated text · {targetName}</h3>
            {translating && <span role="status" className="text-xs text-sky-200">Translating your message…</span>}
          </div>
          <div className="mt-3 min-h-20 whitespace-pre-wrap break-words text-lg leading-relaxed text-white" aria-live="polite">{translation || <span className="text-sm text-slate-500">Your translation will appear here.</span>}</div>
          {translation && <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="glass" size="sm" onClick={() => speaking ? window.speechSynthesis.cancel() : speak(translation, targetLanguage)} icon={speaking ? <FaStop aria-hidden="true" /> : <FaVolumeUp aria-hidden="true" />}>{speaking ? "Stop listening" : "Listen"}</Button>
            <Button variant="glass" size="sm" onClick={() => copyText(translation)} icon={<FaCopy aria-hidden="true" />}>Copy</Button>
          </div>}
        </section>
      </div>
    </Card>

    {conversationMode && <Card variant="glass" className="space-y-5" aria-labelledby="conversation-heading">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="conversation-heading" className="text-xl font-bold text-white">Two-way conversation</h2><p className="mt-1 text-sm text-slate-400">Each person starts speech input explicitly. Messages stay in this page session only.</p></div><Button variant="secondary" size="sm" onClick={() => { setConversation([]); setConversationDrafts({ traveller: "", local: "" }); setConversationError(""); }}>Clear conversation</Button></div>
      <div className="grid gap-4 md:grid-cols-2">
        {[{ side: "traveller", title: "Your side", language: sourceLanguage, other: targetLanguage }, { side: "local", title: "Local person’s side", language: targetLanguage, other: sourceLanguage }].map(({ side, title, language, other }) => <section key={side} className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/45 p-4" aria-label={title}>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-200">{title} · {languageByCode(language).name}</p>
          <label className="mt-3 block"><span className="sr-only">{title} message</span><textarea value={conversationDrafts[side]} onChange={(event) => setConversationDrafts((drafts) => ({ ...drafts, [side]: event.target.value }))} rows={3} maxLength={MAX_TRANSLATION_CHARACTERS} placeholder={`Type a message in ${languageByCode(language).name}…`} className="smart-input min-h-20 resize-y" /></label>
          <div className="mt-3 flex flex-wrap gap-2">
            <MicrophoneButton
              label={`Start ${title.toLowerCase()} voice input`}
              listening={listening === `conversation-${side}`}
              onClick={() => startRecognition(`conversation-${side}`, language, (text) =>
                setConversationDrafts((drafts) => ({ ...drafts, [side]: text.slice(0, MAX_TRANSLATION_CHARACTERS) }))
              )}
            />
            <Button variant="primary" size="sm" loading={conversationBusy === side} disabled={Boolean(conversationBusy)} onClick={() => translateConversationTurn(side)} icon={<FaArrowRight aria-hidden="true" />}>Translate this message</Button>
          </div>
          <p className="mt-2 text-xs text-slate-400">Translation direction: {languageByCode(language).name} → {languageByCode(other).name}</p>
        </section>)}
      </div>
      {conversationError && <div role="alert" className="rounded-xl border border-rose-300/25 bg-rose-950/35 p-3 text-sm text-rose-100"><p>{conversationError}</p>{conversationRetrySide && <Button variant="secondary" size="sm" className="mt-3" onClick={() => translateConversationTurn(conversationRetrySide)}>Retry</Button>}</div>}
      {!conversation.length ? <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-slate-400">Conversation messages will appear here after a translation succeeds.</p> : <ol className="space-y-3" aria-label="Conversation history">{conversation.map((entry) => <li key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-semibold text-amber-200">{entry.side === "traveller" ? "You" : "Local person"} · {languageByCode(entry.sourceLanguage).name} → {languageByCode(entry.targetLanguage).name}</p><p className="mt-2 break-words text-white">{entry.text}</p><p className="mt-2 break-words text-slate-200">{entry.translation}</p><Button variant="glass" size="sm" className="mt-3" onClick={() => speak(entry.translation, entry.targetLanguage)} icon={<FaVolumeUp aria-hidden="true" />}>Listen</Button></li>)}</ol>}
    </Card>}

    <section className="space-y-5" aria-labelledby="phrasebook-heading">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Reliable offline fallback</p><h2 id="phrasebook-heading" className="mt-1 text-2xl font-extrabold text-white">Travel Phrases</h2><p className="mt-1 text-sm text-slate-400">Curated phrases remain available even when the translation provider is offline.</p></div>
      <Card variant="glass" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label htmlFor="phrase-language" className="block flex-1 space-y-2"><span className="smart-label">Preferred phrase language · separate from translator languages</span><select id="phrase-language" value={preferredLanguage} disabled={savingPreference || preferenceLoading || !profile} onChange={(event) => selectPreferredLanguage(event.target.value)} className="smart-select w-full max-w-md">{TRAVEL_LANGUAGES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          {preferenceLoading && <span role="status" className="text-sm text-slate-300">Loading your saved preference…</span>}{savingPreference && <span role="status" className="text-sm text-slate-300">Saving preference…</span>}
        </div>
        {preferenceError && <p role="alert" className="text-sm text-rose-200">{preferenceError}</p>}{preferenceFeedback && <p role="status" className="text-sm text-emerald-200">{preferenceFeedback}</p>}
        <p className="text-sm text-slate-400">Phrasebook translations are curated travel aids, not generated live translations.</p>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <label className="relative"><span className="sr-only">Search travel phrases</span><FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input aria-label="Search travel phrases" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search phrases…" className="smart-input pl-11" /></label>
        <label><span className="sr-only">Filter phrase category</span><select aria-label="Filter phrase category" value={category} onChange={(event) => setCategory(event.target.value)} className="smart-select min-w-52">{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      {phraseFeedback && <p role="status" className="text-sm text-emerald-200">{phraseFeedback}</p>}
      {!phrases.length ? <EmptyState icon={<FaLanguage />} title="No phrases found" description="Try another search or choose a different category." /> :
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{phrases.map((phrase) => <Card key={phrase.id} variant="glass" className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3"><span className="text-xs uppercase tracking-widest text-amber-300">{phrase.category}</span><span className="text-xs text-slate-400">{preferredLanguage}</span></div>
          <button type="button" onClick={() => applyPhrase(phrase)} className="block w-full break-words text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded-lg"><span className="block text-sm text-slate-400">{phrase.english}</span><span className="mt-1 block text-xl font-semibold text-white">{phrase.translations[preferredLanguage] || phrase.english}</span><span className="mt-2 block text-xs font-semibold text-sky-300">Use this phrase in translator</span></button>
          <Button variant="glass" size="sm" onClick={() => copyPhrase(phrase.translations[preferredLanguage] || phrase.english)} icon={<FaCopy />} aria-label={`Copy ${phrase.category.toLowerCase()} phrase`}>Copy phrase</Button>
        </Card>)}</div>}
    </section>
  </PageContainer>;
}
