"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export const DEFAULT_CATEGORIES = [
    "🍽️ 食事",
    "☕ カフェ",
    "🏨 宿泊",
    "🎭 観光",
    "🛍️ ショッピング",
    "🚆 移動",
    "📝 その他",
];

export default function CategoryManager() {
    const { user } = useAuth();
    const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
    const [newCategory, setNewCategory] = useState("");
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
                setCategories(docSnap.data().list || DEFAULT_CATEGORIES);
            }
        } catch (error) {
            console.error("Error loading categories:", error);
            setError(`読み込みエラー: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    const saveCategories = async (newList: string[]) => {
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
        if (categories.includes(newCategory.trim())) {
            toast.error("同じカテゴリーが既に存在します");
            return;
        }
        const updated = [...categories, newCategory.trim()];
        saveCategories(updated);
        setNewCategory("");
    };

    const handleDelete = (index: number) => {
        const updated = categories.filter((_, i) => i !== index);
        saveCategories(updated);
    };

    const handleReset = () => {
        if (confirm("デフォルトのカテゴリーに戻しますか？")) {
            saveCategories(DEFAULT_CATEGORIES);
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
                            <span className="text-sm">{cat}</span>
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
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                            placeholder="例: 🎨 アート"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
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
