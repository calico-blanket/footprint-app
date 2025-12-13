"use client";
"use client";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getDocs } from "firebase/firestore";
import { getUserRecordsCollection } from "@/lib/firestore";
import { Record } from "@/lib/types";
import TimelineView from "@/components/TimelineView";
import FilterBar, { FilterState } from "@/components/FilterBar";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function TimelinePage() {
    const { user } = useAuth();
    const [allRecords, setAllRecords] = useState<Record[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<Record[]>([]);
    const [loading, setLoading] = useState(true);

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
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-2xl mx-auto">
                <FilterBar onFilterChange={handleFilterChange} availableTags={allTags} />
                <TimelineView records={filteredRecords} />
            </div>
        </div>
    );
}
