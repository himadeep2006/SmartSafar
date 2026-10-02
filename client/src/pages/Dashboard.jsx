import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaCompass, FaLanguage, FaMapMarkedAlt, FaSearch, FaShieldAlt, FaTimes } from "react-icons/fa";
import PageContainer from "../components/PageContainer";
import SectionHeader from "../components/SectionHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import DestinationCard from "../components/DestinationCard";
import { useAuth } from "../auth/AuthContext";
import { getDestinations, getSavedDestinations, removeSavedDestination, saveDestination } from "../services/destinationService";

const categories = ["Beach", "Mountain", "Heritage", "Nature", "Spiritual", "City", "Adventure"];

function DestinationSkeleton() {
  return <div role="status" aria-label="Loading destinations" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75"><div className="h-48 animate-pulse bg-white/10" /><div className="space-y-3 p-5"><div className="h-5 w-2/3 animate-pulse rounded bg-white/10" /><div className="h-4 w-full animate-pulse rounded bg-white/5" /><div className="h-10 w-full animate-pulse rounded-xl bg-white/5" /></div></div>)}</div>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [savedDestinations, setSavedDestinations] = useState([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState("");
  const [savedAttempt, setSavedAttempt] = useState(0);
  const [savingIds, setSavingIds] = useState(() => new Set());
  const [saveErrors, setSaveErrors] = useState({});

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setCatalogError("");
    getDestinations({ search, category, signal: controller.signal })
      .then((items) => { if (active) setDestinations(items); })
      .catch((error) => { if (active && !controller.signal.aborted) setCatalogError(error.response?.data?.detail || "We couldn’t load destinations. Check your connection and try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [search, category, catalogAttempt]);

  useEffect(() => {
    let active = true;
    setSavedLoading(true);
    setSavedError("");
    getSavedDestinations()
      .then((items) => { if (active) setSavedDestinations(items); })
      .catch((error) => { if (active) setSavedError(error.response?.data?.detail || "Your saved list couldn’t be loaded."); })
      .finally(() => { if (active) setSavedLoading(false); });
    return () => { active = false; };
  }, [savedAttempt]);

  const savedIds = useMemo(() => new Set(savedDestinations.map((item) => item.id)), [savedDestinations]);

  const toggleSaved = async (destination) => {
    if (savingIds.has(destination.id)) return;
    setSavingIds((current) => new Set(current).add(destination.id));
    setSaveErrors((current) => ({ ...current, [destination.id]: "" }));
    try {
      if (savedIds.has(destination.id)) {
        await removeSavedDestination(destination.id);
        setSavedDestinations((current) => current.filter((item) => item.id !== destination.id));
      } else {
        const saved = await saveDestination(destination.id);
        setSavedDestinations((current) => current.some((item) => item.id === saved.id) ? current : [saved, ...current]);
      }
    } catch (error) {
      setSaveErrors((current) => ({ ...current, [destination.id]: error.response?.data?.detail || "Couldn’t update your saved destinations. Please try again." }));
    } finally {
      setSavingIds((current) => { const next = new Set(current); next.delete(destination.id); return next; });
    }
  };

  const clearFilters = () => { setSearchInput(""); setSearch(""); setCategory(""); };
  const username = user?.username || "Explorer";

  return (
    <PageContainer>
      <section className="relative overflow-hidden rounded-3xl border border-white/20 shadow-glass">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=2200&q=85" alt="Indian river landscape at dusk" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/25" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-5 p-6 sm:p-10 lg:p-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 text-xs font-bold tracking-wider text-amber-300">✦ YOUR INDIA JOURNEY</span>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">Namaste, <span className="text-amber-300">{username}</span></h1>
            <p className="text-xl font-bold text-slate-100 sm:text-2xl">Find the India that stays with you.</p>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">Discover remarkable places, compare the best time to visit, and keep your next journey close at hand.</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button as="a" href="#explore-india" variant="primary" size="md" icon={<FaCompass />}>Explore destinations</Button>
            <Button as={Link} to="/planner" variant="gold" size="md" icon={<FaMapMarkedAlt />}>Plan a trip</Button>
            <Button as={Link} to="/safety" variant="secondary" size="md" icon={<FaShieldAlt />}>Safety center</Button>
            <Button as={Link} to="/languages" variant="glass" size="md" icon={<FaLanguage />}>Language assistant</Button>
          </div>
        </div>
      </section>

      <section id="explore-india" className="scroll-mt-28 space-y-5 pt-3">
        <SectionHeader title="Explore India" subtitle="A thoughtful guide to destinations across the country" badge="DISCOVER YOUR NEXT STOP" icon={<FaMapMarkedAlt className="text-amber-400" />} />
        <Card variant="darkGlass" hoverable={false} className="space-y-4 p-4 sm:p-5">
          <form className="flex flex-col gap-3 sm:flex-row" role="search" onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); }}>
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search destinations</span>
              <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search places, states, or experiences" className="w-full rounded-xl border border-white/15 bg-slate-950/70 py-3 pl-11 pr-11 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40" />
              {searchInput && <button type="button" aria-label="Clear destination search" onClick={() => { setSearchInput(""); setSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"><FaTimes /></button>}
            </label>
            <Button type="submit" variant="primary" className="min-h-11 sm:min-w-32"><FaSearch aria-hidden="true" /> Search</Button>
          </form>
          <div className="flex flex-col gap-3 border-t border-white/10 pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" aria-label="Filter destinations by category">
              <button type="button" onClick={() => setCategory("")} aria-pressed={!category} className={`rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${!category ? "border-blue-400/60 bg-blue-500/20 text-white" : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"}`}>All places</button>
              {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(category === item ? "" : item)} aria-pressed={category === item} className={`rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${category === item ? "border-blue-400/60 bg-blue-500/20 text-white" : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"}`}>{item}</button>)}
            </div>
            {(searchInput || category) && <button type="button" onClick={clearFilters} className="self-start text-xs font-semibold text-sky-300 underline-offset-4 hover:text-white hover:underline lg:self-auto">Clear filters</button>}
          </div>
        </Card>

        <SectionHeader title={search || category ? "Matching destinations" : "Popular destinations"} subtitle={loading ? "Finding places for your journey…" : `${destinations.length} ${destinations.length === 1 ? "destination" : "destinations"} to explore`} />
        {catalogError ? <div className="rounded-2xl border border-rose-300/25 bg-rose-950/45 p-5 text-sm text-rose-100" role="alert"><p>{catalogError}</p><Button variant="secondary" size="sm" className="mt-3" onClick={() => setCatalogAttempt((attempt) => attempt + 1)}>Retry destinations</Button></div>
          : loading ? <DestinationSkeleton />
            : destinations.length === 0 ? <EmptyState icon="🧭" title="No destinations match those filters" description="Try another place or category to find your next stop." actionText="Clear filters" onAction={clearFilters} />
              : <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">{destinations.map((destination) => <DestinationCard key={destination.id} destination={destination} saved={savedIds.has(destination.id)} saving={savingIds.has(destination.id)} saveError={saveErrors[destination.id]} onToggleSaved={toggleSaved} />)}</div>}
      </section>

      <section id="saved-destinations" className="scroll-mt-28 space-y-5 pt-5">
        <SectionHeader title="Your saved places" subtitle="Keep a shortlist for the journeys you’re planning" badge="YOUR TRAVEL LIST" />
        {savedLoading ? <div role="status" aria-label="Loading saved destinations" className="h-36 animate-pulse rounded-2xl border border-white/10 bg-slate-900/65" />
          : savedError ? <div className="rounded-2xl border border-rose-300/25 bg-rose-950/45 p-5 text-sm text-rose-100" role="alert"><p>{savedError}</p><Button variant="secondary" size="sm" className="mt-3" onClick={() => setSavedAttempt((attempt) => attempt + 1)}>Retry saved list</Button></div>
            : savedDestinations.length === 0 ? <EmptyState icon="♡" title="Your travel list is waiting." description="Save a place that catches your eye and it will be here when you return." actionText="Explore destinations" onAction={() => document.getElementById("explore-india")?.scrollIntoView({ behavior: "smooth" })} />
              : <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">{savedDestinations.map((destination) => <DestinationCard key={destination.id} destination={destination} saved saving={savingIds.has(destination.id)} saveError={saveErrors[destination.id]} onToggleSaved={toggleSaved} />)}</div>}
      </section>
    </PageContainer>
  );
}
