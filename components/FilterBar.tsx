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

    // Removed useEffect to prevent infinite loop
    // useEffect(() => {
    //     onFilterChange(filters);
    // }, [filters, onFilterChange]);

    const handleChange = (key: keyof FilterState, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    return (
        <div className="bg-white p-4 shadow-sm rounded-lg mb-4 flex flex-wrap gap-4 items-end">
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                    value={filters.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                    {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>
            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Tag</label>
                <input
                    type="text"
                    placeholder="Search tags..."
                    value={filters.tag}
                    onChange={(e) => handleChange("tag", e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
            </div>
            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Keyword</label>
                <input
                    type="text"
                    placeholder="Search memo..."
                    value={filters.keyword}
                    onChange={(e) => handleChange("keyword", e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
            </div>
        </div>
    );
}
