import React, { useEffect, useState } from "react";

const interests = ["heritage", "nature", "food", "culture", "adventure", "wellness", "photography", "shopping"];
const activities = ["walking", "museums", "local food", "markets", "outdoors", "temples", "relaxation", "wildlife"];
const styles = ["balanced", "relaxed", "adventure", "culture", "food", "budget"];

export default function TripPlannerForm({ destinations, initialDestination = "", initialValues = {}, onSubmit, submitLabel = "Build my itinerary", loading = false, error = "", includeLogistics = true }) {
  const [form, setForm] = useState({ destination_id: initialDestination, duration_days: 3, budget_inr: 15000, travel_style: "balanced", interests: ["culture", "food"], preferred_activities: ["local food"], starting_location: "", companions: 1, start_date: "", title: "", ...initialValues });
  const [validation, setValidation] = useState("");
  useEffect(() => { if (initialDestination && !initialValues.destination_id) setForm((old) => ({ ...old, destination_id: initialDestination })); }, [initialDestination, initialValues.destination_id]);
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const toggle = (key, value) => setForm((old) => ({ ...old, [key]: old[key].includes(value) ? old[key].filter((item) => item !== value) : [...old[key], value] }));
  const submit = (event) => {
    event.preventDefault();
    if (!form.destination_id) return setValidation("Choose a destination to continue.");
    if (!form.interests.length) return setValidation("Choose at least one interest.");
    if (Number(form.duration_days) < 1 || Number(form.duration_days) > 14) return setValidation("Trip length must be between 1 and 14 days.");
    if (Number(form.budget_inr) < 1000 || Number(form.budget_inr) > 10000000) return setValidation("Set a total budget between ₹1,000 and ₹1,00,00,000.");
    if (Number(form.companions) < 1 || Number(form.companions) > 20) return setValidation("Traveller count must be between 1 and 20.");
    setValidation("");
    onSubmit({ ...form, duration_days: Number(form.duration_days), budget_inr: Number(form.budget_inr), companions: Number(form.companions), start_date: form.start_date || null, title: form.title || undefined });
  };
  const field = "w-full rounded-xl border border-white/15 bg-slate-950/60 px-3.5 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30";
  return <form className="space-y-5" onSubmit={submit} noValidate>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-1.5 text-sm text-slate-200 sm:col-span-2">Destination <span className="text-amber-300">*</span><select className={field} value={form.destination_id} onChange={(e) => set("destination_id", e.target.value)} required><option value="">Choose from Explore destinations</option>{destinations.map((destination) => <option key={destination.id} value={destination.id}>{destination.name}, {destination.state}</option>)}</select></label>
      <label className="space-y-1.5 text-sm text-slate-200">Days (1–14)<input className={field} type="number" min="1" max="14" value={form.duration_days} onChange={(e) => set("duration_days", e.target.value)} required /></label>
      <label className="space-y-1.5 text-sm text-slate-200">Total budget (₹)<input className={field} type="number" min="1000" max="10000000" step="500" value={form.budget_inr} onChange={(e) => set("budget_inr", e.target.value)} required /></label>
      <label className="space-y-1.5 text-sm text-slate-200">Travel style<select className={field} value={form.travel_style} onChange={(e) => set("travel_style", e.target.value)}>{styles.map((style) => <option key={style} value={style}>{style[0].toUpperCase() + style.slice(1)}</option>)}</select></label>
      <label className="space-y-1.5 text-sm text-slate-200">Start date (optional)<input className={field} type="date" value={form.start_date || ""} onChange={(e) => set("start_date", e.target.value)} /></label>
      {initialValues.title !== undefined && <label className="space-y-1.5 text-sm text-slate-200 sm:col-span-2">Trip title<input className={field} maxLength="100" value={form.title} onChange={(e) => set("title", e.target.value)} required /></label>}
      {includeLogistics && <><label className="space-y-1.5 text-sm text-slate-200">Starting location (optional)<input className={field} maxLength="100" placeholder="City or station" value={form.starting_location} onChange={(e) => set("starting_location", e.target.value)} /></label>
      <label className="space-y-1.5 text-sm text-slate-200">Travellers<input className={field} type="number" min="1" max="20" value={form.companions} onChange={(e) => set("companions", e.target.value)} /></label></>}
    </div>
    {[ ["interests", interests, "Interests", true], ["preferred_activities", activities, "Preferred activities", false] ].map(([key, options, heading, required]) => <fieldset key={key}><legend className="mb-2 text-sm font-semibold text-white">{heading}{required && <span className="text-amber-300"> *</span>}</legend><div className="flex flex-wrap gap-2">{options.map((option) => <label key={option} className={`cursor-pointer rounded-full border px-3 py-2 text-sm capitalize transition focus-within:ring-2 focus-within:ring-sky-400 ${form[key].includes(option) ? "border-sky-300/60 bg-sky-500/20 text-sky-100" : "border-white/15 bg-slate-950/30 text-slate-300 hover:border-white/30"}`}><input className="sr-only" type="checkbox" checked={form[key].includes(option)} onChange={() => toggle(key, option)} />{option}</label>)}</div></fieldset>)}
    {(validation || error) && <p className="rounded-xl border border-rose-300/25 bg-rose-950/40 px-4 py-3 text-sm text-rose-100" role="alert">{validation || error}</p>}
    <button type="submit" disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-300/30 bg-gradient-to-r from-blue-600 to-sky-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-950/40 transition hover:-translate-y-0.5 hover:shadow-blue-700/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-wait disabled:opacity-60">{loading ? "Building your plan…" : submitLabel}</button>
  </form>;
}
