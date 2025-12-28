"use client";
import DataManagement from "@/components/DataManagement";
import CategoryManager from "@/components/CategoryManager";
import TagManager from "@/components/TagManager";
import InstallPrompt from "@/components/InstallPrompt";
import Link from "next/link";

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto p-4 space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="text-primary-600 hover:text-primary-800"
                    >
                        ← 戻る
                    </Link>
                    <h1 className="text-2xl font-bold">設定</h1>
                </div>
                <InstallPrompt />
                <CategoryManager />
                <TagManager />
                <DataManagement />
            </div>
        </div>
    );
}
