"use client";

import { useState, useMemo } from "react";
import { Record } from "@/lib/types";

interface CopyFromRecordProps {
    allRecords: Record[];
    allTags: string[];
    onCopy: (record: Record) => void;
}

function formatDate(record: Record): string {
    try {
        const d = record.date.toDate();
        return d.toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return "";
    }
}

export default function CopyFromRecord({ allRecords, allTags, onCopy }: CopyFromRecordProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tagSearch, setTagSearch] = useState("");
    const [confirmed, setConfirmed] = useState<Record | null>(null);
    const [showAllTags, setShowAllTags] = useState(false);
    const TAG_INITIAL_LIMIT = 20;

    // タグ絞り込み後の記録一覧
    const filteredRecords = useMemo(() => {
        if (selectedTags.length === 0) return [];
        return allRecords.filter((r) =>
            selectedTags.every((tag) => r.tags?.includes(tag))
        );
    }, [allRecords, selectedTags]);

    // タグ検索用のサジェスト
    const tagSuggestions = useMemo(() => {
        const lower = tagSearch.toLowerCase();
        return allTags.filter(
            (t) => t.toLowerCase().includes(lower) && !selectedTags.includes(t)
        );
    }, [allTags, tagSearch, selectedTags]);

    const handleTagSelect = (tag: string) => {
        setSelectedTags((prev) => [...prev, tag]);
        setTagSearch("");
    };

    const handleTagRemove = (tag: string) => {
        setSelectedTags((prev) => prev.filter((t) => t !== tag));
    };

    const handleCopy = (record: Record) => {
        setConfirmed(record);
    };

    const handleConfirm = () => {
        if (confirmed) {
            onCopy(confirmed);
            setIsOpen(false);
            setSelectedTags([]);
            setTagSearch("");
            setConfirmed(null);
        }
    };

    const handleCancel = () => {
        setConfirmed(null);
    };

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="w-full py-2 px-4 border border-dashed border-primary-300 rounded-md text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                過去の記録からコピー
            </button>
        );
    }

    return (
        <div className="border border-primary-200 rounded-lg bg-primary-50 p-4 space-y-3">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-primary-800 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    過去の記録からコピー
                </h3>
                <button
                    type="button"
                    onClick={() => {
                        setIsOpen(false);
                        setSelectedTags([]);
                        setTagSearch("");
                        setConfirmed(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                    aria-label="閉じる"
                >
                    ×
                </button>
            </div>

            {/* タグ選択 */}
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                    タグで検索
                </label>

                {/* 選択済みタグ */}
                {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {selectedTags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-200 text-primary-900"
                            >
                                #{tag}
                                <button
                                    type="button"
                                    onClick={() => handleTagRemove(tag)}
                                    className="hover:text-red-600 transition-colors"
                                    aria-label={`${tag}を外す`}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* タグ入力 */}
                <div className="relative">
                    <input
                        type="text"
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        placeholder="タグ名を入力して選択..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-400 focus:ring-primary-300 text-sm p-2 border bg-white"
                    />
                    {tagSearch && tagSuggestions.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {tagSuggestions.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleTagSelect(tag);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 transition-colors"
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    )}
                    {/* タグ一覧から選ぶ（未入力時） */}
                    {!tagSearch && allTags.filter(t => !selectedTags.includes(t)).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {allTags
                                .filter((t) => !selectedTags.includes(t))
                                .slice(0, showAllTags ? undefined : TAG_INITIAL_LIMIT)
                                .map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleTagSelect(tag)}
                                        className="px-2 py-0.5 rounded-full text-xs border border-gray-300 bg-white text-gray-600 hover:bg-primary-100 hover:border-primary-300 hover:text-primary-800 transition-colors"
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            {allTags.filter(t => !selectedTags.includes(t)).length > TAG_INITIAL_LIMIT && (
                                <button
                                    type="button"
                                    onClick={() => setShowAllTags(prev => !prev)}
                                    className="text-xs text-primary-600 hover:text-primary-800 underline self-center transition-colors"
                                >
                                    {showAllTags
                                        ? "▲ 折りたたむ"
                                        : `...他${allTags.filter(t => !selectedTags.includes(t)).length - TAG_INITIAL_LIMIT}件を表示`}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 検索結果 */}
            {selectedTags.length > 0 && (
                <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">
                        {filteredRecords.length > 0
                            ? `${filteredRecords.length}件の記録が見つかりました`
                            : "一致する記録がありません"}
                    </p>
                    {filteredRecords.length > 0 && (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {filteredRecords.map((record) => (
                                <div
                                    key={record.id}
                                    className="bg-white rounded-md p-3 border border-gray-200 hover:border-primary-300 transition-colors"
                                >
                                    {/* 写真サムネイル */}
                                    {record.imageUrls && record.imageUrls.length > 0 && (
                                        <div className="flex gap-1.5 mb-2 overflow-x-auto">
                                            {record.imageUrls.slice(0, 5).map((url, idx) => (
                                                <img
                                                    key={idx}
                                                    src={url}
                                                    alt={`写真${idx + 1}`}
                                                    className="h-16 w-16 object-cover rounded shrink-0"
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-gray-500">{formatDate(record)}</span>
                                                <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                                                    {record.category}
                                                </span>
                                            </div>
                                            {record.memo && (
                                                <p className="text-sm text-gray-700 line-clamp-2 mb-1">
                                                    {record.memo}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-1">
                                                {record.tags?.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                                                            selectedTags.includes(tag)
                                                                ? "bg-primary-200 text-primary-800 font-medium"
                                                                : "bg-gray-100 text-gray-500"
                                                        }`}
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(record)}
                                            className="shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-primary-400 hover:bg-primary-500 rounded-md transition-colors"
                                        >
                                            使う
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* コピー確認ダイアログ */}
            {confirmed && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl p-6 m-4 max-w-sm w-full">
                        <h4 className="text-base font-semibold text-gray-800 mb-2">この記録を使いますか？</h4>
                        <p className="text-sm text-gray-500 mb-1">以下の情報がフォームにコピーされます：</p>
                        <ul className="text-sm text-gray-700 mb-4 space-y-1">
                            <li>📂 カテゴリ：<strong>{confirmed.category}</strong></li>
                            <li>🏷️ タグ：<strong>{confirmed.tags?.join("、") || "なし"}</strong></li>
                            <li>📍 位置情報：<strong>コピーされます</strong></li>
                        </ul>
                        <p className="text-xs text-gray-400 mb-4">※日時・写真・メモはコピーされません</p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="flex-1 py-2 px-4 bg-primary-400 hover:bg-primary-500 rounded-md text-sm font-medium text-white transition-colors"
                            >
                                コピーして使う
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
