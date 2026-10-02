import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaMapMarkerAlt, FaPhone, FaPlus, FaShieldAlt, FaTrash } from "react-icons/fa";
import PageContainer from "../components/PageContainer";
import Card from "../components/Card";
import Button from "../components/Button";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { createEmergencyContact, deleteEmergencyContact, getEmergencyContacts, getNearbyServices, updateEmergencyContact } from "../services/phase4Service";

const SafetyMap = lazy(() => import("../components/SafetyMap"));

export default function Safety() {
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState("");
  const [contactForm, setContactForm] = useState({ name: "", phone: "" });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showSOS, setShowSOS] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationState, setLocationState] = useState("idle");
  const [services, setServices] = useState([]);
  const [nearbyError, setNearbyError] = useState("");
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const sosTriggerRef = useRef(null);
  const sosCallRef = useRef(null);

  useEffect(() => {
    if (!showSOS) { sosTriggerRef.current?.focus(); return undefined; }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sosCallRef.current?.focus();
    const onKeyDown = (event) => { if (event.key === "Escape") setShowSOS(false); };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); };
  }, [showSOS]);

  async function loadContacts() {
    setContactsLoading(true); setContactsError("");
    try { setContacts(await getEmergencyContacts()); } catch (error) { setContactsError(error.response?.data?.detail || "Emergency contacts could not be loaded."); }
    finally { setContactsLoading(false); }
  }
  useEffect(() => { loadContacts(); }, []);

  function requestNearby() {
    if (!navigator.geolocation) { setLocationState("unavailable"); return; }
    setLocationState("requesting"); setNearbyError(""); setServices([]);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const point = { latitude: coords.latitude, longitude: coords.longitude };
      setLocation(point); setLocationState("ready"); setNearbyLoading(true);
      try { const result = await getNearbyServices(point.latitude, point.longitude); setServices(result.services); }
      catch (error) { setNearbyError(error.response?.data?.detail || "Nearby lookup is temporarily unavailable."); }
      finally { setNearbyLoading(false); }
    }, (error) => setLocationState(error.code === 1 ? "denied" : "unavailable"), { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  }

  function beginEdit(contact) { setEditingId(contact.id); setContactForm({ name: contact.name, phone: contact.phone }); setMessage(""); }
  async function saveContact(event) {
    event.preventDefault(); setSaving(true); setContactsError(""); setMessage("");
    try {
      if (editingId && editingId !== "new") await updateEmergencyContact(editingId, contactForm);
      else await createEmergencyContact(contactForm);
      setContactForm({ name: "", phone: "" }); setEditingId(null); setMessage("Emergency contact saved."); await loadContacts();
    } catch (error) { setContactsError(error.response?.data?.errors?.map((item) => item.message).join(" ") || error.response?.data?.detail || "Could not save that contact."); }
    finally { setSaving(false); }
  }
  async function removeContact(id) {
    if (!window.confirm("Delete this emergency contact?")) return;
    try { await deleteEmergencyContact(id); setContacts((items) => items.filter((item) => item.id !== id)); setMessage("Emergency contact deleted."); }
    catch (error) { setContactsError(error.response?.data?.detail || "Could not delete that contact."); }
  }

  return <PageContainer title="Traveler Safety" subtitle="Practical emergency information and tools for your journey" badge="YOUR LOCATION IS NEVER TRACKED">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-6">
        <Card variant="glass" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h2 className="text-xl font-bold text-white">Nearby emergency services</h2><p className="text-sm text-slate-400 mt-1">Optional, one-time lookup from OpenStreetMap within about 5 km.</p></div><Button variant="primary" onClick={requestNearby} loading={locationState === "requesting"} icon={<FaMapMarkerAlt />}>Use my location</Button></div>
          {locationState === "denied" && <p role="alert" className="text-amber-200">Location permission was denied. You can still call emergency services directly.</p>}
          {locationState === "unavailable" && <p role="alert" className="text-amber-200">This browser cannot provide location right now. You can still call emergency services directly.</p>}
          {locationState === "requesting" && <p role="status" className="text-slate-300">Waiting for your location permission…</p>}
          {nearbyLoading && <LoadingState message="Looking up nearby services in OpenStreetMap…" height="h-40" />}
          {nearbyError && <p role="alert" className="text-rose-200">{nearbyError}</p>}
          {location && !nearbyLoading && !nearbyError && <>
            {!services.length ? <EmptyState icon={<FaMapMarkerAlt />} title="No mapped services found nearby" description="OpenStreetMap may not have emergency-service listings for this area. For urgent help in India, call 112." /> : <>
              <div className="h-72 sm:h-96 rounded-2xl overflow-hidden border border-white/15"><Suspense fallback={<LoadingState message="Loading map…" height="h-full" />}><SafetyMap location={location} services={services} /></Suspense></div>
              <p className="text-xs text-slate-400">Source: OpenStreetMap / Overpass API. Map coverage may be incomplete; listings are not verified for availability or operational status. <a className="underline text-sky-300" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">Map attribution</a>.</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">{services.map((service) => <li key={service.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm"><p className="font-semibold text-white">{service.name}</p><p className="text-slate-400 capitalize">{service.kind.replaceAll("_", " ")}</p><a className="text-xs text-sky-300 underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${service.latitude}&mlon=${service.longitude}#map=17/${service.latitude}/${service.longitude}`}>Open map</a></li>)}</ul>
            </>}</>}
        </Card>

        <Card variant="glass" className="space-y-4"><h2 className="text-xl font-bold text-white flex items-center gap-2"><FaShieldAlt className="text-amber-300" />Travel safety guidance</h2><p className="text-xs text-slate-400">General static guidance, not live alerts or local official advice.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[
            ["Before you go", "Share your itinerary with someone you trust. Save offline booking details and keep essential medication accessible."],
            ["Road & transport", "Use marked crossings, wear helmets and seat belts, verify the vehicle and driver, and agree on fares before an unmetered ride."],
            ["Weather & environment", "Check local forecasts and official advisories. Carry water, protect from sun, and avoid floodwater or exposed trails in severe weather."],
            ["If you need help", "Move toward a staffed public place if safe. Tell a trusted person where you are, and call 112 for urgent police, fire or medical help."],
            ["Local-language help", "Use the phrasebook for a short request for help. Show the written phrase if speaking is difficult."],
          ].map(([title, text]) => <article key={title} className="rounded-xl bg-white/5 border border-white/10 p-4"><h3 className="font-semibold text-white">{title}</h3><p className="text-sm text-slate-300 mt-1 leading-relaxed">{text}</p></article>)}</div>
        </Card>
      </div>

      <aside className="space-y-6">
          <Card variant="glass" className="space-y-4"><h2 className="text-xl font-bold text-white">Emergency help in India</h2><p className="text-sm text-slate-300">112 is India’s pan-India emergency response number. SmartSafar does not place calls, send alerts, or share your location.</p><Button ref={sosTriggerRef} variant="danger" fullWidth onClick={() => setShowSOS(true)} aria-haspopup="dialog" icon={<FaPhone />}>Emergency options</Button><a className="block text-center text-sm text-sky-300 underline" href="https://112.gov.in/" target="_blank" rel="noreferrer">Official 112 ERSS information</a><p className="text-xs text-slate-500">Emergency number information verified from Government of India ERSS.</p></Card>

        <Card variant="glass" className="space-y-4"><div><h2 className="text-xl font-bold text-white">My emergency contacts</h2><p className="text-sm text-slate-400 mt-1">Private to your signed-in account.</p></div>
          {contactsError && <p role="alert" className="text-sm text-rose-200">{contactsError} <button className="underline" onClick={loadContacts}>Retry</button></p>}
          {contactsLoading ? <LoadingState message="Loading contacts…" height="h-36" /> : contacts.length === 0 && !editingId ? <EmptyState icon={<FaPhone />} title="No contacts saved" description="Add someone you trust. SmartSafar will not contact them automatically." /> : <ul className="space-y-2">{contacts.map((contact) => <li key={contact.id} className="rounded-xl bg-slate-900/70 border border-white/10 p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-semibold text-white break-words">{contact.name}</p><p className="text-sm text-amber-200">{contact.phone}</p></div><div className="flex gap-2"><button className="text-xs text-sky-300 underline" onClick={() => beginEdit(contact)}>Edit</button><button aria-label={`Delete ${contact.name}`} className="text-rose-300 p-1" onClick={() => removeContact(contact.id)}><FaTrash /></button></div></div></li>)}</ul>}
          {!editingId && <Button variant="glass" size="sm" onClick={() => { setContactForm({ name: "", phone: "" }); setEditingId("new"); setMessage(""); }} icon={<FaPlus />}>Add contact</Button>}
          {editingId && <form onSubmit={saveContact} className="space-y-3 border-t border-white/10 pt-4"><label className="block"><span className="smart-label">Name</span><input autoComplete="name" required minLength="1" maxLength="80" value={contactForm.name} onChange={(e) => setContactForm((v) => ({ ...v, name: e.target.value }))} className="smart-input" /></label><label className="block"><span className="smart-label">Phone</span><input type="tel" autoComplete="tel" required minLength="8" maxLength="20" pattern="\+?[0-9][0-9 ()-]{6,18}[0-9]" placeholder="+91 98765 43210" value={contactForm.phone} onChange={(e) => setContactForm((v) => ({ ...v, phone: e.target.value }))} className="smart-input" /></label><div className="flex gap-2"><Button type="submit" size="sm" loading={saving}>Save contact</Button><Button type="button" variant="ghost" size="sm" onClick={() => { setEditingId(null); setContactForm({ name: "", phone: "" }); }}>Cancel</Button></div></form>}
          {message && <p role="status" className="text-sm text-emerald-200">{message}</p>}
        </Card>

        <Card variant="solid" className="space-y-3"><h3 className="font-bold text-white">Emergency number</h3><p className="text-xs text-slate-400">India · one number for urgent response</p><div className="rounded-xl bg-white/5 border border-white/10 p-3 text-white"><strong>112</strong><span className="text-slate-400"> — Police, fire or medical emergency</span></div><Button variant="glass" fullWidth onClick={() => setShowSOS(true)}>Review emergency call options</Button><p className="text-xs text-slate-500">No call starts until you review the confirmation and choose to open your phone app.</p></Card>
      </aside>
    </div>

    {showSOS && createPortal(<div className="fixed inset-0 z-[1000] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowSOS(false); }}><section role="dialog" aria-modal="true" aria-labelledby="sos-title" className="w-full max-w-lg rounded-2xl border border-rose-400/30 bg-slate-900 p-6 shadow-2xl space-y-4"><h2 id="sos-title" className="text-2xl font-bold text-white">Emergency options</h2><p className="text-slate-300">SmartSafar cannot dispatch SOS alerts or send your location. If you need urgent help in India, call the Government of India emergency number 112.</p><div className="flex flex-col sm:flex-row gap-3"><a ref={sosCallRef} href="tel:112" className="inline-flex justify-center items-center rounded-xl bg-rose-600 px-5 py-3 font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300">Open phone to call 112</a><Button variant="glass" onClick={() => setShowSOS(false)}>Cancel</Button></div><p className="text-xs text-slate-500">Your phone app opens only after you choose the call link.</p></section></div>, document.body)}
  </PageContainer>;
}
