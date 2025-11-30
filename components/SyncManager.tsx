"use client";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getQueue, clearQueueItem, SyncAction } from "@/lib/idb";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { getUserRecordsCollection } from "@/lib/firestore";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";

export default function SyncManager() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const processQueue = async () => {
            if (!navigator.onLine) return;

            const queue = await getQueue();
            if (queue.length === 0) return;

            toast.info("Syncing offline images...");

            for (const item of queue) {
                try {
                    const action = item as SyncAction;

                    if (action.files && action.files.length > 0 && action.docId) {
                        // Upload images
                        const uploadedUrls = await Promise.all(
                            action.files.map(async (f) => {
                                // f.file is Blob. uploadImage takes File. Cast it.
                                // We need a filename. Blob doesn't have name.
                                // We can construct a File from Blob.
                                const file = new File([f.file], `offline_${Date.now()}.webp`, { type: f.file.type });
                                return uploadImage(file, user.uid);
                            })
                        );

                        // Fetch current doc to merge imageUrls
                        const docRef = doc(getUserRecordsCollection(user.uid), action.docId);
                        const docSnap = await getDoc(docRef);

                        if (docSnap.exists()) {
                            const currentData = docSnap.data();
                            const currentUrls = currentData.imageUrls || [];
                            // Append new URLs
                            await updateDoc(docRef, {
                                imageUrls: [...currentUrls, ...uploadedUrls]
                            });
                        }
                    }

                    await clearQueueItem(action.id!);
                } catch (error) {
                    console.error("Sync error for item", item.id, error);
                }
            }
            toast.success("Sync complete!");
        };

        window.addEventListener('online', processQueue);
        const interval = setInterval(processQueue, 30000); // Check every 30s

        // Initial check
        processQueue();

        return () => {
            window.removeEventListener('online', processQueue);
            clearInterval(interval);
        };
    }, [user]);

    return null;
}
