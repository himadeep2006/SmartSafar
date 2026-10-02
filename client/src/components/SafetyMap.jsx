import React from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const serviceIcon = L.divIcon({ className: "safety-service-marker", html: '<span style="display:block;width:15px;height:15px;border:3px solid white;border-radius:50%;background:#38bdf8;box-shadow:0 0 12px #38bdf8"></span>', iconSize: [15, 15], iconAnchor: [7, 7] });
const callerIcon = L.divIcon({ className: "safety-user-marker", html: '<span style="display:block;width:17px;height:17px;border:3px solid white;border-radius:50%;background:#fbbf24;box-shadow:0 0 14px #fbbf24"></span>', iconSize: [17, 17], iconAnchor: [8, 8] });

export default function SafetyMap({ location, services }) {
  return <MapContainer center={[location.latitude, location.longitude]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Marker position={[location.latitude, location.longitude]} icon={callerIcon}><Popup>Your one-time location</Popup></Marker>
    {services.map((service) => <Marker key={`${service.kind}-${service.id}`} position={[service.latitude, service.longitude]} icon={serviceIcon}><Popup><strong>{service.name}</strong><br />{service.kind.replaceAll("_", " ")} · OpenStreetMap</Popup></Marker>)}
  </MapContainer>;
}
