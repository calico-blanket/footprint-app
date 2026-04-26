"use client";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { getUserRecordsCollection } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { Record, CategoryItem } from "@/lib/types";
import dynamic from "next/dynamic";
import FilterBar, { FilterState } from "@/components/FilterBar";
import LoadingSpinner from "@/components/LoadingSpinner";
import MapSearch from "@/components/MapSearch";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

import { Suspense } from "react";

function MapContent() {
    const { user } = useAuth();

    const [allRecords, setAllRecords] = useState<Record[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<Record[]>([]);
    const [loading, setLoading] = useState(true);
    const [centerLocation, setCenterLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [shouldAutoFit, setShouldAutoFit] = useState(false);

    const [categoryColors, setCategoryColors] = useState<{ [category: string]: string }>({});

    // ── ピン移動モード ──────────────────────────────────────────
    const [editMode, setEditMode] = useState(false);

    // 座標入力パネルの状態
    const [coordPanelOpen, setCoordPanelOpen] = useState(false);
    const [selectedRecordId, setSelectedRecordId] = useState("");
    const [inputLat, setInputLat] = useState("");
    const [inputLng, setInputLng] = useState("");
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

    // Calculate all unique tags for autocomplete
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        allRecords.forEach(record => {
            if (record.tags && Array.isArray(record.tags)) {
                record.tags.forEach(tag => tags.add(tag));
            }
        });
        const collator = new Intl.Collator('ja', { sensitivity: 'base' });
        return Array.from(tags).sort(collator.compare);
    }, [allRecords]);

    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                try {
                    const categoryDocRef = doc(db, "users", user.uid, "settings", "categories");
                    const categoryDocSnap = await getDoc(categoryDocRef);
                    let hiddenCategories = new Set<string>();
                    const colors: { [category: string]: string } = {};

                    if (categoryDocSnap.exists()) {
                        const data = categoryDocSnap.data().items || categoryDocSnap.data().list;
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

                    const snapshot = await getDocs(getUserRecordsCollection(user.uid));
                    const data = snapshot.docs.map(d => d.data() as Record);

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
        let result = allRecords;

        if (filters.startDate) {
            result = result.filter(r => r.date.toDate() >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            const endOfDay = new Date(filters.endDate);
            endOfDay.setHours(23, 59, 59, 999);
            result = result.filter(r => r.date.toDate() <= endOfDay);
        }
        if (filters.category && filters.category !== "All") {
            result = result.filter(r => r.category === filters.category);
        }
        if (filters.tag) {
            result = result.filter(r => r.tags && r.tags.includes(filters.tag));
        }
        if (filters.keyword) {
            const query = filters.keyword.toLowerCase();
            result = result.filter(r =>
                r.memo.toLowerCase().includes(query) ||
                (r.tags && r.tags.some(t => t.toLowerCase().includes(query))) ||
                r.category.toLowerCase().includes(query)
            );
        }

        setFilteredRecords(result);
        setShouldAutoFit(true);
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        setCenterLocation({ lat, lng });
        setShouldAutoFit(false);
    };

    // ── ピン移動処理（共通） ─────────────────────────────────────
    const applyPinMove = async (recordId: string, newLat: number, newLng: number) => {
        if (!user) return;

        // 楽観的更新（UIに即反映）
        const updateRecords = (prev: Record[]) =>
            prev.map(r =>
                r.id === recordId
                    ? { ...r, location: { ...r.location, lat: newLat, lng: newLng } }
                    : r
            );
        setAllRecords(updateRecords);
        setFilteredRecords(updateRecords);

        // Firestoreへ保存
        try {
            setSaveStatus("saving");
            const recordRef = doc(db, "users", user.uid, "records", recordId);
            await updateDoc(recordRef, {
                "location.lat": newLat,
                "location.lng": newLng,
            });
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (err) {
            console.error("Failed to update pin location:", err);
            setSaveStatus("error");
            setTimeout(() => setSaveStatus("idle"), 3000);
        }
    };

    // ① ドラッグ移動
    const handlePinMove = (recordId: string, newLat: number, newLng: number) => {
        applyPinMove(recordId, newLat, newLng);
    };

    // ② 座標入力で移動
    const handleCoordSubmit = async () => {
        const lat = parseFloat(inputLat);
        const lng = parseFloat(inputLng);
        if (!selectedRecordId) {
            alert("記録を選択してください");
            return;
        }
        if (isNaN(lat) || lat < -90 || lat > 90) {
            alert("緯度は -90〜90 の数値で入力してください");
            return;
        }
        if (isNaN(lng) || lng < -180 || lng > 180) {
            alert("経度は -180〜180 の数値で入力してください");
            return;
        }
        await applyPinMove(selectedRecordId, lat, lng);
        // 地図をその位置にフォーカス
        setCenterLocation({ lat, lng });
        setShouldAutoFit(false);
    };

    // editMode をオフにしたとき座標パネルも閉じる
    const toggleEditMode = () => {
        setEditMode(prev => {
            if (prev) {
                setCoordPanelOpen(false);
                setSaveStatus("idle");
            }
            return !prev;
        });
    };

    if (loading) return <LoadingSpinner />;

    // 「表示中の記録（位置情報あり）」を選択肢として使用
    const movableRecords = filteredRecords
        .filter(r => r.location)
        .sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());

    return (
        <div className="h-[calc(100vh-4rem)] md:h-screen w-full relative">
            {/* フィルター・検索バー */}
            <div className="absolute top-4 left-4 right-4 z-[1000] md:w-96 md:left-16 flex flex-col gap-2">
                <FilterBar onFilterChange={handleFilterChange} availableTags={allTags} />
                <MapSearch records={allRecords} onSelectLocation={handleLocationSelect} />
            </div>

            {/* ── ピン移動コントロール ── */}
            <div className="absolute bottom-24 right-4 md:bottom-8 z-[1000] flex flex-col gap-2 items-end">

                {/* 保存ステータス */}
                {saveStatus !== "idle" && (
                    <div className={`px-3 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
                        saveStatus === "saving" ? "bg-blue-500 text-white" :
                        saveStatus === "saved"  ? "bg-green-500 text-white" :
                                                  "bg-red-500 text-white"
                    }`}>
                        {saveStatus === "saving" && "💾 保存中..."}
                        {saveStatus === "saved"  && "✅ 保存しました"}
                        {saveStatus === "error"  && "❌ 保存に失敗しました"}
                    </div>
                )}

                {/* 座標入力パネル（editMode ON時のみ） */}
                {editMode && coordPanelOpen && (
                    <div className="bg-white rounded-2xl shadow-2xl p-4 w-72 border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold text-gray-800 text-sm">📍 座標を入力して移動</p>
                            <button
                                onClick={() => setCoordPanelOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                            >✕</button>
                        </div>

                        {/* 記録選択 */}
                        <div className="mb-3">
                            <label className="block text-xs text-gray-500 mb-1">移動する記録</label>
                            <select
                                value={selectedRecordId}
                                onChange={e => setSelectedRecordId(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="">-- 記録を選ぶ --</option>
                                {movableRecords.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.category}　{new Date(r.date.toDate()).toLocaleDateString("ja-JP")}
                                        {r.memo ? `　${r.memo.slice(0, 15)}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 緯度 */}
                        <div className="mb-2">
                            <label className="block text-xs text-gray-500 mb-1">
                                緯度 <span className="text-gray-400">（-90〜90）</span>
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={inputLat}
                                onChange={e => setInputLat(e.target.value)}
                                placeholder="例: 35.6895"
                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>

                        {/* 経度 */}
                        <div className="mb-3">
                            <label className="block text-xs text-gray-500 mb-1">
                                経度 <span className="text-gray-400">（-180〜180）</span>
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={inputLng}
                                onChange={e => setInputLng(e.target.value)}
                                placeholder="例: 139.6917"
                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>

                        <button
                            onClick={handleCoordSubmit}
                            disabled={saveStatus === "saving"}
                            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium rounded-lg py-2 text-sm transition-colors"
                        >
                            この座標に移動
                        </button>
                    </div>
                )}

                {/* 座標入力トグルボタン（editMode ON時のみ） */}
                {editMode && (
                    <button
                        onClick={() => setCoordPanelOpen(prev => !prev)}
                        className="bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl shadow-lg px-4 py-2.5 text-sm border border-gray-200 flex items-center gap-2 transition-all"
                    >
                        <span>🔢</span>
                        <span>座標で移動</span>
                    </button>
                )}

                {/* editMode 中のヒント */}
                {editMode && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2 text-xs text-center shadow">
                        📌 ピンをドラッグして移動できます
                    </div>
                )}

                {/* ピン移動モード ON/OFF ボタン */}
                <button
                    onClick={toggleEditMode}
                    className={`font-semibold rounded-2xl shadow-lg px-5 py-3 text-sm flex items-center gap-2 transition-all ${
                        editMode
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
                    }`}
                >
                    <span>{editMode ? "✋" : "✏️"}</span>
                    <span>{editMode ? "移動モードを終了" : "ピンを移動する"}</span>
                </button>
            </div>

            <MapView
                records={filteredRecords}
                centerLocation={centerLocation}
                autoFit={shouldAutoFit}
                categoryColors={categoryColors}
                editMode={editMode}
                onPinMove={handlePinMove}
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
