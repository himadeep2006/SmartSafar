import React, { useState } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

export default function TravelCard({
  title,
  subtitle,
  image,
  category,
  rating,
  location,
  ctaText = 'Explore',
  onCtaClick,
  badgeText,
  className = '',
}) {
  const [isSaved, setIsSaved] = useState(false);

  return (
    <div className={`group relative rounded-2xl overflow-hidden bg-white/10 border border-white/20 shadow-glass hover:shadow-glass-hover hover:border-amber-400/60 backdrop-blur-xl transition-all duration-300 flex flex-col ${className}`}>
      {/* Image Container */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-950">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center text-4xl">
            ✈️
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

        {/* Top Badges & Favorite Toggle Icon */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          {category ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-950/80 text-amber-400 border border-amber-500/40 backdrop-blur-md">
              {category}
            </span>
          ) : <div />}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsSaved(!isSaved);
            }}
            className="w-8 h-8 rounded-full bg-slate-950/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-md hover:bg-slate-900 transition-colors"
            title="Save destination"
          >
            {isSaved ? <FaHeart className="text-red-500 text-xs" /> : <FaRegHeart className="text-xs" />}
          </button>
        </div>

        {/* Location Tag */}
        {location && (
          <div className="absolute bottom-3 left-3 text-xs text-slate-200 font-medium flex items-center gap-1 bg-slate-950/80 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10">
            <span>📍</span>
            <span>{location}</span>
          </div>
        )}
      </div>


      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
              {title}
            </h3>
            {rating && (
              <div className="flex items-center gap-1 text-amber-400 text-xs font-bold shrink-0 bg-amber-400/10 px-2 py-0.5 rounded">
                <span>★</span>
                <span>{rating}</span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action CTA */}
        {onCtaClick && (
          <button
            onClick={onCtaClick}
            className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-amber-500 hover:text-slate-950 border border-white/15 hover:border-amber-400 transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <span>{ctaText}</span>
            <span>→</span>
          </button>
        )}
      </div>
    </div>
  );
}
