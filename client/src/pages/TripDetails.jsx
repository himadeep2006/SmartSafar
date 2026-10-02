import React, { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaMapMarkerAlt } from "react-icons/fa";
import PageContainer from "../components/PageContainer";
import Card from "../components/Card";
import Button from "../components/Button";
import TripPlannerForm from "../components/TripPlannerForm";
import ItineraryView from "../components/ItineraryView";
import WeatherPanel from "../components/WeatherPanel";
import { deleteTrip, getTrip, regenerateTrip, updateTrip } from "../services/tripService";

const DestinationMap = React.lazy(() => import("../components/DestinationMap"));

function ConfirmDialog({ mode, title, error, busy, onClose, onConfirm }) {
  if (!mode) return null;
  const deleting = mode === "delete";
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"><section role="alertdialog" aria-modal="true" aria-labelledby="confirm-heading" className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl"><h2 id="confirm-heading" className="text-xl font-bold text-white">{deleting ? "Delete this trip?" : "Replace the current itinerary?"}</h2><p className="mt-2 text-sm text-slate-300">{deleting ? `“${title}” and its schedule will be permanently removed.` : "The saved schedule will be replaced using your current preferences. This cannot be undone."}</p>{error && <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p>}<div className="mt-6 flex justify-end gap-3"><Button variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button><Button variant={deleting ? "danger" : "gold"} loading={busy} onClick={onConfirm}>{deleting ? "Delete trip" : "Regenerate"}</Button></div></section></div>;
}

export default function TripDetails() {
  const { tripId } = useParams(); const navigate = useNavigate();
  const [trip, setTrip] = useState(null); const [destination, setDestination] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState(false); const [saving, setSaving] = useState(false); const [actionError, setActionError] = useState(""); const [dialog, setDialog] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; setLoading(true); setError(""); setTrip(null); getTrip(tripId).then((item) => { if (active) { setTrip(item); setDestination(item.destination); } }).catch((e) => { if (active) setError(e.response?.data?.detail || "This trip could not be loaded."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [tripId, attempt]);
  const update = async (values) => { const { destination_id, companions, starting_location, ...changes } = values; setSaving(true); setActionError(""); try { const saved = await updateTrip(trip.id, changes); setTrip(saved); setEditing(false); } catch (e) { setActionError(e.response?.data?.detail || "Trip preferences could not be saved."); } finally { setSaving(false); } };
  const confirmAction = async () => { setBusy(true); setActionError(""); try { if (dialog === "delete") { await deleteTrip(trip.id); navigate("/trips", { replace: true }); } else { const updated = await regenerateTrip(trip.id); setTrip(updated); setDialog(null); } } catch (e) { setActionError(e.response?.data?.detail || "That action could not be completed."); } finally { setBusy(false); } };

  if (loading) return <PageContainer><div role="status" className="space-y-4"><div className="h-64 animate-pulse rounded-3xl bg-slate-900/80"/><div className="h-40 animate-pulse rounded-2xl bg-slate-900/80"/></div></PageContainer>;
  if (error || !trip) return <PageContainer><Card variant="darkGlass" hoverable={false} className="mx-auto max-w-xl text-center"><h1 className="text-2xl font-bold text-white">Trip unavailable</h1><p role="alert" className="mt-3 text-slate-300">{error || "This trip could not be loaded."}</p><div className="mt-5 flex justify-center gap-3"><Button as={Link} to="/trips" variant="secondary">My trips</Button><Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button></div></Card></PageContainer>;
  return <PageContainer>
    <Link to="/trips" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><FaArrowLeft aria-hidden="true"/> My trips</Link>
    <section className="relative isolate flex min-h-64 flex-col justify-end overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-blue-950 to-slate-950 p-6 sm:min-h-80 sm:p-9">{destination?.image && <img src={destination.image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-65"/>}<div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent"/><span className="text-xs font-bold uppercase tracking-widest text-amber-200">{destination?.state} · {trip.duration_days} days</span><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-extrabold text-white sm:text-4xl">{trip.title}</h1><p className="mt-2 flex items-center gap-2 text-slate-200"><FaMapMarkerAlt aria-hidden="true"/>{destination?.name}, {destination?.state}</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => { setEditing(!editing); setActionError(""); }}>{editing ? "Cancel edit" : "Edit trip"}</Button><Button variant="danger" onClick={() => { setDialog("delete"); setActionError(""); }}>Delete</Button></div></div></section>
    {trip.itinerary_stale && <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-amber-300/25 bg-amber-950/35 p-4 sm:flex-row sm:items-center"><div><h2 className="font-semibold text-amber-100">Your preferences have changed</h2><p className="mt-1 text-sm text-amber-100/75">The current itinerary is preserved. Review it, then explicitly regenerate when you’re ready.</p></div><Button variant="gold" onClick={() => { setDialog("regenerate"); setActionError(""); }}>Regenerate itinerary</Button></div>}
    {editing && <Card variant="darkGlass" hoverable={false}><h2 className="mb-4 text-xl font-bold text-white">Update preferences</h2><TripPlannerForm destinations={[destination]} initialValues={{ ...trip, destination_id: trip.destination_id, title: trip.title, start_date: trip.start_date || "" }} onSubmit={update} loading={saving} error={actionError} submitLabel="Save preferences" includeLogistics={false}/></Card>}
    <div className="grid items-start gap-5 lg:grid-cols-3"><Card variant="darkGlass" hoverable={false} className="space-y-4 lg:col-span-2"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-sky-300">{trip.planner_label}</p><p className="mt-2 text-sm text-slate-300">{trip.travel_style} pace · {trip.companions} traveller{trip.companions === 1 ? "" : "s"} · budget ₹{trip.budget_inr.toLocaleString("en-IN")}</p></div>{trip.start_date && <span className="text-sm text-slate-300">Starts {new Date(`${trip.start_date}T00:00:00`).toLocaleDateString("en-IN")}</span>}</div><div className="flex flex-wrap gap-2">{trip.interests.map((tag) => <span key={tag} className="rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-1 text-xs capitalize text-sky-100">{tag}</span>)}</div></Card><WeatherPanel destination={destination}/></div>
    <ItineraryView days={trip.itinerary}/>
    <Suspense fallback={<div role="status" className="h-[300px] animate-pulse rounded-2xl border border-white/10 bg-slate-900/80 sm:h-[360px]"/>}><DestinationMap destination={destination}/></Suspense>
    {actionError && !editing && <p role="alert" className="text-sm text-rose-200">{actionError}</p>}
    <ConfirmDialog mode={dialog} title={trip.title} error={dialog ? actionError : ""} busy={busy} onClose={() => setDialog(null)} onConfirm={confirmAction}/>
  </PageContainer>;
}
