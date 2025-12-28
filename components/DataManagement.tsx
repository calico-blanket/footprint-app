"use client";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getDocs, writeBatch, doc, Timestamp } from "firebase/firestore";
import { getUserRecordsCollection } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { parseRecordsCsv, formatRecordsToCsv } from "@/lib/csvUtils";

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

            const formattedCsv = formatRecordsToCsv(records);

            // Add BOM for Excel compatibility
            const blob = new Blob(["\uFEFF" + formattedCsv], { type: "text/csv;charset=utf-8;" });
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

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files?.[0]) return;
        setImporting(true);
        try {
            const file = e.target.files[0];
            const result = await parseRecordsCsv(file);

            if (result.failureCount > 0) {
                console.warn("CSV Import errors:", result.errors);
                // Show some errors in toast
                toast.warning(`Imported with warnings. Success: ${result.successCount}, Failed: ${result.failureCount}`);
            }

            if (result.successCount === 0) {
                const errorMsg = result.errors.length > 0 ? result.errors[0] : "No valid records found";
                toast.error(`Import failed: ${errorMsg}`);
                setImporting(false);
                e.target.value = "";
                return;
            }

            // Batch write to Firestore
            const chunks = [];
            for (let i = 0; i < result.records.length; i += 500) {
                chunks.push(result.records.slice(i, i + 500));
            }

            for (const chunk of chunks) {
                const batch = writeBatch(db);
                const collectionRef = getUserRecordsCollection(user.uid);

                for (const record of chunk) {
                    // If record has an ID, use it (Update/Overwrite). Otherwise determine new ID.
                    const docId = record.id || doc(collectionRef).id;
                    const docRef = doc(collectionRef, docId);

                    // Ensure all required fields for Record type are present
                    // parseRecordsCsv returns Partial<Record>, we need to be careful with types.
                    // However, we added default values in parseRecordsCsv for most fields.
                    // We assume data is safe to save.
                    const data = {
                        ...record,
                        id: docId,
                        // Defaults if missing (though csvUtils handles most)
                        imageUrls: record.imageUrls || [],
                    };

                    // Use set with merge: true to update if exists, or create if new
                    batch.set(docRef, data as any, { merge: true });
                }
                await batch.commit();
            }

            toast.success(`CSV Import complete: ${result.successCount} records added.`);
        } catch (e) {
            console.error(e);
            toast.error("CSV Import failed");
        } finally {
            setImporting(false);
            e.target.value = "";
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
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-700 font-medium mb-1">Restore from JSON (Backup)</p>
                            <p className="text-xs text-gray-500 mb-2">Restore records from a JSON file. Existing records with same ID will be updated.</p>
                            <label className="block">
                                <span className="sr-only">Choose JSON file</span>
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
                        </div>

                        <div className="border-t border-dashed pt-4">
                            <p className="text-sm text-gray-700 font-medium mb-1">Import from CSV (External Data)</p>
                            <p className="text-xs text-gray-500 mb-2">Import records from a CSV file. New records will be created.</p>
                            <label className="block">
                                <span className="sr-only">Choose CSV file</span>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleImportCSV}
                                    disabled={importing}
                                    className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-green-50 file:text-green-700
                                    hover:file:bg-green-100"
                                />
                            </label>
                            <p className="text-xs text-gray-400 mt-1">Required columns: category, date (YYYY-MM-DD). Optional: memo, tags, lat, lng, address.</p>
                        </div>
                    </div>
                    {importing && <p className="text-sm text-primary-600 mt-2">Importing...</p>}
                </div>
            </div>
        </div>
    );
}
