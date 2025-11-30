"use client";
import { useState } from "react";
import { Record } from "@/lib/types";
import Link from "next/link";
import ImageLightbox from "@/components/ImageLightbox";

interface TimelineViewProps {
    records: Record[];
}

export default function TimelineView({ records }: TimelineViewProps) {
    const sorted = [...records].sort((a, b) => b.date.toMillis() - a.date.toMillis());
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

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
            <div className="space-y-4 p-4 pb-24 md:pb-4 max-w-2xl mx-auto">
                {sorted.map((record) => (
                    <div key={record.id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                                    {record.category}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {new Date(record.date.toDate()).toLocaleString()}
                                </span>
                            </div>
                            <Link
                                href={`/records/${record.id}`}
                                className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-gray-100"
                            >
                                ✏️
                            </Link>
                        </div>

                        {record.memo && (
                            <p className="text-gray-800 whitespace-pre-wrap text-sm">{record.memo}</p>
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
                                className="hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                            >
                                {record.location.lat.toFixed(5)}, {record.location.lng.toFixed(5)}
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
