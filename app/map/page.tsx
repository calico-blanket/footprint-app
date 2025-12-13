"use client";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getDocs } from "firebase/firestore";
import { getUserRecordsCollection } from "@/lib/firestore";
import { Record } from "@/lib/types";
import dynamic from "next/dynamic";
import FilterBar, { FilterState } from "@/components/FilterBar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useSearchParams } from "next/navigation";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

import { Suspense } from "react";

function MapContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [allRecords, setAllRecords] = useState<Record[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<Record[]>([]);
    const [loading, setLoading] = useState(true);
    const [centerLocation, setCenterLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Calculate all unique tags for autocomplete
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        allRecords.forEach(record => {
            if (record.tags && Array.isArray(record.tags)) {
                record.tags.forEach(tag => tags.add(tag));
            }
        });
        // Sort tags using Japanese collation (あいうえお順)
        const collator = new Intl.Collator('ja', { sensitivity: 'base' });
        return Array.from(tags).sort(collator.compare);
    }, [allRecords]);

    // Read lat/lng from URL parameters
    useEffect(() => {
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        if (lat && lng) {
            setCenterLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
        }
    }, [searchParams]);

    useEffect(() => {
        if (user) {
            const fetchRecords = async () => {
                try {
                    const snapshot = await getDocs(getUserRecordsCollection(user.uid));
                    const data = snapshot.docs.map(d => d.data());
                    setAllRecords(data);
                    setFilteredRecords(data);
                } catch (error) {
                    console.error("Error fetching records", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchRecords();
        } else if (user === null) {
            // Not logged in, handled by layout/middleware or just show empty/loading until redirect
            setLoading(false);
        }
    }, [user]);

    const handleFilterChange = (filters: FilterState) => {
        let result = [...allRecords];
        if (filters.category !== "All") {
            result = result.filter(r => r.category === filters.category);
        }
        if (filters.keyword) {
            const lower = filters.keyword.toLowerCase();
            result = result.filter(r => r.memo.toLowerCase().includes(lower));
        }
        if (filters.tag) {
            const lowerTag = filters.tag.toLowerCase();
            result = result.filter(r => r.tags?.some(t => t.toLowerCase().includes(lowerTag)));
        }
        if (filters.startDate) {
            result = result.filter(r => new Date(r.date.toDate()) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            result = result.filter(r => new Date(r.date.toDate()) <= end);
        }
        setFilteredRecords(result);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="h-[calc(100vh-4rem)] md:h-screen w-full relative">
            <div className="absolute top-4 left-4 right-4 z-[1000] md:w-96 md:left-16">
                <FilterBar onFilterChange={handleFilterChange} availableTags={allTags} />
            </div>
            <MapView records={filteredRecords} centerLocation={centerLocation} />
        </div>
    );
}

export default function MapPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <MapContent />
        </Suspense>
    );
}
