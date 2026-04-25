"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon issue in Next.js
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLat?: number;
    initialLng?: number;
    center?: [number, number];
}

function LocationMarker({ onSelect, position, setPosition }: { onSelect: (lat: number, lng: number) => void, position: L.LatLng | null, setPosition: (p: L.LatLng) => void }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    return position === null ? null : (
        <Marker position={position} />
    );
}

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 13);
    }, [center, map]);
    return null;
}

export default function MapPicker({ onLocationSelect, initialLat, initialLng, center }: MapPickerProps) {
    const defaultCenter: [number, number] = [20.5937, 78.9629]; // Center of India
    const [position, setPosition] = useState<L.LatLng | null>(initialLat && initialLng ? new L.LatLng(initialLat, initialLng) : null);

    // Update internal position if external center changes
    useEffect(() => {
        if (center) {
            const newPos = new L.LatLng(center[0], center[1]);
            setPosition(newPos);
            onLocationSelect(center[0], center[1]);
        }
    }, [center]);
    
    return (
        <div className="h-[300px] w-full rounded-md border overflow-hidden">
            <MapContainer 
                center={initialLat && initialLng ? [initialLat, initialLng] : defaultCenter} 
                zoom={initialLat && initialLng ? 13 : 5} 
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {center && <ChangeView center={center} />}
                <LocationMarker onSelect={onLocationSelect} position={position} setPosition={setPosition} />
            </MapContainer>
        </div>
    );
}

