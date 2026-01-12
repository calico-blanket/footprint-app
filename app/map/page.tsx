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

    const [categoryColors, setCategoryColors] = useState<{ [category: string]: string }>({});

    // Calculate all unique tags for autocomplete
    const allTags = useMemo(() => {
        // ... (existing tag logic)
        const tags = new Set<string>();
        allRecords.forEach(record => {
            if (record.tags && Array.isArray(record.tags)) {
                record.tags.forEach(tag => tags.add(tag));
            }
        });
        const collator = new Intl.Collator('ja', { sensitivity: 'base' });
        return Array.from(tags).sort(collator.compare);
    }, [allRecords]);

    // ... (existing useEffect for URL params)

    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                try {
                    // Fetch categories to check visibility settings
                    const categoryDocRef = doc(db, "users", user.uid, "settings", "categories");
                    const categoryDocSnap = await getDoc(categoryDocRef);
                    let hiddenCategories = new Set<string>();
                    const colors: { [category: string]: string } = {};

                    if (categoryDocSnap.exists()) {
                        const data = categoryDocSnap.data().list;
                        if (Array.isArray(data) && data.length > 0 && typeof data[0] !== 'string') {
                            (data as CategoryItem[]).forEach(c => {
                                if (!c.showOnMap) {
                                    hiddenCategories.add(c.name);
                                }
                                if (c.color) {
                                    colors[c.name] = c.color;
                                }
                            });
                        }
                    }
                    setCategoryColors(colors);

                    // Fetch records
                    // ... (existing record fetch logic)
                    const snapshot = await getDocs(getUserRecordsCollection(user.uid));
                    const data = snapshot.docs.map(d => d.data() as Record);

                    // Filter out hidden categories globaly for the map
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

    // ... (existing handleFilterChange)

    // ... (existing handleLocationSelect)

    if (loading) return <LoadingSpinner />;

    return (
        <div className="h-[calc(100vh-4rem)] md:h-screen w-full relative">
            <div className="absolute top-4 left-4 right-4 z-[1000] md:w-96 md:left-16 flex flex-col gap-2">
                <FilterBar onFilterChange={handleFilterChange} availableTags={allTags} />
                <MapSearch records={allRecords} onSelectLocation={handleLocationSelect} />
            </div>
            <MapView
                records={filteredRecords}
                centerLocation={centerLocation}
                autoFit={shouldAutoFit}
                categoryColors={categoryColors}
            />
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
