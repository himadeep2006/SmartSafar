import React, { useState } from 'react';
import { FaPhone, FaMapMarkerAlt, FaShieldAlt, FaPlus, FaBell } from 'react-icons/fa';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function Safety() {
  const [emergencyContact] = useState({
    name: 'John Doe',
    phone: '+91 98765 43210',
  });

  const safeZones = [
    { name: 'Police Station', location: 'Near Main Street', distance: '0.5 km' },
    { name: 'Hospital', location: 'Central Area', distance: '1.2 km' },
    { name: 'Community Center', location: 'Downtown', distance: '2.1 km' },
    { name: 'Fire Station', location: 'East Zone', distance: '1.8 km' },
  ];

  const handleSOS = () => {
    alert('🚨 SOS Alert Activated!\n\nEmergency services have been notified.\nYour location: 123 Main Street, New Delhi, India');
  };

  const handleCall = () => {
    alert(`📞 Calling ${emergencyContact.name}...\n${emergencyContact.phone}`);
  };

  return (
    <PageContainer
      title="Traveler Safety & Emergency Network"
      subtitle="Real-time safe zone mapping, live location monitoring, and rapid emergency response"
      badge="MONITORING ACTIVE 🟢"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <Card variant="glass" className="lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Live Safety Map</h2>
                <p className="text-xs text-slate-400">Current Zone: New Delhi, India</p>
              </div>
              <Badge variant="blue" icon="📍">
                4 Safe Zones Nearby
              </Badge>
            </div>
            
            {/* Map Canvas Placeholder */}
            <div className="w-full h-80 sm:h-96 rounded-2xl bg-slate-950/90 border border-blue-500/30 relative overflow-hidden flex items-center justify-center shadow-inner">
              {/* Radar pulse background */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
              
              {/* Center User Location */}
              <div className="absolute w-8 h-8 bg-amber-500/30 rounded-full flex items-center justify-center" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="w-4 h-4 bg-amber-400 rounded-full animate-ping opacity-75" />
                <div className="absolute w-3 h-3 bg-amber-400 rounded-full shadow-gold-glow" />
              </div>

              {/* Fake Markers */}
              <div className="absolute w-3.5 h-3.5 bg-emerald-400 rounded-full shadow-lg" style={{ top: '30%', left: '30%' }} title="Police Station" />
              <div className="absolute w-3.5 h-3.5 bg-emerald-400 rounded-full shadow-lg" style={{ top: '65%', left: '25%' }} title="Hospital" />
              <div className="absolute w-3.5 h-3.5 bg-emerald-400 rounded-full shadow-lg" style={{ top: '45%', left: '75%' }} title="Community Center" />
              <div className="absolute w-3.5 h-3.5 bg-emerald-400 rounded-full shadow-lg" style={{ top: '70%', left: '70%' }} title="Fire Station" />

              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-xs">
                <span className="text-slate-300 font-medium truncate">📍 123 Main Street, New Delhi, India</span>
                <span className="text-amber-400 font-bold shrink-0 ml-2">Radar Live</span>
              </div>
            </div>

            {/* Safe Zones List */}
            <div className="mt-6 space-y-3">
              <h3 className="text-base font-bold text-white mb-3">Verified Safe Zones</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {safeZones.map((zone, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3.5 bg-slate-900/70 rounded-xl border border-white/10 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <FaMapMarkerAlt />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100 text-sm">{zone.name}</p>
                        <p className="text-xs text-slate-400">{zone.location}</p>
                      </div>
                    </div>
                    <Badge variant="emerald" size="sm">{zone.distance}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Emergency Sidebar */}
        <div className="space-y-6">
          {/* Emergency Contact */}
          <Card variant="glass" className="space-y-4">
            <SectionHeader
              title="Emergency Contact"
              icon={<FaPhone className="text-rose-400" />}
              className="mb-2"
            />

            <div className="bg-gradient-to-br from-slate-900 to-blue-950 p-5 rounded-2xl border border-blue-500/30 text-center">
              <div className="w-14 h-14 bg-amber-500/20 border border-amber-400/40 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                J
              </div>
              <h3 className="text-lg font-bold text-white">{emergencyContact.name}</h3>
              <p className="text-slate-400 text-xs mt-0.5">Primary Contact</p>
              <p className="text-amber-400 font-extrabold text-base mt-2">{emergencyContact.phone}</p>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                variant="danger"
                size="lg"
                onClick={handleCall}
                fullWidth
                icon={<FaPhone />}
              >
                Call Now
              </Button>

              <Button
                variant="glass"
                size="md"
                onClick={() => alert('Add new emergency contact')}
                fullWidth
                icon={<FaPlus />}
              >
                Add Contact
              </Button>
            </div>
          </Card>

          {/* SOS Emergency Trigger Card */}
          <Card variant="gold" className="border-red-500/40 space-y-4">
            <button
              onClick={handleSOS}
              className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-extrabold py-5 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-red-600/40 hover:shadow-red-600/60 flex flex-col items-center justify-center gap-1 active:scale-95"
            >
              <div className="flex items-center gap-2 text-2xl">
                <FaBell className="animate-bounce" />
                <span>ACTIVATE SOS</span>
              </div>
              <span className="text-xs text-red-100 font-normal">Instant 1-Tap Emergency Broadcast</span>
            </button>
            
            <div className="p-3 bg-red-950/60 rounded-xl border border-red-500/30 text-xs text-red-300 leading-relaxed text-center font-medium">
              ⚠️ Use only in severe emergencies. Your live GPS coordinates will be sent to local emergency services.
            </div>
          </Card>

          {/* Active Status Monitors */}
          <Card variant="solid" className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FaShieldAlt className="text-emerald-400" />
              Active System Monitors
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-300">GPS Location Tracking</span>
                <Badge variant="emerald" size="sm">ACTIVE</Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-300">Safe Zone Radar</span>
                <Badge variant="emerald" size="sm">ACTIVE</Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-300">Emergency Broadcast</span>
                <Badge variant="emerald" size="sm">READY</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

