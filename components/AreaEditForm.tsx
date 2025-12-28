"use client";
import { useState } from "react";
import { PostingArea, PostingStatus } from "@/lib/types";

interface AreaEditFormProps {
    area: PostingArea;
    onSave: (id: string, updates: Partial<PostingArea>) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
}

export default function AreaEditForm({ area, onSave, onDelete }: AreaEditFormProps) {
    const [status, setStatus] = useState<PostingStatus>(area.status);
    const [memo, setMemo] = useState(area.memo);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(area.id, {
                status,
                memo,
                updatedAt: undefined // Will be set by server/service
            });
            // Ideally close popup here or show success
        } catch (error) {
            console.error("Failed to save", error);
            alert("保存に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("このエリアを削除しますか？")) return;
        setIsSaving(true);
        try {
            if (onDelete) await onDelete(area.id);
        } catch (error) {
            console.error("Failed to delete", error);
            alert("削除に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="min-w-[200px] p-1">
            <div className="mb-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">ステータス</label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setStatus("planned")}
                        className={`flex-1 py-1 px-2 text-xs rounded border ${status === "planned"
                            ? "bg-primary-500 text-white border-primary-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                    >
                        予定
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatus("completed")}
                        className={`flex-1 py-1 px-2 text-xs rounded border ${status === "completed"
                            ? "bg-green-500 text-white border-green-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                    >
                        完了
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatus("cancelled")}
                        className={`flex-1 py-1 px-2 text-xs rounded border ${status === "cancelled"
                            ? "bg-gray-500 text-white border-gray-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                    >
                        中止
                    </button>
                </div>
            </div>

            <div className="mb-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">メモ</label>
                <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-primary-300 outline-none"
                    rows={3}
                    placeholder="注意事項など"
                />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                {onDelete && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="text-xs text-red-500 hover:text-red-700 underline"
                        disabled={isSaving}
                    >
                        削除
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-primary-400 text-white text-xs font-bold rounded hover:bg-primary-500 disabled:opacity-50"
                >
                    {isSaving ? "保存中..." : "保存"}
                </button>
            </div>

            <div className="mt-2 text-[10px] text-gray-400 text-right">
                ID: {area.id.slice(0, 6)}...
            </div>
        </form>
    );
}
