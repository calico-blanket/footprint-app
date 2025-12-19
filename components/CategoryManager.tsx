"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

import { CategoryItem } from "@/lib/types";

export const DEFAULT_CATEGORIES: string[] = [
    "🍽️ 食事",
    "☕ カフェ",
    "🏨 宿泊",
    "🎭 観光",
    "🛍️ ショッピング",
    "🚆 移動",
    "📝 その他",
];

export const DEFAULT_CATEGORY_ITEMS: CategoryItem[] = DEFAULT_CATEGORIES.map(name => ({
    name,
    showOnMap: true
}));

export default function CategoryManager() {
    const { user } = useAuth();
    const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORY_ITEMS);
    const [newCategory, setNewCategory] = useState("");
    const [showOnMap, setShowOnMap] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadCategories();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadCategories = async () => {
        if (!user) return;
        try {
            const docRef = doc(db, "users", user.uid, "settings", "categories");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data().list;
                // Handle backward compatibility: check if data is string[] or CategoryItem[]
                if (Array.isArray(data) && data.length > 0) {
                    if (typeof data[0] === 'string') {
                        // Upgrade legacy string array to CategoryItem array
                        setCategories(data.map((name: string) => ({ name, showOnMap: true })));
                    } else {
                        setCategories(data as CategoryItem[]);
                    }
                } else {
                    setCategories(DEFAULT_CATEGORY_ITEMS);
                }
            }
        } catch (error) {
            console.error("Error loading categories:", error);
            setError(`読み込みエラー: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    const saveCategories = async (newList: CategoryItem[]) => {
        if (!user) return;
        try {
            const docRef = doc(db, "users", user.uid, "settings", "categories");
            await setDoc(docRef, { list: newList });
            setCategories(newList);
            toast.success("カテゴリーを保存しました");
            setError(null);
        } catch (error) {
            console.error("Error saving categories:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            setError(`保存エラー: ${errorMessage}`);
            toast.error(`保存に失敗しました: ${errorMessage}`);
        }
    };

    const handleAdd = () => {
        if (!newCategory.trim()) {
            toast.error("カテゴリー名を入力してください");
            return;
        }
        if (categories.some(c => c.name === newCategory.trim())) {
            toast.error("同じカテゴリーが既に存在します");
            return;
        }
        const updated = [...categories, { name: newCategory.trim(), showOnMap }];
        saveCategories(updated);
        setNewCategory("");
        setShowOnMap(true); // Reset to default
    };

    const handleDelete = (index: number) => {
        const updated = categories.filter((_, i) => i !== index);
        saveCategories(updated);
    };

    const handleReset = () => {
        if (confirm("デフォルトのカテゴリーに戻しますか？")) {
            saveCategories(DEFAULT_CATEGORY_ITEMS);
        }
    };

    if (loading) {
        return <div className="p-4">読み込み中...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">カテゴリー管理</h2>

                {/* Category list */}
                <div className="space-y-2 mb-6">
                    {categories.map((cat, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-sm">{cat.name}</span>
                                <button
                                    onClick={() => {
                                        const updated = [...categories];
                                        updated[i].showOnMap = !updated[i].showOnMap;
                                        saveCategories(updated);
                                    }}
                                    className={`p-1 rounded-full text-xs flex items-center gap-1 ${cat.showOnMap
                                        ? "text-green-600 bg-green-50 hover:bg-green-100"
                                        : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                                        }`}
                                    title={cat.showOnMap ? "マップに表示中" : "マップで非表示"}
                                >
                                    {cat.showOnMap ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <span className="hidden sm:inline">表示</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                            <span className="hidden sm:inline">非表示</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <button
                                onClick={() => handleDelete(i)}
                                className="text-red-500 hover:text-red-700 text-sm"
                            >
                                削除
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add new category */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                        新しいカテゴリーを追加
                    </label>
                    <div className="flex gap-2 items-start">
                        <div className="flex-1 space-y-2">
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                                placeholder="例: 🎨 アート"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="showOnMap"
                                    checked={showOnMap}
                                    onChange={(e) => setShowOnMap(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="showOnMap" className="text-sm text-gray-700 cursor-pointer select-none">
                                    マップに表示する
                                </label>
                            </div>
                        </div>
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            追加
                        </button>
                    </div>
                    <p className="text-xs text-gray-500">
                        💡 絵文字を使うと見やすくなります（Windowsキー + . で絵文字パネルを開けます）
                    </p>
                </div>

                {/* Reset button */}
                <div className="mt-6 pt-6 border-t">
                    <button
                        onClick={handleReset}
                        className="text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                        デフォルトに戻す
                    </button>
                </div>
            </div>
        </div>
    );
}
