import React, { Suspense, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft, FaHeart, FaRegHeart, FaMapMarkerAlt } from "react-icons/fa";
import PageContainer from "../components/PageContainer";
import Button from "../components/Button";
import Card from "../components/Card";
import WeatherPanel from "../components/WeatherPanel";
import { getDestination, getSavedDestinations, removeSavedDestination, saveDestination } from "../services/destinationService";

const DestinationMap = React.lazy(() => import("../components/DestinationMap"));

export default function DestinationDetails() {
  const { destinationId } = useParams();
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState(false);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState("");
  const [savedAttempt, setSavedAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError("");
    setDestination(null);
    setImageFailed(false);
    getDestination(destinationId, { signal: controller.signal })
      .then((item) => { if (active) setDestination(item); })
      .catch((requestError) => {
        if (!active || controller.signal.aborted) return;
        setError(requestError.response?.status === 404 ? "We couldn’t find that destination." : requestError.response?.data?.detail || "This destination couldn’t be loaded. Please try again.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [destinationId, attempt]);

  useEffect(() => {
    let active = true;
    setSavedLoading(true);
    setSavedError("");
    getSavedDestinations()
      .then((items) => { if (active) setSaved(items.some((item) => item.id === destinationId)); })
      .catch((requestError) => { if (active) setSavedError(requestError.response?.data?.detail || "Saved status couldn’t be checked."); })
      .finally(() => { if (active) setSavedLoading(false); });
    return () => { active = false; };
  }, [destinationId, savedAttempt]);

  const toggleSaved = async () => {
    if (!destination || saving || savedLoading || savedError) return;
    setSaving(true);
    setSaveError("");
    try {
      if (saved) await removeSavedDestination(destination.id);
      else await saveDestination(destination.id);
      setSaved((current) => !current);
    } catch (requestError) {
      setSaveError(requestError.response?.data?.detail || "Couldn’t update your saved places. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <Link to="/dashboard#explore-india" className="inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
        <FaArrowLeft aria-hidden="true" /> Back to Explore
      </Link>
      {loading ? (
        <div role="status" aria-label="Loading destination details" className="space-y-5">
          <div className="h-72 animate-pulse rounded-3xl border border-white/10 bg-slate-900/80 sm:h-96" />
          <div className="grid gap-5 lg:grid-cols-3"><div className="h-48 animate-pulse rounded-2xl bg-slate-900/80 lg:col-span-2" /><div className="h-48 animate-pulse rounded-2xl bg-slate-900/80" /></div>
        </div>
      ) : error ? (
        <Card variant="darkGlass" hoverable={false} className="mx-auto max-w-2xl space-y-4 text-center">
          <div className="text-4xl" aria-hidden="true">🧭</div>
          <h1 className="text-2xl font-bold text-white">Destination unavailable</h1>
          <p className="text-slate-300" role="alert">{error}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {error.includes("couldn’t be found") ? <Button as={Link} to="/dashboard#explore-india" variant="primary">Back to Explore</Button> : <Button variant="secondary" onClick={() => setAttempt((value) => value + 1)}>Retry</Button>}
          </div>
        </Card>
      ) : destination ? (
        <div className="space-y-7">
          <section className="relative isolate min-h-[280px] overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 sm:min-h-[390px]">
            {!imageFailed && destination.image && <img src={destination.image} alt={`${destination.name}, ${destination.state}`} onError={() => setImageFailed(true)} className="absolute inset-0 -z-20 h-full w-full object-cover" />}
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/15" />
            <div className="flex min-h-[280px] flex-col justify-end gap-4 p-5 sm:min-h-[390px] sm:flex-row sm:items-end sm:justify-between sm:p-9">
              <div className="max-w-3xl space-y-3">
                <span className="inline-flex rounded-full border border-amber-400/35 bg-slate-950/75 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">{destination.category}</span>
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{destination.name}</h1>
                <p className="flex items-center gap-2 text-sm font-medium text-slate-200 sm:text-base"><FaMapMarkerAlt className="text-amber-300" aria-hidden="true" />{destination.state}, {destination.country}</p>
              </div>
              <div className="shrink-0">
                <div className="flex flex-wrap gap-2">
                <Button as={Link} to={`/planner?destination=${encodeURIComponent(destination.id)}`} variant="primary" size="md">Plan this trip</Button>
                <Button variant={saved ? "gold" : "secondary"} size="md" onClick={toggleSaved} loading={saving || savedLoading} disabled={Boolean(savedError)} icon={saved ? <FaHeart /> : <FaRegHeart />}>
                  {saved ? "Saved to your places" : "Save this place"}
                </Button>
                </div>
              </div>
            </div>
          </section>
          {savedError && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/20 bg-amber-950/35 px-4 py-3 text-sm text-amber-100" role="status"><span>{savedError}</span><Button variant="secondary" size="sm" onClick={() => setSavedAttempt((value) => value + 1)}>Check again</Button></div>}
          {saveError && <p className="rounded-xl border border-rose-300/20 bg-rose-950/35 px-4 py-3 text-sm text-rose-100" role="alert">{saveError}</p>}

          <div className="grid items-start gap-5 lg:grid-cols-3">
            <Card variant="darkGlass" hoverable={false} className="space-y-5 lg:col-span-2">
              <div><h2 className="text-xl font-bold text-white">About {destination.name}</h2><p className="mt-2 leading-relaxed text-slate-300">{destination.description}</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Best time to visit</p><p className="mt-1 font-semibold text-white">{destination.best_time_to_visit}</p></div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Estimated daily budget</p><p className="mt-1 font-semibold text-white">{destination.estimated_budget}</p></div>
              </div>
              <div><h3 className="mb-2 text-sm font-semibold text-slate-300">Travel notes</h3><div className="flex flex-wrap gap-2">{destination.tags.map((tag) => <span key={tag} className="rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-sky-200">{tag}</span>)}</div></div>
            </Card>
            <WeatherPanel destination={destination} />
          </div>
          <Suspense fallback={<div role="status" aria-label="Loading map" className="h-[300px] animate-pulse rounded-2xl border border-white/10 bg-slate-900/80 sm:h-[360px]" />}>
            <DestinationMap destination={destination} />
          </Suspense>
        </div>
      ) : null}
    </PageContainer>
  );
}
