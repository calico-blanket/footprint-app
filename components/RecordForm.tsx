"use client";


import { useState, useEffect, ChangeEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { compressImage } from "@/lib/compression";
import { getExifData } from "@/lib/exif";
import exifr from "exifr";
import { uploadImage, deleteImage } from "@/lib/storage";
import { Timestamp, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs } from "firebase/firestore";
import { getUserRecordsCollection } from "@/lib/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Record, CategoryItem } from "@/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";
import ImageLightbox from "@/components/ImageLightbox";
import { DEFAULT_CATEGORIES } from "@/components/CategoryManager";
import { db } from "@/lib/firebase";

interface RecordFormProps {
    initialData?: Record;
}

// Helper function to format date for datetime-local input (in local timezone)
const formatDateTimeLocal = (date: Date): string => {
    const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
};

export default function RecordForm({ initialData }: RecordFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    // Separate state for existing images and new files for robust index handling
    const [existingImages, setExistingImages] = useState<string[]>(initialData?.imageUrls || []);
    const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    // Previews are combined from existing images and new files
    const [previews, setPreviews] = useState<string[]>([]);
    const [debugLog, setDebugLog] = useState<string>("");

    useEffect(() => {
        const newFilePreviews = newFiles.map(file => URL.createObjectURL(file));
        setPreviews([...existingImages, ...newFilePreviews]);

        // Cleanup object URLs to avoid leaks
        return () => {
            newFilePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [existingImages, newFiles]);
    const [memo, setMemo] = useState(initialData?.memo || "");
    const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
    const [category, setCategory] = useState(initialData?.category || DEFAULT_CATEGORIES[0]);
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    const [tagInput, setTagInput] = useState("");
    const [allTags, setAllTags] = useState<string[]>([]);
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [date, setDate] = useState<string>(
        initialData?.date
            ? formatDateTimeLocal(initialData.date.toDate())
            : formatDateTimeLocal(new Date())
    );
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
        initialData?.location || null
    );
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Load custom categories and all existing tags
    useEffect(() => {
        if (user) {
            const loadCategories = async () => {
                try {
                    const docRef = doc(db, "users", user.uid, "settings", "categories");
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data().list;
                        let loadedCategories: string[] = DEFAULT_CATEGORIES;

                        if (Array.isArray(data) && data.length > 0) {
                            if (typeof data[0] === 'string') {
                                loadedCategories = data as string[];
                            } else {
                                // Handle new CategoryItem structure
                                loadedCategories = (data as CategoryItem[]).map(c => c.name);
                            }
                        }

                        setCategories(loadedCategories);
                        // Update category if it's still default
                        if (!initialData) {
                            setCategory(loadedCategories[0]);
                        }
                    }
                } catch (error) {
                    console.error("Error loading categories:", error);
                }
            };

            const loadAllTags = async () => {
                try {
                    const snapshot = await getDocs(getUserRecordsCollection(user.uid));
                    const tagsSet = new Set<string>();
                    snapshot.docs.forEach(doc => {
                        const record = doc.data();
                        if (record.tags && Array.isArray(record.tags)) {
                            record.tags.forEach((tag: string) => tagsSet.add(tag));
                        }
                    });
                    const collator = new Intl.Collator('ja', { sensitivity: 'base' });
                    setAllTags(Array.from(tagsSet).sort(collator.compare));
                } catch (error) {
                    console.error("Error loading tags:", error);
                }
            };

            loadCategories();
            loadAllTags();
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
            const newFilesArray = Array.from(e.target.files);
            // Check total count (existing + current new + incoming new)
            if (existingImages.length + newFiles.length + newFilesArray.length > 5) {
                toast.error("最大5枚まで選択できます");
                return;
            }

            const processedFiles: File[] = [];

            for (const file of newFilesArray) {
                try {
                    // Debug: Raw EXIF
                    try {
                        const raw = await exifr.parse(file);
                        setDebugLog(prev => prev + `\n[${file.name}]\n` + JSON.stringify(raw, null, 2) + "\n");
                    } catch (e) {
                        setDebugLog(prev => prev + `\n[${file.name}] Error: ` + String(e) + "\n");
                    }

                    // Extract EXIF from original file
                    const exif = await getExifData(file);
                    if (exif) {
                        if (exif.lat && exif.lng && !initialData) {
                            setLocation({ lat: exif.lat, lng: exif.lng });
                            toast.info("写真から位置情報を取得しました");
                        }
                        if (exif.date && !initialData) {
                            const dateStr = formatDateTimeLocal(new Date(exif.date));
                            setDate(dateStr);
                            toast.info("写真から日付を取得しました");
                        }
                    }

                    // Compress
                    const compressed = await compressImage(file);
                    processedFiles.push(compressed);

                } catch (error) {
                    console.error("Error processing file", error);
                    toast.error(`画像の処理に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
                }
            }

            setNewFiles((prev) => [...prev, ...processedFiles]);
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

                const filesToQueue = newFiles.map(f => ({
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
                    imageUrls: existingImages, // Only existing ones, new ones handled by placeholder in offline sync logic (complex)
                    // Note: Offline sync logic might need update to handle mixing existing and new images correctly
                    // For now, we assume SyncManager handles it or we accept simplified behavior
                    userId: user.uid,
                };

                // For offline, we can't easily "delete" existing images from Storage yet.
                // We just update the record to not show them.
                // Actual storage deletion is not queueable in current architecture easily without custom payload.
                // We will skip storage deletion for offline for now (limitation).

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

            // 1. Delete removed images
            if (deletedImageUrls.length > 0) {
                await Promise.all(deletedImageUrls.map(url => deleteImage(url)));
            }

            // 2. Upload new images
            const newImageUrls = await Promise.all(newFiles.map((f) => uploadImage(f, user.uid)));

            // 3. Construct final list
            const finalImageUrls = [...existingImages, ...newImageUrls];

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
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
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
                                        if (i < existingImages.length) {
                                            // Removing an existing image
                                            const urlToDelete = existingImages[i];
                                            setDeletedImageUrls(prev => [...prev, urlToDelete]);
                                            setExistingImages(prev => prev.filter((_, idx) => idx !== i));
                                        } else {
                                            // Removing a new file
                                            const newFileIndex = i - existingImages.length;
                                            setNewFiles(prev => prev.filter((_, idx) => idx !== newFileIndex));
                                        }
                                        toast.success("写真を削除リストに追加しました");
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-300 focus:border-primary-400"
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
                    <div className="relative">
                        <div className="flex gap-2 mt-1">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setTagInput(value);

                                        // Update suggestions based on input
                                        if (value.trim()) {
                                            const lastTag = value.split(',').pop()?.trim() || '';
                                            if (lastTag) {
                                                const filtered = allTags.filter(
                                                    tag => tag.toLowerCase().includes(lastTag.toLowerCase()) && !tags.includes(tag)
                                                );
                                                setTagSuggestions(filtered);
                                                setSelectedSuggestionIndex(-1);
                                            } else {
                                                setTagSuggestions([]);
                                            }
                                        } else {
                                            setTagSuggestions([]);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "ArrowDown") {
                                            e.preventDefault();
                                            setSelectedSuggestionIndex(prev =>
                                                prev < tagSuggestions.length - 1 ? prev + 1 : prev
                                            );
                                        } else if (e.key === "ArrowUp") {
                                            e.preventDefault();
                                            setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
                                        } else if (e.key === "Enter") {
                                            e.preventDefault();

                                            // If a suggestion is selected, use it
                                            if (selectedSuggestionIndex >= 0 && tagSuggestions[selectedSuggestionIndex]) {
                                                const selectedTag = tagSuggestions[selectedSuggestionIndex];
                                                if (!tags.includes(selectedTag)) {
                                                    setTags([...tags, selectedTag]);
                                                }
                                                setTagInput("");
                                                setTagSuggestions([]);
                                                setSelectedSuggestionIndex(-1);
                                            } else if (tagInput.trim()) {
                                                // Process comma-separated tags
                                                const newTags = tagInput.split(',').map(t => t.trim()).filter(t => t && !tags.includes(t));
                                                if (newTags.length > 0) {
                                                    setTags([...tags, ...newTags]);
                                                }
                                                setTagInput("");
                                                setTagSuggestions([]);
                                            }
                                        } else if (e.key === "Escape") {
                                            setTagSuggestions([]);
                                            setSelectedSuggestionIndex(-1);
                                        }
                                    }}
                                    onBlur={() => {
                                        // Delay to allow clicking on suggestions
                                        setTimeout(() => {
                                            setTagSuggestions([]);
                                            setSelectedSuggestionIndex(-1);
                                        }, 200);
                                    }}
                                    placeholder="タグを入力してEnter（カンマ区切りで複数可）"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-400 focus:ring-primary-300 sm:text-sm p-2 pr-10 border text-gray-900"
                                />
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        if (tagSuggestions.length > 0) {
                                            setTagSuggestions([]);
                                        } else {
                                            const available = allTags.filter(t => !tags.includes(t));
                                            setTagSuggestions(available);
                                        }
                                    }}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                                    tabIndex={-1}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {tagSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                        {tagSuggestions.map((suggestion, index) => (
                                            <div
                                                key={suggestion}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    if (!tags.includes(suggestion)) {
                                                        setTags([...tags, suggestion]);
                                                    }
                                                    setTagInput("");
                                                    setTagSuggestions([]);
                                                    setSelectedSuggestionIndex(-1);
                                                }}
                                                className={`px-3 py-2 cursor-pointer ${index === selectedSuggestionIndex
                                                    ? 'bg-primary-100 text-primary-900'
                                                    : 'hover:bg-gray-100'
                                                    }`}
                                            >
                                                {suggestion}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (tagInput.trim()) {
                                        const newTags = tagInput.split(',').map(t => t.trim()).filter(t => t && !tags.includes(t));
                                        if (newTags.length > 0) {
                                            setTags([...tags, ...newTags]);
                                        }
                                        setTagInput("");
                                        setTagSuggestions([]);
                                    }
                                }}
                                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                            >
                                追加
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">例: 旅行, 東京, グルメ (#は不要です)</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:outline-none"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-400 focus:ring-primary-300 sm:text-sm p-2 border text-gray-900"
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-400 focus:ring-primary-300 sm:text-sm p-2 border text-gray-900"
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-400 focus:ring-primary-300 sm:text-sm p-2 border text-gray-900"
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
                    className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-300"
                >
                    📍 現在地を取得
                </button>

                <div>
                    <label className="block text-sm font-medium text-gray-700">メモ</label>
                    <textarea
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-400 focus:ring-primary-300 sm:text-sm p-2 border text-gray-900"
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
                        className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-400 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-300 disabled:opacity-50"
                    >
                        {loading ? "保存中..." : initialData ? "更新" : "保存"}
                    </button>
                </div>
            </form>

            <details className="mt-4 p-4 bg-gray-100 rounded text-xs border border-gray-300">
                <summary className="font-bold cursor-pointer text-gray-700">開発用デバッグログ (EXIF解析結果)</summary>
                <div className="mt-2 text-gray-800 whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                    {debugLog || "ここに写真のデータが表示されます..."}
                </div>
            </details>
        </>
    );
}
