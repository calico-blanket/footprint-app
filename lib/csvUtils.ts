import Papa from "papaparse";
import { Record } from "./types";
import { Timestamp } from "firebase/firestore";

export interface CsvRecord {
    id?: string; // Optional for import (if present, used for update)
    category: string;
    date: string; // YYYY-MM-DD
    memo: string;
    tags: string; // comma separated
    imageUrls?: string; // pipe separated
    lat?: string;
    lng?: string;
    address?: string;
}

export interface ImportResult {
    successCount: number;
    failureCount: number;
    errors: string[];
    records: Partial<Record>[];
}

export const parseRecordsCsv = (file: File): Promise<ImportResult> => {
    return new Promise((resolve) => {
        Papa.parse<CsvRecord>(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.toLowerCase().trim(),
            complete: (results) => {
                const successRecords: Partial<Record>[] = [];
                const errors: string[] = [];

                results.data.forEach((row, index) => {
                    try {
                        // Basic Validation
                        if (!row.category || !row.date) {
                            throw new Error("Missing required fields: category or date");
                        }

                        const record: Partial<Record> = {
                            id: row.id, // Keep ID if present
                            category: row.category,
                            date: Timestamp.fromDate(new Date(row.date)), // Convert to Firestore Timestamp
                            // Note: Firestore Timestamp conversion happens when saving
                            memo: row.memo || "",
                            tags: row.tags ? row.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
                            imageUrls: row.imageUrls ? row.imageUrls.split("|").filter(Boolean) : [],
                            updatedAt: Timestamp.now(), // Import time as update time
                        };

                        // If it's a new record (no ID), set createdAt
                        if (!row.id) {
                            record.createdAt = Timestamp.now();
                        }

                        // Location handling
                        if (row.lat && row.lng) {
                            const lat = parseFloat(row.lat);
                            const lng = parseFloat(row.lng);
                            if (!isNaN(lat) && !isNaN(lng)) {
                                record.location = {
                                    lat,
                                    lng,
                                    address: row.address || "",
                                };
                            }
                        }

                        successRecords.push(record);
                    } catch (err: any) {
                        errors.push(`Row ${index + 2}: ${err.message}`);
                    }
                });

                resolve({
                    successCount: successRecords.length,
                    failureCount: errors.length + results.errors.length,
                    errors: [...errors, ...results.errors.map(e => `CSV Parse Error line ${e.row}: ${e.message}`)],
                    records: successRecords,
                });
            },
            error: (error) => {
                resolve({
                    successCount: 0,
                    failureCount: 1,
                    errors: [`File read error: ${error.message}`],
                    records: [],
                });
            },
        });
    });
};

export const formatRecordsToCsv = (records: Record[]): string => {
    const csvData = records.map(record => ({
        id: record.id,
        category: record.category,
        date: record.date && typeof record.date.toDate === 'function' ? record.date.toDate().toISOString().split('T')[0] : new Date(record.date as any).toISOString().split('T')[0],
        memo: record.memo,
        tags: record.tags ? record.tags.join(", ") : "",
        imageUrls: record.imageUrls.join("|"),
        lat: record.location?.lat || "",
        lng: record.location?.lng || "",
        address: record.location?.address || "",
    }));

    return Papa.unparse(csvData);
};
