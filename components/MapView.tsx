"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Record } from "@/lib/types";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useState } from "react";

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
    const [lat, lng] = center;
    useEffect(() => {
        // Use flyTo for smoother animation when searching/centering
        map.flyTo([lat, lng], 16, {
            duration: 1.5
        });
    }, [lat, lng, map]);
    return null;
}

// Component to automatically fit bounds to visible records
function AutoFitBounds({ records, active }: { records: Record[], active: boolean }) {
    const map = useMap();

    useEffect(() => {
        if (!active || records.length === 0) return;

        const validRecords = records.filter(r => r.location);
        if (validRecords.length === 0) return;

        const bounds = L.latLngBounds(validRecords.map(r => [r.location.lat, r.location.lng]));
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
    categoryColors?: { [category: string]: string };
}

// Helper to create SVG icon HTML with custom color
function createColorIcon(color: string) {
    // Standard map marker shape svg
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="width: 25px; height: 41px; filter: drop-shadow(1px 2px 2px rgba(0,0,0,0.3));">
            <path fill="${color}" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 29.031-172.268 238.67-4.474 6.455-14.99 6.455-19.464 0z"/>
            <circle cx="192" cy="192" r="80" fill="white" opacity="0.3"/> 
        </svg>
    `;

    // Leaflet DivIcon
    return L.divIcon({
        className: 'custom-color-marker',
        html: svg,
        iconSize: [25, 41],
        iconAnchor: [12.5, 41],
        popupAnchor: [0, -41],
    });
}

// Fallback blue icon (same color as PRESET_COLORS[0])
const defaultColorIcon = createColorIcon("#3B82F6");

export default function MapView({ records, centerLocation, autoFit = false, categoryColors = {} }: MapViewProps) {
    // Filter and validate records
    const displayRecords = records.filter(r => r.location && typeof r.location.lat === 'number' && typeof r.location.lng === 'number');

    // State to track which record index is "on top" for each location group
    const [topRecordIndices, setTopRecordIndices] = useState<{ [key: string]: number }>({});

    // Use centerLocation if provided, otherwise use first record or default to Tokyo
    const defaultCenter: [number, number] = [35.6895, 139.6917];
    const center = centerLocation
        ? [centerLocation.lat, centerLocation.lng] as [number, number]
        : displayRecords.length > 0
            ? [displayRecords[0].location.lat, displayRecords[0].location.lng] as [number, number]
            : defaultCenter;

    // Proximity Grouping Logic
    // Threshold in degrees. Approx 0.00005 is roughly 5 meters.
    const PROXIMITY_THRESHOLD = 0.00005;

    // Map record ID to its "visual" location (group center)
    const recordVisualLocations: { [id: string]: { lat: number, lng: number } } = {};
    // Keep track of group keys to reuse collision logic
    const visualKeys: { [id: string]: string } = {};

    // Independent groups for visual clustering
    const visualGroups: { lat: number, lng: number, id: string }[] = [];

    displayRecords.forEach(record => {
        // Find if this record belongs to an existing visual group
        let assignedGroup = visualGroups.find(g =>
            Math.abs(g.lat - record.location.lat) < PROXIMITY_THRESHOLD &&
            Math.abs(g.lng - record.location.lng) < PROXIMITY_THRESHOLD
        );

        if (!assignedGroup) {
            // Create new group centered on this record
            assignedGroup = {
                lat: record.location.lat,
                lng: record.location.lng,
                id: `${record.location.lat}_${record.location.lng}` // Base ID
            };
            visualGroups.push(assignedGroup);
        }

        // Assign the group's location to this record
        recordVisualLocations[record.id] = { lat: assignedGroup.lat, lng: assignedGroup.lng };

        // Use the group's coordinates as the key for collision management
        const key = `${assignedGroup.lat}_${assignedGroup.lng}`;
        visualKeys[record.id] = key;
    });

    // Re-build collision groups based on VISUAL locations
    const collisionGroups: { [key: string]: string[] } = {};
    displayRecords.forEach(record => {
        const key = visualKeys[record.id];
        if (!collisionGroups[key]) {
            collisionGroups[key] = [];
        }
        collisionGroups[key].push(record.id);
    });

    return (
        <MapContainer center={center} zoom={centerLocation ? 15 : 13} style={{ height: "100%", width: "100%" }}>
            {centerLocation && <SetViewOnChange center={center} />}
            {autoFit && <AutoFitBounds records={displayRecords} active={autoFit} />}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {displayRecords.map((record) => {
                const visibleLoc = recordVisualLocations[record.id];
                const key = visualKeys[record.id];
                const group = collisionGroups[key];
                const currentIndex = topRecordIndices[key] || 0;

                // Determine if this record is currently the "top" one in its group
                // If it's a solo record, it's always top.
                // If it's in a group, it matches the current index.
                const isTop = group.length === 1 || group[currentIndex % group.length] === record.id;

                // Determine icon color
                const color = categoryColors[record.category];
                const markerIcon = color ? createColorIcon(color) : defaultColorIcon;

                return (
                    <Marker
                        key={record.id}
                        position={[visibleLoc.lat, visibleLoc.lng]} // Use VISUAL location (snapped)
                        icon={markerIcon}
                        zIndexOffset={isTop ? 1000 : 0} // Bring active record to front
                        eventHandlers={{
                            click: () => {
                                // Cycle to the next record in the group if multiple exist
                                if (group.length > 1) {
                                    setTopRecordIndices(prev => ({
                                        ...prev,
                                        [key]: (currentIndex + 1) % group.length
                                    }));
                                }
                            }
                        }}
                    >
                        <Popup>
                            <div className="w-48">
                                {group.length > 1 && (
                                    <div className="mb-2 px-2 py-1 bg-gray-100 rounded text-xs text-secondary-600 text-center font-medium">
                                        重なり: {(currentIndex % group.length) + 1} / {group.length}
                                        <div className="text-[10px] text-gray-400 font-normal">ピンをクリックで切替</div>
                                    </div>
                                )}
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
                                    詳細 / 編集
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
