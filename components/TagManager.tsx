"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
    collection,
    query,
    where,
    getDocs,
    writeBatch,
    doc,
    arrayRemove
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUserRecordsCollection } from "@/lib/firestore";
import { toast } from "sonner";

export default function TagManager() {
    const { user } = useAuth();
    const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (user) {
            loadTags();
        }
    }, [user]);

    const loadTags = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const snapshot = await getDocs(getUserRecordsCollection(user.uid));
            const tagCounts = new Map<string, number>();

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.tags && Array.isArray(data.tags)) {
                    data.tags.forEach((tag: string) => {
                        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                    });
                }
            });

            // Sort by Japanese layout then count? Or just Japanese layout.
            // Let's sort alphabetically (Japanese compatible)
            const collator = new Intl.Collator('ja', { sensitivity: 'base' });
            const sortedTags = Array.from(tagCounts.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => collator.compare(a.name, b.name));

            setTags(sortedTags);
        } catch (error) {
            console.error("Error loading tags:", error);
            toast.error("タグの読み込みに失敗しました");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (tagName: string, count: number) => {
        if (!user) return;

        if (!confirm(`タグ「${tagName}」を削除しますか？\n\nこのタグが付けられている ${count} 件のレコードからタグが削除されます。\nこの操作は取り消せません。`)) {
            return;
        }

        try {
            setProcessing(true);
            const recordsRef = getUserRecordsCollection(user.uid);
            const q = query(recordsRef, where("tags", "array-contains", tagName));
            const snapshot = await getDocs(q);

            // Batch processing (limit 500 per batch)
            const batchSize = 500;
            const chunks = [];
            for (let i = 0; i < snapshot.docs.length; i += batchSize) {
                chunks.push(snapshot.docs.slice(i, i + batchSize));
            }

            for (const chunk of chunks) {
                const batch = writeBatch(db);
                chunk.forEach(docSnap => {
                    const docRef = doc(recordsRef, docSnap.id);
                    batch.update(docRef, {
                        tags: arrayRemove(tagName)
                    });
                });
                await batch.commit();
            }

            toast.success(`タグ「${tagName}」を削除しました`);
            loadTags(); // Reload list
        } catch (error) {
            console.error("Error deleting tag:", error);
            toast.error("タグの削除に失敗しました");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="p-4 text-center text-gray-500">タグ読み込み中...</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">タグ管理</h2>
            <p className="text-sm text-gray-500 mb-4">
                登録されているタグの一覧です。削除すると、そのタグを使用しているすべての記録からタグが削除されます。
            </p>

            {tags.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    登録されているタグはありません
                </div>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {tags.map((tag) => (
                        <div
                            key={tag.name}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">{tag.name}</span>
                                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                                    {tag.count}件
                                </span>
                            </div>
                            <button
                                onClick={() => handleDelete(tag.name, tag.count)}
                                disabled={processing}
                                className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                                {processing ? "処理中..." : "削除"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
