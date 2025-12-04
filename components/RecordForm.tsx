"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { compressImage } from "@/lib/compression";
import { getExifData } from "@/lib/exif";
import { uploadImage, deleteImage } from "@/lib/storage";
import { Timestamp, doc, setDoc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { getUserRecordsCollection } from "@/lib/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Record } from "@/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";
import ImageLightbox from "@/components/ImageLightbox";
import { DEFAULT_CATEGORIES } from "@/components/CategoryManager";
import { db } from "@/lib/firebase";

interface RecordFormProps {
    initialData?: Record;
}

export default function RecordForm({ initialData }: RecordFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>(initialData?.imageUrls || []);
    const [memo, setMemo] = useState(initialData?.memo || "");
    const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
    const [category, setCategory] = useState(initialData?.category || DEFAULT_CATEGORIES[0]);
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    const [tagInput, setTagInput] = useState("");
    const [date, setDate] = useState<string>(
        initialData?.date
            ? new Date(initialData.date.toDate()).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16)
    );
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
        initialData?.location || null
    );
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Load custom categories
    useEffect(() => {
        if (user) {
            const loadCategories = async () => {
                try {
                    const docRef = doc(db, "users", user.uid, "settings", "categories");
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const customCategories = docSnap.data().list || DEFAULT_CATEGORIES;
                        setCategories(customCategories);
                        // Update category if it's still default
                        if (!initialData) {
                            setCategory(customCategories[0]);
                        }
                    }
                } catch (error) {
                    console.error("Error loading categories:", error);
                }
            };
            loadCategories();
        }
    }, [user, initialData]);

    // Get current location
    useEffect(() => {
        if (!initialData && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => console.error("Geolocation error", err)
            );
        }
    }, [initialData]);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            if (files.length + newFiles.length + (initialData?.imageUrls.length || 0) > 5) {
                toast.error("最大5枚まで選択できます");
                return;
            }

            const processedFiles: File[] = [];
            const newPreviews: string[] = [];

            for (const file of newFiles) {
                try {
                    // Extract EXIF from original file
                    const exif = await getExifData(file);
                    if (exif) {
                        if (exif.lat && exif.lng && !initialData) {
                            setLocation({ lat: exif.lat, lng: exif.lng });
                            toast.info("写真から位置情報を取得しました");
                        }
                        if (exif.date && !initialData) {
                            const dateStr = new Date(exif.date).toISOString().slice(0, 16);
                            setDate(dateStr);
                            toast.info("写真から日付を取得しました");
                        }
                    }

                    // Compress
                    const compressed = await compressImage(file);
                    processedFiles.push(compressed);
                    newPreviews.push(URL.createObjectURL(compressed));
                } catch (error) {
                    console.error("Error processing file", error);
                    toast.error(`画像の処理に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
                }
            }

            setFiles((prev) => [...prev, ...processedFiles]);
            setPreviews((prev) => [...prev, ...newPreviews]);
        }
    };

    const handleDelete = async () => {
        if (!initialData || !user) return;
        setLoading(true);
        try {
            // Delete images
            await Promise.all(initialData.imageUrls.map((url) => deleteImage(url)));
            // Delete doc
            await deleteDoc(doc(getUserRecordsCollection(user.uid), initialData.id));
            toast.success("レコードを削除しました");
            router.push("/timeline");
        } catch (error) {
            console.error("Delete error", error);
            toast.error("削除に失敗しました");
            setLoading(false);
            setShowDelete(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error("ログインが必要です");
            return;
        }
        if (!location) {
            toast.error("位置情報を入力してください");
            return;
        }
        setLoading(true);

        try {
            // Offline handling
            if (!navigator.onLine) {
                const docRef = initialData
                    ? doc(getUserRecordsCollection(user.uid), initialData.id)
                    : doc(getUserRecordsCollection(user.uid));

                const id = docRef.id;

                const filesToQueue = files.map(f => ({
                    file: f,
                    urlPlaceholder: `offline:${id}:${f.name}`
                }));

                const recordData = {
                    updatedAt: Timestamp.now(),
                    date: Timestamp.fromDate(new Date(date)),
                    location,
                    memo,
                    category,
                    tags,
                    imageUrls: initialData?.imageUrls || [],
                    userId: user.uid,
                };

                if (initialData) {
                    await updateDoc(docRef, recordData);
                } else {
                    await setDoc(docRef, {
                        ...recordData,
                        id,
                        createdAt: Timestamp.now(),
                        syncedFromOffline: false,
                    });
                }

                if (filesToQueue.length > 0) {
                    const { addToQueue } = await import("@/lib/idb");
                    await addToQueue({
                        type: initialData ? 'update' : 'add',
                        collectionPath: getUserRecordsCollection(user.uid).path,
                        docId: id,
                        files: filesToQueue,
                        data: null
                    });
                }

                toast.success("オフラインで保存しました。オンライン時に同期されます。");
                router.push("/timeline");
                return;
            }

            // Online handling
            const newImageUrls = await Promise.all(files.map((f) => uploadImage(f, user.uid)));
            const finalImageUrls = [...(initialData?.imageUrls || []), ...newImageUrls];

            const recordData = {
                updatedAt: Timestamp.now(),
                date: Timestamp.fromDate(new Date(date)),
                location,
                memo,
                category,
                tags,
                imageUrls: finalImageUrls,
                userId: user.uid,
            };

            if (initialData) {
                const docRef = doc(getUserRecordsCollection(user.uid), initialData.id);
                await updateDoc(docRef, recordData);
                toast.success("レコードを更新しました");
            } else {
                const newDocRef = doc(getUserRecordsCollection(user.uid));
                await setDoc(newDocRef, {
                    ...recordData,
                    id: newDocRef.id,
                    createdAt: Timestamp.now(),
                    syncedFromOffline: false,
                });
                toast.success("レコードを保存しました");
            }

            router.push("/timeline");
        } catch (error) {
            console.error("Save error", error);
            toast.error("保存に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {lightboxOpen && (
                <ImageLightbox
                    images={previews}
                    currentIndex={lightboxIndex}
                    onClose={() => setLightboxOpen(false)}
                    onNext={() => setLightboxIndex((prev) => (prev + 1) % previews.length)}
                    onPrev={() => setLightboxIndex((prev) => (prev - 1 + previews.length) % previews.length)}
                />
            )}
            <ConfirmDialog
                isOpen={showDelete}
                title="レコードを削除"
                message="このレコードを削除してもよろしいですか？この操作は取り消せません。"
                onConfirm={handleDelete}
                onCancel={() => setShowDelete(false)}
            />
            <form onSubmit={handleSubmit} className="space-y-6 p-4 max-w-lg mx-auto bg-white rounded-lg shadow-sm">
                <div>
                    <label className="block text-sm font-medium text-gray-700">写真 (最大5枚)</label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                        {previews.map((src, i) => (
                            <div key={i} className="relative group">
                                <img
                                    src={src}
                                    alt="Preview"
                                    className="h-20 w-20 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => {
                                        setLightboxIndex(i);
                                        setLightboxOpen(true);
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPreviews(prev => prev.filter((_, index) => index !== i));
                                        const initialImageCount = initialData?.imageUrls.length || 0;
                                        if (i >= initialImageCount) {
                                            setFiles(prev => prev.filter((_, index) => index !== (i - initialImageCount)));
                                        }
                                        toast.success("写真を削除しました");
                                    }}
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="写真を削除"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">カテゴリー</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">タグ</label>
                    <div className="flex gap-2 mt-1">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (tagInput.trim()) {
                                        if (!tags.includes(tagInput.trim())) {
                                            setTags([...tags, tagInput.trim()]);
                                        }
                                        setTagInput("");
                                    }
                                }
                            }}
                            placeholder="タグを入力してEnter"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (tagInput.trim()) {
                                    if (!tags.includes(tagInput.trim())) {
                                        setTags([...tags, tagInput.trim()]);
                                    }
                                    setTagInput("");
                                }
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            追加
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">日時</label>
                    <input
                        type="datetime-local"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">緯度 (Latitude)</label>
                        <input
                            type="number"
                            step="any"
                            value={location?.lat || ""}
                            onChange={(e) => setLocation(prev => ({ ...prev!, lat: parseFloat(e.target.value) }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">経度 (Longitude)</label>
                        <input
                            type="number"
                            step="any"
                            value={location?.lng || ""}
                            onChange={(e) => setLocation(prev => ({ ...prev!, lng: parseFloat(e.target.value) }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            required
                        />
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        if ("geolocation" in navigator) {
                            navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                                    toast.success("現在地を取得しました");
                                },
                                (err) => {
                                    console.error("Geolocation error", err);
                                    toast.error("現在地の取得に失敗しました");
                                }
                            );
                        } else {
                            toast.error("お使いのブラウザは位置情報をサポートしていません");
                        }
                    }}
                    className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    📍 現在地を取得
                </button>

                <div>
                    <label className="block text-sm font-medium text-gray-700">メモ</label>
                    <textarea
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    />
                </div>

                <div className="flex gap-4">
                    {initialData && (
                        <button
                            type="button"
                            onClick={() => setShowDelete(true)}
                            disabled={loading}
                            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                            削除
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {loading ? "保存中..." : initialData ? "更新" : "保存"}
                    </button>
                </div>
            </form>
        </>
    );
}
