"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getDocs } from "firebase/firestore";
import { getUserRecordsCollection } from "@/lib/firestore";
import { Record as FootprintRecord } from "@/lib/types";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function StatsPage() {
    const { user } = useAuth();
    const [records, setRecords] = useState<FootprintRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const fetchRecords = async () => {
                try {
                    const snapshot = await getDocs(getUserRecordsCollection(user.uid));
                    const data = snapshot.docs.map(d => d.data());
                    setRecords(data);
                } catch (error) {
                    console.error("Error fetching records", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchRecords();
        } else if (user === null) {
            setLoading(false);
        }
    }, [user]);

    if (loading) return <LoadingSpinner />;

    // Calculate statistics
    const totalRecords = records.length;
    const totalPhotos = records.reduce((sum, r) => sum + r.imageUrls.length, 0);

    // Category breakdown
    const categoryCount: Record<string, number> = {};
    records.forEach(r => {
        categoryCount[r.category] = (categoryCount[r.category] || 0) + 1;
    });
    const categoryEntries = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);

    // Monthly breakdown
    const monthlyCount: Record<string, number> = {};
    records.forEach(r => {
        const date = new Date(r.date.toDate());
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1;
    });
    const monthlyEntries = Object.entries(monthlyCount).sort((a, b) => a[0].localeCompare(b[0]));

    // Unique locations (approximate - within 0.01 degree)
    const locationSet = new Set<string>();
    records.forEach(r => {
        const key = `${r.location.lat.toFixed(2)},${r.location.lng.toFixed(2)}`;
        locationSet.add(key);
    });
    const uniqueLocations = locationSet.size;

    // Most visited locations
    const locationCount: Record<string, { count: number; lat: number; lng: number }> = {};
    records.forEach(r => {
        const key = `${r.location.lat.toFixed(2)},${r.location.lng.toFixed(2)}`;
        if (!locationCount[key]) {
            locationCount[key] = { count: 0, lat: r.location.lat, lng: r.location.lng };
        }
        locationCount[key].count++;
    });
    const topLocations = Object.entries(locationCount)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/" className="text-blue-600 hover:text-blue-800">
                        ← 戻る
                    </Link>
                    <h1 className="text-2xl font-bold">📊 統計</h1>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="text-gray-500 text-sm mb-1">総レコード数</div>
                        <div className="text-3xl font-bold text-blue-600">{totalRecords}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="text-gray-500 text-sm mb-1">総写真数</div>
                        <div className="text-3xl font-bold text-green-600">{totalPhotos}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="text-gray-500 text-sm mb-1">訪問した場所</div>
                        <div className="text-3xl font-bold text-purple-600">{uniqueLocations}</div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-lg font-bold mb-4">カテゴリー別内訳</h2>
                    <div className="space-y-3">
                        {categoryEntries.map(([category, count]) => {
                            const percentage = ((count / totalRecords) * 100).toFixed(1);
                            return (
                                <div key={category}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>{category}</span>
                                        <span className="text-gray-500">{count}件 ({percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Monthly Breakdown */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-lg font-bold mb-4">月別投稿数</h2>
                    <div className="space-y-3">
                        {monthlyEntries.map(([month, count]) => {
                            const maxCount = Math.max(...monthlyEntries.map(e => e[1]));
                            const percentage = ((count / maxCount) * 100).toFixed(1);
                            return (
                                <div key={month}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>{month}</span>
                                        <span className="text-gray-500">{count}件</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Locations */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-lg font-bold mb-4">よく訪れる場所 トップ5</h2>
                    <div className="space-y-3">
                        {topLocations.map(([key, data], index) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl font-bold text-gray-300">#{index + 1}</div>
                                    <div>
                                        <div className="text-sm font-medium">
                                            📍 {data.lat.toFixed(4)}, {data.lng.toFixed(4)}
                                        </div>
                                        <div className="text-xs text-gray-500">{data.count}回訪問</div>
                                    </div>
                                </div>
                                <a
                                    href={`https://www.google.com/maps?q=${data.lat},${data.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                    地図で見る →
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
