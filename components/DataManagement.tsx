"use client";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getDocs, writeBatch, doc, Timestamp } from "firebase/firestore";
import { getUserRecordsCollection } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export default function DataManagement() {
    const { user } = useAuth();
    const [importing, setImporting] = useState(false);

    const handleExport = async () => {
        if (!user) return;
        try {
            const snapshot = await getDocs(getUserRecordsCollection(user.uid));
            const records = snapshot.docs.map(d => {
                const data = d.data();
                // Convert Timestamp to ISO string for JSON
                return {
                    ...data,
                    date: data.date?.toDate().toISOString(),
                    createdAt: data.createdAt?.toDate().toISOString(),
                    updatedAt: data.updatedAt?.toDate().toISOString(),
                };
            });
            const json = JSON.stringify(records, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `footprint_backup_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Export started");
        } catch (e) {
            console.error(e);
            toast.error("Export failed");
        }
    };

    const handleExportCSV = async () => {
        if (!user) return;
        try {
            const snapshot = await getDocs(getUserRecordsCollection(user.uid));
            const records = snapshot.docs.map(d => d.data());

            // CSV Header
            const header = ["Category", "Date", "Memo", "Tags", "ImageURLs", "Latitude", "Longitude"];
            const rows = records.map(r => {
                const dateStr = r.date ? new Date(r.date.toDate()).toLocaleString() : "";
                const tagsStr = r.tags ? r.tags.join(", ") : "";
                const imagesStr = r.imageUrls ? r.imageUrls.join("; ") : "";

                // Escape quotes and wrap in quotes
                const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;

                return [
                    escape(r.category),
                    escape(dateStr),
                    escape(r.memo),
                    escape(tagsStr),
                    escape(imagesStr),
                    r.location.lat,
                    r.location.lng
                ].join(",");
            });

            const csvContent = [header.join(","), ...rows].join("\n");

            // Add BOM for Excel compatibility
            const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `footprint_export_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("CSV Export started");
        } catch (e) {
            console.error(e);
            toast.error("CSV Export failed");
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files?.[0]) return;
        setImporting(true);
        try {
            const file = e.target.files[0];
            const text = await file.text();
            const records = JSON.parse(text);

            if (!Array.isArray(records)) throw new Error("Invalid format");

            const chunks = [];
            for (let i = 0; i < records.length; i += 500) {
                chunks.push(records.slice(i, i + 500));
            }

            for (const chunk of chunks) {
                const batch = writeBatch(db);
                for (const record of chunk) {
                    // Convert ISO strings back to Timestamp
                    const data = {
                        ...record,
                        date: record.date ? Timestamp.fromDate(new Date(record.date)) : Timestamp.now(),
                        createdAt: record.createdAt ? Timestamp.fromDate(new Date(record.createdAt)) : Timestamp.now(),
                        updatedAt: record.updatedAt ? Timestamp.fromDate(new Date(record.updatedAt)) : Timestamp.now(),
                    };

                    const docRef = doc(getUserRecordsCollection(user.uid), record.id);
                    batch.set(docRef, data, { merge: true });
                }
                await batch.commit();
            }
            toast.success("Import complete");
        } catch (e) {
            console.error(e);
            toast.error("Import failed");
        } finally {
            setImporting(false);
            e.target.value = "";
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold mb-6">Data Management</h2>
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Export Data</h3>
                    <p className="text-sm text-gray-500 mb-3">Download all your records as a JSON file.</p>
                    <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        Export JSON
                    </button>
                    <button onClick={handleExportCSV} className="ml-2 bg-primary-400 hover:bg-primary-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        Export CSV
                    </button>
                </div>
                <div className="border-t pt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Import Data</h3>
                    <p className="text-sm text-gray-500 mb-3">Restore records from a JSON file. Existing records with same ID will be updated.</p>
                    <label className="block">
                        <span className="sr-only">Choose file</span>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            disabled={importing}
                            className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100"
                        />
                    </label>
                    {importing && <p className="text-sm text-primary-600 mt-2">Importing...</p>}
                </div>
            </div>
        </div>
    );
}
