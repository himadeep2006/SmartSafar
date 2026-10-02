import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart, FaMapMarkerAlt } from "react-icons/fa";
import Button from "./Button";

export default function DestinationCard({ destination, saved, saving, saveError, onToggleSaved }) {
  const [imageFailed, setImageFailed] = useState(false);
  const navigate = useNavigate();

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/15 bg-slate-900/80 shadow-glass transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/45 hover:bg-slate-800/90 hover:shadow-glass-hover">
      <Link to={`/destinations/${destination.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-800 via-blue-950 to-slate-950 sm:h-52">
          {!imageFailed && destination.image && (
            <img
              src={destination.image}
              alt={`${destination.name}, ${destination.state}`}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
          <span className="absolute left-3 top-3 rounded-full border border-amber-400/35 bg-slate-950/85 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
            {destination.category}
          </span>
          <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-950/85 px-2.5 py-1.5 text-xs font-medium text-slate-100">
            <FaMapMarkerAlt className="text-amber-400" aria-hidden="true" /> {destination.state}
          </span>
        </div>
      </Link>
      <div className="flex h-full flex-col gap-4 p-4 sm:p-5">
        <div>
          <h3 className="text-lg font-bold text-white transition-colors group-hover:text-amber-300">{destination.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-300">{destination.short_description}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-xs">
          <div><span className="block text-slate-500">Best time</span><span className="mt-0.5 block text-slate-200">{destination.best_time_to_visit}</span></div>
          <div><span className="block text-slate-500">Est. budget</span><span className="mt-0.5 block text-slate-200">{destination.estimated_budget}</span></div>
        </div>
        <div className="mt-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" fullWidth className="flex-1" onClick={() => navigate(`/destinations/${destination.id}`)}>View details</Button>
          <button
            type="button"
            onClick={() => onToggleSaved(destination)}
            disabled={saving}
            aria-label={saved ? `Remove ${destination.name} from saved destinations` : `Save ${destination.name}`}
            aria-pressed={saved}
            className="flex h-10 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-white transition hover:border-rose-300/60 hover:bg-rose-500/15 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" /> : saved ? <FaHeart className="text-rose-400" /> : <FaRegHeart />}
          </button>
        </div>
        {saveError && <p className="text-xs text-rose-200" role="alert">{saveError}</p>}
      </div>
    </article>
  );
}
