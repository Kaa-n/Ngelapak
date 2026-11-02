"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Spot } from "@/lib/mock-data";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface InteractiveMapProps {
  spots: Spot[];
}

export default function InteractiveMap({ spots }: InteractiveMapProps) {
  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden">
      <MapContainer
        center={[-8.796, 115.176]}
        zoom={16}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={[
              -8.796 + (spot.koordinat.y - 50) * 0.0002,
              115.176 + (spot.koordinat.x - 50) * 0.0002,
            ]}
            icon={markerIcon}
          >
            <Popup>
              <div>
                <strong>{spot.nama}</strong>
                <br />
                {spot.lokasi}
                <br />
                Rp {spot.tarifPerHari.toLocaleString("id-ID")} / hari
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}