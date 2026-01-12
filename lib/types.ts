import { Timestamp } from "firebase/firestore";

export interface Record {
    id: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    date: Timestamp; // EXIF date or manual entry
    location: {
        lat: number;
        lng: number;
        address?: string;
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
    color?: string; // Hex color code
}


