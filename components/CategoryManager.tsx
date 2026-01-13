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

// Preset colors for pins (Tailwind-ish compatible hex codes)
const PRESET_COLORS = [
    "#3B82F6", // Blue (Default)
    "#EF4444", // Red
    "#F59E0B", // Amber
    "#10B981", // Emerald
    "#8B5CF6", // Violet
    "#EC4899", // Pink
    "#6366F1", // Indigo
    "#14B8A6", // Teal
    "#F97316", // Orange
    "#6B7280", // Gray
];

export default function CategoryManager() {
    const { user } = useAuth();
    const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORY_ITEMS);
    const [newCategory, setNewCategory] = useState("");
    const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
    const [showOnMap, setShowOnMap] = useState(true);
    const [activeColorPicker, setActiveColorPicker] = useState<number | 'new' | null>(null);

    // Close color picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if ((event.target as HTMLElement).closest('.color-picker-container')) return;
            setActiveColorPicker(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ... (loadCategories, saveCategories, etc. remain same)

    const handleAdd = () => {
        if (!newCategory.trim()) {
            toast.error("カテゴリー名を入力してください");
            return;
        }
        if (categories.some(c => c.name === newCategory.trim())) {
            toast.error("同じカテゴリーが既に存在します");
            return;
        }
        const updated = [...categories, {
            name: newCategory.trim(),
            showOnMap,
            color: newColor
        }];
        saveCategories(updated);
        setNewCategory("");
        setNewColor(PRESET_COLORS[0]);
        setShowOnMap(true); // Reset to default
        setActiveColorPicker(null);
    };

    const handleColorUpdate = (index: number, color: string) => {
        const updated = [...categories];
        updated[index].color = color;
        saveCategories(updated);
        setActiveColorPicker(null);
    };

    // ... (handleDelete, handleReset remain same)

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
                                {/* Color Picker Dropdown for existing items */}
                                <div className="relative color-picker-container">
                                    <button
                                        className="w-6 h-6 rounded-full border border-gray-200 shadow-sm transition-transform hover:scale-110"
                                        style={{ backgroundColor: cat.color || PRESET_COLORS[0] }}
                                        title="色を変更"
                                        onClick={() => setActiveColorPicker(activeColorPicker === i ? null : i)}
                                    />
                                    {activeColorPicker === i && (
                                        <div className="absolute left-0 top-full mt-1 bg-white p-2 rounded shadow-xl grid grid-cols-5 gap-1 z-10 w-[140px] border border-gray-100">
                                            {PRESET_COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    className="w-5 h-5 rounded-full hover:scale-125 transition-transform border border-gray-100"
                                                    style={{ backgroundColor: c }}
                                                    onClick={() => handleColorUpdate(i, c)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-medium">{cat.name}</span>
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
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700">
                        新しいカテゴリーを追加
                    </label>
                    <div className="flex gap-2 items-start flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-2">
                            {/* Color Picker for new item */}
                            <div className="relative color-picker-container">
                                <button
                                    className="w-10 h-10 rounded-full border border-gray-300 shadow-sm flex items-center justify-center transition-transform hover:scale-105"
                                    style={{ backgroundColor: newColor }}
                                    title="色を選択"
                                    onClick={() => setActiveColorPicker(activeColorPicker === 'new' ? null : 'new')}
                                >
                                    <svg className="w-4 h-4 text-white opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {activeColorPicker === 'new' && (
                                    <div className="absolute top-full left-0 mt-2 bg-white p-3 rounded-lg shadow-xl grid grid-cols-5 gap-2 z-20 w-[160px] border border-gray-100">
                                        {PRESET_COLORS.map(c => (
                                            <button
                                                key={c}
                                                className="w-6 h-6 rounded-full hover:scale-125 transition-transform border border-gray-100 shadow-sm"
                                                style={{ backgroundColor: c }}
                                                onClick={() => {
                                                    setNewColor(c);
                                                    setActiveColorPicker(null);
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 space-y-2 min-w-[200px]">
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                                placeholder="例: 🎨 アート"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="showOnMap"
                                    checked={showOnMap}
                                    onChange={(e) => setShowOnMap(e.target.checked)}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-300 border-gray-300 rounded"
                                />
                                <label htmlFor="showOnMap" className="text-sm text-gray-700 cursor-pointer select-none">
                                    マップに表示する
                                </label>
                            </div>
                        </div>
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2 bg-primary-400 text-white rounded-md hover:bg-primary-500 whitespace-nowrap"
                        >
                            追加
                        </button>
                    </div>
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
