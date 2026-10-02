import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCompass } from "react-icons/fa";
import PageContainer from "../components/PageContainer";
import Card from "../components/Card";
import Button from "../components/Button";
import TripPlannerForm from "../components/TripPlannerForm";
import ItineraryView from "../components/ItineraryView";
import { getDestinations } from "../services/destinationService";
import { createTrip, generateTripPlan } from "../services/tripService";

export default function TripPlanner() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [destinationError, setDestinationError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getDestinations().then((items) => { if (active) setDestinations(items); }).catch((e) => { if (active) setDestinationError(e.response?.data?.detail || "Destinations could not be loaded."); }).finally(() => { if (active) setLoadingDestinations(false); });
    return () => { active = false; };
  }, []);

  const generate = async (values) => {
    setRequesting(true); setError(""); setPreview(null);
    try { setPreview({ ...await generateTripPlan(values), values }); }
    catch (e) { setError(e.response?.data?.detail || "Your itinerary could not be generated. Please try again."); }
    finally { setRequesting(false); }
  };
  const save = async () => {
    setSaving(true); setError("");
    try { const trip = await createTrip(preview.values); navigate(`/trips/${trip.id}`, { state: { saved: true } }); }
    catch (e) { setError(e.response?.data?.detail || "Your trip could not be saved. Please try again."); }
    finally { setSaving(false); }
  };

  return <PageContainer title="Plan your journey" badge="TRIP PLANNER" subtitle="Shape a flexible India itinerary around your pace, interests, and budget." action={<Button as={Link} to="/trips" variant="secondary">My trips</Button>}>
    <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><FaArrowLeft aria-hidden="true"/> Back to Explore</Link>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Card variant="darkGlass" hoverable={false} className="space-y-5"><div><h2 className="text-xl font-bold text-white">Your travel preferences</h2><p className="mt-1 text-sm text-slate-300">Your itinerary stays a preview until you choose Save trip.</p></div>
        {loadingDestinations ? <p role="status" className="text-slate-300">Loading the destination catalogue…</p> : destinationError ? <div role="alert" className="space-y-3 text-rose-100"><p>{destinationError}</p><Button variant="secondary" onClick={() => window.location.reload()}>Try again</Button></div> : <TripPlannerForm destinations={destinations} initialDestination={params.get("destination") || ""} onSubmit={generate} loading={requesting} error={error} />}
      </Card>
      <Card variant="accent" hoverable={false} className="space-y-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Flexible by design</p><h2 className="mt-1 text-2xl font-bold text-white">{preview ? preview.destination.name : "A thoughtful first draft"}</h2></div>{preview && <span className="rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-xs text-sky-100">Preference-based plan</span>}</div>
        {preview ? <><p className="text-sm text-slate-300">{preview.planner_label}. Review the suggestions and adjust them to local conditions before travelling.</p><ItineraryView days={preview.itinerary}/><div className="flex flex-wrap gap-3 border-t border-white/10 pt-4"><Button variant="gold" loading={saving} onClick={save}>Save trip</Button><Button variant="secondary" onClick={() => setPreview(null)}>Edit preferences</Button></div>{error && <p role="alert" className="text-sm text-rose-200">{error}</p>}</> : <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/25 px-5 py-12 text-center"><FaCompass aria-hidden="true" className="mx-auto text-3xl text-amber-300"/><h3 className="mt-4 font-semibold text-white">Your itinerary preview will appear here</h3><p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">SmartSafar builds a day-by-day structure from the curated catalogue. It does not use a paid AI service or live opening/route data.</p></div>}
      </Card>
    </div>
  </PageContainer>;
}
