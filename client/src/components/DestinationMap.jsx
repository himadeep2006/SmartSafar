import React, { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./DestinationMap.css";

const destinationIcon = L.divIcon({
  className: "smartsafar-map-marker",
  html: "<span></span>",
  iconSize: [30, 38],
  iconAnchor: [15, 36],
  popupAnchor: [0, -34],
});

function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => window.cancelAnimationFrame(frame);
  }, [map]);
  return null;
}

export default function DestinationMap({ destination }) {
  const [tileError, setTileError] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/15 bg-slate-900/80 shadow-glass">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div>
          <h2 className="font-bold text-white">Find it on the map</h2>
          <p className="text-xs text-slate-400">OpenStreetMap · {destination.latitude.toFixed(3)}, {destination.longitude.toFixed(3)}</p>
        </div>
        <span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold text-blue-200">OPEN MAP</span>
      </div>
      {tileError && <p className="px-4 pt-3 text-xs text-amber-200" role="status">Map tiles could not load. Check your connection; the destination pin remains available.</p>}
      <div className="destination-map h-[300px] sm:h-[360px]" aria-label={`Map showing ${destination.name}`}>
        <MapContainer center={[destination.latitude, destination.longitude]} zoom={11} scrollWheelZoom={false} className="h-full w-full">
          <ResizeMap />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{ tileerror: () => setTileError(true) }}
          />
          <Marker position={[destination.latitude, destination.longitude]} icon={destinationIcon}>
            <Popup><strong>{destination.name}</strong><br />{destination.state}, India</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
