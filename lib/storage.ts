import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export async function uploadImage(file: File, userId: string) {
    const ext = file.name.split('.').pop() || 'webp';
    const path = `users/${userId}/images/${crypto.randomUUID()}.${ext}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
}

export async function deleteImage(url: string) {
    try {
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
    } catch (error) {
        console.error("Error deleting image", error);
    }
}
