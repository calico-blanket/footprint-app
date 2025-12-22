"use client";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getDocs, doc, getDoc } from "firebase/firestore";
import { getUserRecordsCollection } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { Record, CategoryItem } from "@/lib/types";
import dynamic from "next/dynamic";
import FilterBar, { FilterState } from "@/components/FilterBar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useSearchParams } from "next/navigation";

import MapSearch from "@/components/MapSearch";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

import { Suspense } from "react";

function MapContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [allRecords, setAllRecords] = useState<Record[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<Record[]>([]);
    const [loading, setLoading] = useState(true);
    const [centerLocation, setCenterLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [shouldAutoFit, setShouldAutoFit] = useState(false);

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
        } else {
            // If no URL params, try to get current location
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setCenterLocation({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    (error) => {
                        console.log("Geolocation error or permission denied:", error);
                        // Fallback to default (Tokyo) happens in MapView if centerLocation is null
                    }
                );
            }
        }
    }, [searchParams]);

    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                try {
                    // Fetch categories to check visibility settings
                    const categoryDocRef = doc(db, "users", user.uid, "settings", "categories");
                    const categoryDocSnap = await getDoc(categoryDocRef);
                    let hiddenCategories = new Set<string>();

                    if (categoryDocSnap.exists()) {
                        const data = categoryDocSnap.data().list;
                        if (Array.isArray(data) && data.length > 0 && typeof data[0] !== 'string') {
                            (data as CategoryItem[]).forEach(c => {
                                if (!c.showOnMap) {
                                    hiddenCategories.add(c.name);
                                }
                            });
                        }
                    }

                    // Fetch records
                    const snapshot = await getDocs(getUserRecordsCollection(user.uid));
                    const data = snapshot.docs.map(d => d.data() as Record);

                    // Filter out hidden categories globally for the map
                    // Note: If we want them to show in the list but not on map, we should filter only for MapView
                    // But here we filteredRecords is passed to MapView.
                    // If we want FilterBar to still show them in dropdown... FilterBar loads categories separately.
                    // This is fine. We just filter the records here.
                    const visibleData = data.filter(r => !hiddenCategories.has(r.category));

                    setAllRecords(visibleData);
                    setFilteredRecords(visibleData);
                } catch (error) {
                    console.error("Error fetching data", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        } else if (user === null) {
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
        setShouldAutoFit(true); // Auto-fit bounds when filter changes
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        setCenterLocation({ lat, lng });
        setShouldAutoFit(false); // Don't auto-fit when jumping to specific location
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="h-[calc(100vh-4rem)] md:h-screen w-full relative">
            <div className="absolute top-4 left-4 right-4 z-[1000] md:w-96 md:left-16 flex flex-col gap-2">
                <FilterBar onFilterChange={handleFilterChange} availableTags={allTags} />
                <MapSearch records={allRecords} onSelectLocation={handleLocationSelect} />
            </div>
            <MapView records={filteredRecords} centerLocation={centerLocation} autoFit={shouldAutoFit} />
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
