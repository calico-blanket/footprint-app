"use client";
import { useState } from "react";
import { Record } from "@/lib/types";
import Link from "next/link";
import ImageLightbox from "@/components/ImageLightbox";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./calendar-custom.css"; // We will create this file for custom styling

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface TimelineViewProps {
    records: Record[];
}

export default function TimelineView({ records }: TimelineViewProps) {
    const sorted = [...records].sort((a, b) => b.date.toMillis() - a.date.toMillis());
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Helper to check if two dates are the same day (ignoring time)
    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    // Filtered records for display
    const displayRecords = viewMode === 'list'
        ? sorted
        : sorted.filter(r => isSameDay(r.date.toDate(), selectedDate));

    // Get all dates that have records for calendar tile content
    const recordDates = new Set(sorted.map(r => new Date(r.date.toDate()).toDateString()));

    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month' && recordDates.has(date.toDateString())) {
            return (
                <div className="flex justify-center mt-1">
                    <div className="h-1.5 w-1.5 bg-primary-400 rounded-full"></div>
                </div>
            );
        }
        return null;
    };

    if (records.length === 0) {
        return <div className="p-8 text-center text-gray-500">No records found.</div>;
    }

    return (
        <>
            {lightboxOpen && (
                <ImageLightbox
                    images={lightboxImages}
                    currentIndex={lightboxIndex}
                    onClose={() => setLightboxOpen(false)}
                    onNext={() => setLightboxIndex((prev) => (prev + 1) % lightboxImages.length)}
                    onPrev={() => setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length)}
                />
            )}


            <div className="max-w-2xl mx-auto p-4">
                {/* View Toggles */}
                <div className="flex justify-center mb-6 bg-gray-100 p-1 rounded-lg w-fit mx-auto">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'list'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        📋 リスト
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'calendar'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        📅 カレンダー
                    </button>
                </div>

                {/* Calendar View */}
                {viewMode === 'calendar' && (
                    <div className="mb-8 flex flex-col items-center">
                        <div className="bg-white p-4 rounded-lg shadow-sm border w-full max-w-sm">
                            <Calendar
                                onChange={(val) => setSelectedDate(val as Date)}
                                value={selectedDate}
                                tileContent={tileContent}
                                className="w-full border-none"
                            />
                        </div>
                        <div className="mt-4 text-sm text-gray-500">
                            {selectedDate.toLocaleDateString()} の記録: {displayRecords.length}件
                        </div>
                    </div>
                )}

                {/* Record List */}
                {displayRecords.length === 0 && (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                        {viewMode === 'calendar'
                            ? "この日の記録はありません"
                            : "記録がまだありません"}
                    </div>
                )}

                {displayRecords.length > 0 && (
                    <div className="space-y-4">
                        {displayRecords.map((record) => (
                            <div key={record.id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="inline-block px-2 py-1 text-xs font-semibold bg-primary-100 text-primary-800 rounded">
                                            {record.category}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {new Date(record.date.toDate()).toLocaleString()}
                                        </span>
                                    </div>
                                    <Link
                                        href={`/records/${record.id}`}
                                        className="text-gray-400 hover:text-primary-600 p-1 rounded hover:bg-gray-100"
                                    >
                                        ✏️
                                    </Link>
                                </div>

                                {record.memo && (
                                    <p className="text-gray-800 whitespace-pre-wrap text-sm">{record.memo}</p>
                                )}

                                {record.tags && record.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {record.tags.map(tag => (
                                            <span key={tag} className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {record.imageUrls.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                                        {record.imageUrls.map((url, i) => (
                                            <img
                                                key={i}
                                                src={url}
                                                alt="Photo"
                                                className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                    setLightboxImages(record.imageUrls);
                                                    setLightboxIndex(i);
                                                    setLightboxOpen(true);
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                    <span>📍</span>
                                    <Link
                                        href={`/map?lat=${record.location.lat}&lng=${record.location.lng}`}
                                        className="hover:text-primary-600 hover:underline cursor-pointer transition-colors"
                                    >
                                        {record.location.lat.toFixed(5)}, {record.location.lng.toFixed(5)}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
