import imageCompression from "browser-image-compression";

export async function compressImage(file: File) {
    const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1200,
        useWebWorker: false,
        fileType: "image/webp" as const,
    };
    try {
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error("Compression error", error);
        throw error;
    }
}
