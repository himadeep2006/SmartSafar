import React, { useEffect, useState } from "react";
import { FaEdit, FaSave, FaUserCircle } from "react-icons/fa";
import PageContainer from "../components/PageContainer";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import LoadingState from "../components/LoadingState";
import { TRAVEL_LANGUAGES } from "../data/travelPhrases";
import { getProfile, updateProfile } from "../services/phase4Service";

const empty = { display_name: "", email: "", username: "", phone: "", home_city: "", preferred_language: "English", travel_interests: "", travel_preferences: {} };

export default function Profile() {
  const [profile, setProfile] = useState(empty);
  const [draft, setDraft] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { const data = await getProfile(); setProfile(data); setDraft(data); }
    catch (err) { setError(err.response?.data?.detail || "Your profile could not be loaded."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function change(event) { const { name, value } = event.target; setDraft((prev) => ({ ...prev, [name]: value })); setSuccess(""); }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try { const data = await updateProfile(draft); setProfile(data); setDraft(data); setEditing(false); setSuccess("Your profile changes are saved."); }
    catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors?.map((item) => item.message).join(" ") || err.response?.data?.detail || "Your profile could not be saved.");
    } finally { setSaving(false); }
  }

  if (loading) return <PageContainer title="Traveller Profile" subtitle="Your SmartSafar account"><LoadingState message="Loading your profile…" /></PageContainer>;
  if (error && !profile.email) return <PageContainer title="Traveller Profile" subtitle="Your SmartSafar account"><Card variant="glass"><p role="alert" className="text-rose-200">{error}</p><Button className="mt-4" onClick={load}>Try again</Button></Card></PageContainer>;
  const initials = (profile.display_name || profile.username || "S").trim().slice(0, 1).toUpperCase();

  return <PageContainer title="Traveller Profile" subtitle="Manage your account details and travel preferences" badge="SMARTSAFAR ACCOUNT">
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <Card variant="glass" className="lg:col-span-1 h-fit text-center p-6 space-y-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center mx-auto shadow-gold-glow border-2 border-amber-300"><span aria-label="Profile initials" className="text-4xl font-extrabold text-slate-950">{initials}</span></div>
        <div><h2 className="text-2xl font-bold text-white">{profile.display_name || profile.username}</h2><p className="text-slate-400 text-sm mt-1 break-all">{profile.email}</p><p className="text-slate-500 text-xs mt-1">@{profile.username}</p></div>
        <Badge variant="gold" size="md" className="w-full justify-center"><FaUserCircle /> SMARTSAFAR TRAVELLER</Badge>
      </Card>

      <Card variant="glass" className="lg:col-span-3 space-y-5">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-4 border-b border-white/10">
          <div><h3 className="text-xl font-bold text-white">Personal information</h3><p className="text-sm text-slate-400">Your email and account name are read-only.</p></div>
          {!editing && <Button variant="glass" size="sm" onClick={() => { setDraft(profile); setEditing(true); setError(""); setSuccess(""); }} icon={<FaEdit />}>Edit profile</Button>}
        </div>
        <form onSubmit={save} className="space-y-5">
          {error && <p role="alert" className="text-sm text-rose-200">{error}</p>}{success && <p role="status" className="text-sm text-emerald-200">{success}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label htmlFor="profile-display-name" className="smart-label">Display name</label><input id="profile-display-name" name="display_name" required minLength="1" maxLength="80" value={draft.display_name} onChange={change} disabled={!editing || saving} className="smart-input" /></div>
            <div><label htmlFor="profile-email" className="smart-label">Email address</label><input id="profile-email" type="email" value={profile.email} disabled className="smart-input" /></div>
            <div><label htmlFor="profile-phone" className="smart-label">Phone number (optional)</label><input id="profile-phone" name="phone" type="tel" maxLength="20" pattern="\+?[0-9][0-9 ()-]{6,18}[0-9]" value={draft.phone || ""} onChange={change} disabled={!editing || saving} placeholder="+91 98765 43210" className="smart-input" /></div>
            <div><label htmlFor="profile-city" className="smart-label">Home city (optional)</label><input id="profile-city" name="home_city" maxLength="80" value={draft.home_city || ""} onChange={change} disabled={!editing || saving} className="smart-input" /></div>
            <div><label htmlFor="profile-language" className="smart-label">Preferred language</label><select id="profile-language" name="preferred_language" value={draft.preferred_language} onChange={change} disabled={!editing || saving} className="smart-select">{TRAVEL_LANGUAGES.map((item) => <option key={item}>{item}</option>)}</select></div>
            <div><label htmlFor="profile-interests" className="smart-label">Travel interests</label><input id="profile-interests" name="travel_interests" maxLength="500" value={draft.travel_interests || ""} onChange={change} disabled={!editing || saving} placeholder="Heritage, food, nature…" className="smart-input" /></div>
          </div>
          {editing && <div className="flex flex-wrap gap-3"><Button type="submit" loading={saving} icon={<FaSave />}>Save changes</Button><Button variant="ghost" disabled={saving} onClick={() => { setDraft(profile); setEditing(false); setError(""); }}>Cancel</Button></div>}
        </form>
      </Card>
    </div>
  </PageContainer>;
}
