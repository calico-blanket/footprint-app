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
