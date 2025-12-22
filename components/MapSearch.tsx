"use client";

import { useState, useRef, useEffect } from "react";
import { Record } from "@/lib/types";

interface MapSearchProps {
    records: Record[];
    onSelectLocation: (lat: number, lng: number) => void;
}

export default function MapSearch({ records, onSelectLocation }: MapSearchProps) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Record[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle outside click to close suggestions
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (text: string) => {
        setQuery(text);
        if (text.trim().length === 0) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        const lowerQuery = text.toLowerCase();
        const matches = records.filter(record => {
            const memoMatch = record.memo.toLowerCase().includes(lowerQuery);
            const tagMatch = record.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
            // Also match date nicely formatted? Maybe later.
            return memoMatch || tagMatch;
        }).slice(0, 10); // Limit to 10 suggestions

        setSuggestions(matches);
        setIsOpen(true);
    };

    const handleSelect = (record: Record) => {
        setQuery(record.memo);
        setSuggestions([]);
        setIsOpen(false);
        onSelectLocation(record.location.lat, record.location.lng);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative">
                <input
                    type="text"
                    placeholder="マップ内の場所を検索..."
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => {
                        if (query.trim().length > 0) setIsOpen(true);
                    }}
                    className="w-full px-4 py-2 pl-10 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                {query && (
                    <button
                        onClick={() => {
                            setQuery("");
                            setSuggestions([]);
                            setIsOpen(false);
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((record) => (
                        <button
                            key={record.id}
                            onClick={() => handleSelect(record)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-none flex items-start gap-2"
                        >
                            <span className="text-xl flex-shrink-0">📍</span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{record.memo}</p>
                                <div className="flex gap-2 text-xs text-gray-500">
                                    <span>{new Date(record.date.toDate()).toLocaleDateString()}</span>
                                    {record.tags && record.tags.length > 0 && (
                                        <span className="text-blue-500">#{record.tags[0]}</span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {isOpen && suggestions.length === 0 && query.trim().length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                    見つかりませんでした
                </div>
            )}
        </div>
    );
}
