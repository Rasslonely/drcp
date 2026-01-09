"use client";

import React, { useMemo } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Tooltip,
  ZoomControl
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DisasterEvent, AlertLevel, getDisasterEmoji } from "@/lib/disaster-sources";
import { MapPin, Activity, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// CUSTOM PULSE ICON
// =============================================================================

function createPulseIcon(alertLevel: AlertLevel) {
  const color = 
    alertLevel === AlertLevel.RED ? "#ef4444" : 
    alertLevel === AlertLevel.ORANGE ? "#fb923c" : 
    "#10b981";

  // We use a divIcon to render a custom HTML/CSS pulsar
  return L.divIcon({
    className: "custom-pulsar",
    html: `
      <div class="pulsar-wrapper">
        <div class="pulsar-ring" style="border-color: ${color}"></div>
        <div class="pulsar-ring delayed" style="border-color: ${color}"></div>
        <div class="pulsar-core" style="background-color: ${color}; box-shadow: 0 0 10px ${color}"></div>
      </div>
      <style>
        .pulsar-wrapper {
          position: relative;
          width: 12px;
          height: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pulsar-core {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          z-index: 2;
        }
        .pulsar-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid;
          border-radius: 50%;
          animation: leaflet-pulsar 2s infinite ease-out;
          opacity: 0;
          z-index: 1;
        }
        .pulsar-ring.delayed {
          animation-delay: 0.8s;
        }
        @keyframes leaflet-pulsar {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(4); opacity: 0; }
        }
      </style>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

// =============================================================================
// INNER COMPONENT
// =============================================================================

interface LeafletMapInnerProps {
  events: DisasterEvent[];
}

export default function LeafletMapInner({ events }: LeafletMapInnerProps) {
  // Indonesia Center
  const center: [number, number] = [-0.7893, 113.9213];
  const zoom = 5;

  return (
    <div className="h-full w-full bg-[#030712] relative">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        minZoom={4}
        maxZoom={12}
        style={{ height: "100%", width: "100%", background: "#030712" }}
        zoomControl={false}
        attributionControl={false}
        worldCopyJump={true}
        scrollWheelZoom={true}
      >
        {/* Professional Dark Matter Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />

        <ZoomControl position="bottomleft" />

        {/* Disaster Pulsars */}
        {events.map((event) => (
          <Marker 
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={createPulseIcon(event.alertLevel)}
          >
            {/* Tooltip positioned tight to the marker */}
            <Tooltip 
              direction="right" 
              offset={[10, 0]} 
              opacity={1} 
              className="bg-transparent border-none shadow-none p-0"
              sticky={true}
            >
              <div className="bg-[#0C0C0E]/95 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl min-w-[200px] pointer-events-none">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getDisasterEmoji(event.type)}</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">{event.type}</span>
                  </div>
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full animate-pulse",
                    event.alertLevel === AlertLevel.RED ? "bg-red-500" : "bg-emerald-500"
                  )} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-indigo-400 mt-0.5" />
                    <span className="text-[10px] text-gray-300 font-medium leading-tight">{event.location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
                    <div className="flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3 text-gray-500" />
                      <span className="text-[9px] text-gray-500 font-bold uppercase">Impact Risk</span>
                    </div>
                    <span className="text-[10px] text-white font-mono font-bold">{event.severity}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span className="text-[9px] text-gray-500 font-bold uppercase">Detected</span>
                    </div>
                    <span className="text-[9px] text-gray-400">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* Security Overlay Gradient */}
      <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-none z-[1000] shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
    </div>
  );
}
