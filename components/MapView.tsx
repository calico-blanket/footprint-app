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
        // Use flyTo for smoother animation when searching/centering
        map.flyTo(center, 16, {
            duration: 1.5
        });
    }, [center, map]);
    return null;
}

// Component to automatically fit bounds to visible records
function AutoFitBounds({ records, active }: { records: Record[], active: boolean }) {
    const map = useMap();

    useEffect(() => {
        if (!active || records.length === 0) return;

        const bounds = L.latLngBounds(records.map(r => [r.location.lat, r.location.lng]));
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [records, active, map]);

    return null;
}

interface MapViewProps {
    records: Record[];
    centerLocation?: { lat: number; lng: number } | null;
    autoFit?: boolean;
}

export default function MapView({ records, centerLocation, autoFit = false }: MapViewProps) {
    // Filter out "家事" category records from map display is now handled in parent component
    const displayRecords = records;

    // Use centerLocation if provided, otherwise use first record or default to Tokyo
    // Note: Initial center is less important if we use Geolocation in parent, but good fallback
    const defaultCenter: [number, number] = [35.6895, 139.6917];
    const center = centerLocation
        ? [centerLocation.lat, centerLocation.lng] as [number, number]
        : displayRecords.length > 0
            ? [displayRecords[0].location.lat, displayRecords[0].location.lng] as [number, number]
            : defaultCenter;

    return (
        <MapContainer center={center} zoom={centerLocation ? 15 : 13} style={{ height: "100%", width: "100%" }}>
            {centerLocation && <SetViewOnChange center={center} />}
            {autoFit && <AutoFitBounds records={displayRecords} active={autoFit} />}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {displayRecords.map((record) => (
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
                                className="text-primary-600 text-sm hover:underline"
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
