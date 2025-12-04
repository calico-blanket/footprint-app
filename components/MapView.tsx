"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Record } from "@/lib/types";
import L from "leaflet";
import Link from "next/link";
import { useEffect } from "react";

// Fix Leaflet default icon issue
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Component to update map center when centerLocation changes
function SetViewOnChange({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 15);
    }, [center, map]);
    return null;
}

interface MapViewProps {
    records: Record[];
    centerLocation?: { lat: number; lng: number } | null;
}

export default function MapView({ records, centerLocation }: MapViewProps) {
    // Use centerLocation if provided, otherwise use first record or default to Tokyo
    const center = centerLocation
        ? [centerLocation.lat, centerLocation.lng] as [number, number]
        : records.length > 0
            ? [records[0].location.lat, records[0].location.lng] as [number, number]
            : [35.6895, 139.6917] as [number, number];

    return (
        <MapContainer center={center} zoom={centerLocation ? 15 : 13} style={{ height: "100%", width: "100%" }}>
            {centerLocation && <SetViewOnChange center={center} />}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {records.map((record) => (
                <Marker
                    key={record.id}
                    position={[record.location.lat, record.location.lng]}
                    icon={icon}
                >
                    <Popup>
                        <div className="w-48">
                            {record.imageUrls.length > 0 && (
                                <img
                                    src={record.imageUrls[0]}
                                    alt="Thumbnail"
                                    className="w-full h-32 object-cover rounded mb-2"
                                />
                            )}
                            <p className="text-sm font-bold mb-1">{record.category}</p>
                            <p className="text-xs text-gray-600 mb-2">
                                {new Date(record.date.toDate()).toLocaleDateString()} {new Date(record.date.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-sm line-clamp-2 mb-2">{record.memo}</p>
                            {record.tags && record.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {record.tags.map(tag => (
                                        <span key={tag} className="inline-block px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded-full">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <Link
                                href={`/records/${record.id}`}
                                className="text-blue-600 text-sm hover:underline"
                            >
                                Edit / Details
                            </Link>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
