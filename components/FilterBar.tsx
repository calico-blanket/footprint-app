"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_CATEGORIES } from "@/components/CategoryManager";
import { CategoryItem } from "@/lib/types";

export interface FilterState {
    startDate: string;
    endDate: string;
    category: string;
    keyword: string;
    tag: string;
}

interface FilterBarProps {
    onFilterChange: (filters: FilterState) => void;
    availableTags?: string[];
}



export default function FilterBar({ onFilterChange, availableTags = [] }: FilterBarProps) {
    const { user } = useAuth();
    const [filters, setFilters] = useState<FilterState>({
        startDate: "",
        endDate: "",
        category: "All",
        keyword: "",
        tag: "",
    });
    const [isExpanded, setIsExpanded] = useState(false);
    const [categories, setCategories] = useState<string[]>(["All", ...DEFAULT_CATEGORIES]);

    // Autocomplete states
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

    // Load custom categories from Firestore
    useEffect(() => {
        if (user) {
            const loadCategories = async () => {
                try {
                    const docRef = doc(db, "users", user.uid, "settings", "categories");
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data().items || docSnap.data().list;
                        let customCategoryNames: string[] = [];

                        if (Array.isArray(data) && data.length > 0) {
                            if (typeof data[0] === 'string') {
                                customCategoryNames = data as string[];
                            } else {
                                customCategoryNames = (data as CategoryItem[]).map(c => c.name);
                            }
                        } else {
                            customCategoryNames = DEFAULT_CATEGORIES;
                        }

                        setCategories(["All", ...customCategoryNames]);
                    }
                } catch (error) {
                    console.error("Error loading categories:", error);
                }
            };
            loadCategories();
        }
    }, [user]);

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
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
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
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-400 focus:ring-primary-300 text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">終了日</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleChange("endDate", e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-400 focus:ring-primary-300 text-sm p-2 border"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">カテゴリ</label>
                        <select
                            value={filters.category}
                            onChange={(e) => handleChange("category", e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-400 focus:ring-primary-300 text-sm p-2 border"
                        >
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">タグ</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="タグで検索..."
                                value={filters.tag}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    handleChange("tag", value);

                                    // Update suggestions
                                    if (value.trim() && availableTags.length > 0) {
                                        const filtered = availableTags.filter(
                                            tag => tag.toLowerCase().includes(value.toLowerCase())
                                        );
                                        setTagSuggestions(filtered);
                                        setSelectedSuggestionIndex(-1);
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
                                        if (selectedSuggestionIndex >= 0 && tagSuggestions[selectedSuggestionIndex]) {
                                            e.preventDefault();
                                            const selected = tagSuggestions[selectedSuggestionIndex];
                                            handleChange("tag", selected);
                                            setTagSuggestions([]);
                                            setSelectedSuggestionIndex(-1);
                                        }
                                    } else if (e.key === "Escape") {
                                        setTagSuggestions([]);
                                    }
                                }}
                                onBlur={() => {
                                    setTimeout(() => {
                                        setTagSuggestions([]);
                                        setSelectedSuggestionIndex(-1);
                                    }, 200);
                                }}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-400 focus:ring-primary-300 text-sm p-2 pr-10 border"
                            />
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    if (tagSuggestions.length > 0) {
                                        setTagSuggestions([]);
                                    } else {
                                        setTagSuggestions(availableTags || []);
                                    }
                                    // Focus input if not focused? Not strictly necessary if preventDefault worked
                                }}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
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
                                                e.preventDefault(); // Prevent blur from firing
                                                handleChange("tag", suggestion);
                                                setTagSuggestions([]);
                                                setSelectedSuggestionIndex(-1);
                                            }}
                                            className={`px-3 py-2 cursor-pointer text-sm ${index === selectedSuggestionIndex
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
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">キーワード</label>
                        <input
                            type="text"
                            placeholder="メモ内を検索..."
                            value={filters.keyword}
                            onChange={(e) => handleChange("keyword", e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-400 focus:ring-primary-300 text-sm p-2 border"
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
