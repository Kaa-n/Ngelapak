"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Helper konversi koordinat spasial (x, y) <-> (lat, lng)
export function xyToLatLng(x: number | null | undefined, y: number | null | undefined): [number, number] {
  const normX = typeof x === "number" && !isNaN(x) ? x : 50;
  const normY = typeof y === "number" && !isNaN(y) ? y : 50;
  return [-8.796 + (normY - 50) * 0.0002, 115.176 + (normX - 50) * 0.0002];
}

export function latLngToXY(lat: number, lng: number): { x: number; y: number } {
  const x = Math.round(((lng - 115.176) / 0.0002 + 50) * 10) / 10;
  const y = Math.round(((lat - (-8.796)) / 0.0002 + 50) * 10) / 10;
  return { x, y };
}

const ZONE_PRESETS: { name: string; center: [number, number]; zoom: number }[] = [
  { name: "Rektorat", center: [-8.798, 115.173], zoom: 18 },
  { name: "Boulevard", center: [-8.796, 115.178], zoom: 18 },
  { name: "Student Center", center: [-8.794, 115.176], zoom: 18 },
  { name: "Agrokompleks", center: [-8.791, 115.181], zoom: 18 },
];

interface SpotMapPickerProps {
  initialX?: number | null;
  initialY?: number | null;
  onChange: (coords: { x: number; y: number; lat: number; lng: number }) => void;
}

// Client-only Leaflet Map component
function LeafletMapInner({
  initialX,
  initialY,
  onChange,
}: SpotMapPickerProps) {
  const { MapContainer, TileLayer, Marker, useMap, useMapEvents } = require("react-leaflet");

  const [position, setPosition] = useState<[number, number]>(() => {
    if (initialX != null && initialY != null) {
      return xyToLatLng(initialX, initialY);
    }
    return [-8.798, 115.173]; // Default Rektorat
  });

  const markerIcon = useMemo(() => {
    return L.divIcon({
      className: "admin-map-pin",
      html: `
        <div style="
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #003466;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border: 3px solid white;
          cursor: grab;
          transition: transform 0.15s ease;
        ">
          <span class="material-symbols-outlined" style="font-size: 20px; line-height: 1;">pin_drop</span>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
    });
  }, []);

  function MapClickHandler() {
    useMapEvents({
      click(e: any) {
        const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
        setPosition(newPos);
        const xy = latLngToXY(e.latlng.lat, e.latlng.lng);
        onChange({ x: xy.x, y: xy.y, lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  }

  function QuickJumpController({ target }: { target: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
      if (target) {
        map.flyTo(target, 18, { duration: 1 });
      }
    }, [target, map]);
    return null;
  }

  const [jumpTarget, setJumpTarget] = useState<[number, number] | null>(null);

  const currentXY = useMemo(() => latLngToXY(position[0], position[1]), [position]);

  return (
    <div className="space-y-3">
      {/* Preset shortcut zona */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-[#424750] flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px] text-[#003466]">near_me</span>
          Lompat ke Zona:
        </span>
        {ZONE_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => setJumpTarget(preset.center)}
            className="px-2.5 py-1 rounded-md bg-[#eaedff] text-[#003466] hover:bg-[#d8e0fc] font-medium transition-colors cursor-pointer"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Peta Container */}
      <div className="relative w-full h-[320px] rounded-xl overflow-hidden border border-[#cbd5e1] shadow-inner">
        <MapContainer
          center={position}
          zoom={17}
          scrollWheelZoom={false}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler />
          <QuickJumpController target={jumpTarget} />
          <Marker
            position={position}
            icon={markerIcon}
            draggable={true}
            eventHandlers={{
              dragend(e: any) {
                const marker = e.target;
                const latlng = marker.getLatLng();
                const newPos: [number, number] = [latlng.lat, latlng.lng];
                setPosition(newPos);
                const xy = latLngToXY(latlng.lat, latlng.lng);
                onChange({ x: xy.x, y: xy.y, lat: latlng.lat, lng: latlng.lng });
              },
            }}
          />
        </MapContainer>

        {/* Petunjuk overlay kecil */}
        <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-[#e2e7ff] text-[11px] text-[#424750] flex items-center justify-between pointer-events-none z-[1000]">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#003466]">touch_app</span>
            Klik peta atau geser pin untuk menetapkan titik lapak
          </span>
          <span className="font-mono font-bold text-[#003466]">
            X: {currentXY.x} | Y: {currentXY.y}
          </span>
        </div>
      </div>
    </div>
  );
}

// Export dynamic without SSR
const SpotMapPicker = dynamic(
  () => Promise.resolve(LeafletMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[320px] rounded-xl bg-[#eaedff] animate-pulse flex flex-col items-center justify-center text-xs text-[#737781] gap-2">
        <span className="material-symbols-outlined text-[32px] text-[#003466]">map</span>
        <span>Memuat peta pemilih koordinat...</span>
      </div>
    ),
  }
);

export default SpotMapPicker;
