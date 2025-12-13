"use client";
import { useState, useEffect } from "react";

export interface FilterState {
    startDate: string;
    endDate: string;
    category: string;
    keyword: string;
    tag: string;
}

interface FilterBarProps {
    onFilterChange: (filters: FilterState) => void;
}

const CATEGORIES = [
    "All",
    "🍽️ 食事",
    "🏞️ 風景",
    "🚶 散歩",
    "🚗 移動",
    "🛒 買い物",
    "🎉 イベント",
    "📝 メモ",
    "🔖 その他",
];

export default function FilterBar({ onFilterChange }: FilterBarProps) {
    const [filters, setFilters] = useState<FilterState>({
        startDate: "",
        endDate: "",
        category: "All",
        keyword: "",
        tag: "",
    });
    const [isExpanded, setIsExpanded] = useState(false);

    // Removed useEffect to prevent infinite loop
    // useEffect(() => {
    //     onFilterChange(filters);
    // }, [filters, onFilterChange]);

    const handleChange = (key: keyof FilterState, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const hasActiveFilters =
        filters.startDate ||
        filters.endDate ||
        filters.category !== "All" ||
        filters.keyword ||
        filters.tag;

    return (
        <div className="bg-white shadow-sm rounded-lg mb-4">
            {/* Filter Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-lg"
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">🔍</span>
                    <span className="font-medium text-gray-700">フィルター</span>
                    {hasActiveFilters && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            適用中
                        </span>
                    )}
                </div>
                <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Filter Content */}
            {isExpanded && (
                <div className="p-4 border-t border-gray-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">開始日</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleChange("startDate", e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">終了日</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleChange("endDate", e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">カテゴリ</label>
                        <select
                            value={filters.category}
                            onChange={(e) => handleChange("category", e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">タグ</label>
                        <input
                            type="text"
                            placeholder="タグで検索..."
                            value={filters.tag}
                            onChange={(e) => handleChange("tag", e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">キーワード</label>
                        <input
                            type="text"
                            placeholder="メモ内を検索..."
                            value={filters.keyword}
                            onChange={(e) => handleChange("keyword", e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                        />
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={() => {
                                const resetFilters = {
                                    startDate: "",
                                    endDate: "",
                                    category: "All",
                                    keyword: "",
                                    tag: "",
                                };
                                setFilters(resetFilters);
                                onFilterChange(resetFilters);
                            }}
                            className="w-full mt-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            フィルターをクリア
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
