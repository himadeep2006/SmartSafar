import React, { useEffect, useMemo, useState } from "react";
import { FaCopy, FaLanguage, FaSearch } from "react-icons/fa";
import PageContainer from "../components/PageContainer";
import Card from "../components/Card";
import Button from "../components/Button";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { getProfile, updateProfile } from "../services/phase4Service";
import { TRAVEL_LANGUAGES, TRAVEL_PHRASES } from "../data/travelPhrases";

const CATEGORIES = ["All", ...new Set(TRAVEL_PHRASES.map(({ category }) => category))];

export default function Languages() {
  const [profile, setProfile] = useState(null);
  const [language, setLanguage] = useState("English");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [state, setState] = useState("loading");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    getProfile().then((data) => { setProfile(data); setLanguage(data.preferred_language); setState("ready"); })
      .catch(() => { setError("Your saved language preference could not be loaded."); setState("error"); });
  }, []);

  const phrases = useMemo(() => TRAVEL_PHRASES.filter((phrase) =>
    (category === "All" || phrase.category === category) &&
    `${phrase.english} ${phrase.translations[language] || ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  ), [category, language, query]);

  async function selectLanguage(next) {
    if (next === language || !profile) return;
    setSaving(true); setError(""); setFeedback("");
    try {
      const saved = await updateProfile({ ...profile, preferred_language: next });
      setProfile(saved); setLanguage(saved.preferred_language); setFeedback(`${next} saved as your preferred language.`);
    } catch (err) { setError(err.response?.data?.detail || "Could not save your preferred language."); }
    finally { setSaving(false); }
  }

  async function copyPhrase(text) {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback("Phrase copied to clipboard.");
    } catch { setFeedback("Clipboard access is unavailable. Select and copy the phrase manually."); }
  }

  if (state === "loading") return <PageContainer title="Travel Phrasebook" subtitle="Useful words for getting around India"><LoadingState message="Loading your preferred language…" /></PageContainer>;
  if (state === "error") return <PageContainer title="Travel Phrasebook" subtitle="Useful words for getting around India"><Card variant="glass"><p role="alert" className="text-rose-200">{error}</p><Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button></Card></PageContainer>;

  return <PageContainer title="Travel Phrasebook" subtitle="Curated phrases for common travel moments across India" badge="OFFLINE-FRIENDLY PHRASEBOOK">
    <Card variant="glass" className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex-1">
          <label htmlFor="phrase-language" className="smart-label">Preferred phrase language</label>
          <select id="phrase-language" value={language} disabled={saving} onChange={(e) => selectLanguage(e.target.value)} className="smart-select max-w-md">
            {TRAVEL_LANGUAGES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        {saving && <span role="status" className="text-sm text-slate-300">Saving preference…</span>}
      </div>
      {error && <p role="alert" className="text-rose-200">{error}</p>}
      {feedback && <p role="status" className="text-sm text-emerald-200">{feedback}</p>}
      <p className="text-sm text-slate-400">These are curated phrases, not live machine translations. English is retained as your everyday reference.</p>
    </Card>

    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-4">
      <label className="relative"><span className="sr-only">Search travel phrases</span><FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Search travel phrases" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search phrases…" className="smart-input pl-11" /></label>
      <label><span className="sr-only">Filter phrase category</span><select aria-label="Filter phrase category" value={category} onChange={(e) => setCategory(e.target.value)} className="smart-select min-w-52">{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
    </div>

    {!phrases.length ? <EmptyState icon={<FaLanguage />} title="No phrases found" description="Try another search or choose a different category." /> :
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{phrases.map((phrase) => <Card key={phrase.id} variant="glass" className="space-y-4">
        <div className="flex items-center justify-between gap-3"><span className="text-xs uppercase tracking-widest text-amber-300">{phrase.category}</span><span className="text-xs text-slate-400">{language}</span></div>
        <div><p className="text-sm text-slate-400">{phrase.english}</p><p className="mt-1 text-xl font-semibold text-white break-words">{phrase.translations[language] || phrase.english}</p></div>
        <Button variant="glass" size="sm" onClick={() => copyPhrase(phrase.translations[language] || phrase.english)} icon={<FaCopy />} aria-label={`Copy ${phrase.category.toLowerCase()} phrase`}>Copy phrase</Button>
      </Card>)}</div>}
  </PageContainer>;
}
