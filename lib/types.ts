import { Timestamp } from "firebase/firestore";

export interface Record {
    id: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    date: Timestamp; // EXIF date or manual entry
    location: {
        lat: number;
        lng: number;
    };
    memo: string;
    category: string;
    tags?: string[];
    imageUrls: string[];
    syncedFromOffline: boolean;
    userId: string;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
}

export interface CategoryItem {
    name: string;
    showOnMap: boolean;
}

export type PostingStatus = "planned" | "completed" | "cancelled";

export interface PostingArea {
    id: string;
    // Store as array of lat/lng objects for easier Leaflet usage, or GeoJSON.
    // Let's use array of lat/lng for simplicity with React-Leaflet if we don't strictly need GeoJSON queries yet.
    // However, the plan said GeoJSON. Let's stick to GeoJSON-like structure but maybe just points.
    // Actually, let's use a simpler structure that fits Leaflet: { lat: number, lng: number }[]
    // But standard GeoJSON is better for interoperability.
    // Let's use GeoJSON geometry object.
    geometry: {
        type: "Polygon";
        coordinates: number[][][]; // [ [lng, lat], [lng, lat], ... ]
    };
    status: PostingStatus;
    memo: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    updatedBy: {
        uid: string;
        displayName: string;
        photoURL: string;
    };
}
