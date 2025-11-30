"use client";
"use client";
import { useEffect, useState } from "react";
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
                <FilterBar onFilterChange={handleFilterChange} />
                <TimelineView records={filteredRecords} />
            </div>
        </div>
    );
}
