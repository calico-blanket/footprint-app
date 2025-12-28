"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, Popup, useMap, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { PostingArea, PostingStatus } from "@/lib/types";
import LeafletDrawControl from "./LeafletDrawControl";
import AreaEditForm from "./AreaEditForm";
import { useAuth } from "./AuthProvider";
import { getPostingAreasCollection } from "@/lib/firestore";
import { addDoc, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import L from "leaflet";
import { Loader2, MapPin } from "lucide-react";

// Initial View: Takarazuka/Kobe
const INITIAL_CENTER: [number, number] = [34.79, 135.35];
const INITIAL_ZOOM = 12;

// Color mapping
const STATUS_COLORS: Record<PostingStatus, string> = {
    planned: "#e68d85", // primary-400 (Dusty Pink)
    completed: "#22c55e", // green-500
    cancelled: "#6b7280", // gray-500
};

function CurrentLocationMarker() {
    const map = useMap();
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (!("geolocation" in navigator)) return;

        const id = navigator.geolocation.watchPosition(
            (pos) => {
                setPosition({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                });
            },
            (err) => console.warn("Geolocation denied or failed", err),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(id);
    }, []);

    if (!position) return null;

    // Simple circle marker for "My Location"
    // Using native L.CircleMarker via react-leaflet is easier or just a custom icon marker
    // Let's use a custom div icon to make it a pulsing blue dot
    const pulsingIcon = L.divIcon({
        className: "css-icon",
        html: `<div class="w-4 h-4 bg-primary-400 rounded-full border-2 border-white shadow-md relative">
                 <div class="absolute inset-0 bg-primary-400 rounded-full animate-ping opacity-75"></div>
               </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });

    // We can also use L.Marker
    return (
        <Marker position={[position.lat, position.lng]} icon={pulsingIcon} zIndexOffset={1000}>
            <Popup>
                <div className="text-xs font-bold text-center">Current Location</div>
            </Popup>
        </Marker>
    );
}

// Wrapper for the pulsing marker as React-Leaflet component
function UserLocation() {
    const [pos, setPos] = useState<L.LatLngExpression | null>(null);

    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            (p) => setPos([p.coords.latitude, p.coords.longitude]),
            (e) => console.log(e),
            { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    if (!pos) return null;

    const pulsingIcon = L.divIcon({
        className: "custom-pin",
        html: `<div style="
            width: 16px; 
            height: 16px; 
            background: #e68d85; 
            border: 2px solid white; 
            border-radius: 50%; 
            box-shadow: 0 0 4px rgba(0,0,0,0.3);
            position: relative;
            ">
            <div style="
                position: absolute;
                inset: -4px;
                border-radius: 50%;
                background: #e68d85;
                opacity: 0.4;
                animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <style>
            @keyframes ping {
                75%, 100% { transform: scale(2); opacity: 0; }
            }
            </style>
        </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });

    // @ts-ignore
    return <Marker position={pos} icon={pulsingIcon} />;
}


// Separate component to use `useMap` hook for "Go to My Location" action
function MapControls() {
    const map = useMap();
    const [loading, setLoading] = useState(false);

    const handleGoToLocation = () => {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                map.flyTo([pos.coords.latitude, pos.coords.longitude], 16);
                setLoading(false);
            },
            (err) => {
                console.error(err);
                alert("位置情報を取得できませんでした");
                setLoading(false);
            }
        );
    };

    return (
        <div className="leaflet-bottom leaflet-left" style={{ bottom: "20px", left: "10px", pointerEvents: "auto", zIndex: 1000 }}>
            <button
                onClick={handleGoToLocation}
                className="bg-white p-2 rounded shadow-md border hover:bg-gray-100 flex items-center gap-2 text-sm font-bold"
                type="button"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 text-primary-600" />}
                Currently
            </button>
        </div>
    );
}


export default function PostingMap() {
    const { user } = useAuth();
    const [areas, setAreas] = useState<PostingArea[]>([]);

    // Subscribe to real-time updates
    useEffect(() => {
        const unsubscribe = onSnapshot(getPostingAreasCollection(), (snapshot) => {
            const data = snapshot.docs.map(d => d.data());
            setAreas(data);
        });
        return () => unsubscribe();
    }, []);

    const handleCreated = async (layer: any) => {
        if (!user) {
            alert("ログインしてください");
            return;
        }

        const geoJson = layer.toGeoJSON();
        // geoJson.geometry is what we want

        try {
            await addDoc(getPostingAreasCollection(), {
                // @ts-ignore properties need to be omitted or structured properly
                geometry: geoJson.geometry,
                status: "planned",
                memo: "",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                updatedBy: {
                    uid: user.uid,
                    displayName: user.displayName || "Unknown",
                    photoURL: user.photoURL || ""
                }
            } as any); // Casting as any to bypass Timestamp vs FieldValue type mismatch during creation
        } catch (e) {
            console.error(e);
            alert("エリアの作成に失敗しました");
        }
    };

    const handleSaveArea = async (id: string, updates: Partial<PostingArea>) => {
        if (!user) return;
        const ref = doc(db, "posting_areas", id);
        await updateDoc(ref, {
            ...updates,
            updatedAt: serverTimestamp(),
            updatedBy: {
                uid: user.uid,
                displayName: user.displayName || "Unknown",
                photoURL: user.photoURL || ""
            }
        });
    };

    const handleDeleteArea = async (id: string) => {
        if (!user) return;
        await deleteDoc(doc(db, "posting_areas", id));
    };

    // Helper to flip [lng, lat] to [lat, lng] for Leaflet Polygon
    const getPositions = (geometry: any) => {
        if (geometry.type !== "Polygon") return [];
        // Geometry coordinates: [ [ [lng, lat], ... ] ]
        // Leaflet expects: [ [lat, lng], ... ]
        return geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
    };

    return (
        <MapContainer center={INITIAL_CENTER} zoom={INITIAL_ZOOM} style={{ height: "100%", width: "100%" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <LeafletDrawControl onCreated={handleCreated} />

            <MapControls />
            <UserLocation />

            {areas.map(area => (
                <Polygon
                    key={area.id}
                    positions={getPositions(area.geometry)}
                    pathOptions={{
                        color: STATUS_COLORS[area.status] || "blue",
                        fillOpacity: 0.4
                    }}
                >
                    <Popup>
                        <AreaEditForm
                            area={area}
                            onSave={handleSaveArea}
                            onDelete={handleDeleteArea}
                        />
                    </Popup>
                </Polygon>
            ))}
        </MapContainer>
    );
}
