"use client";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const PostingMap = dynamic(() => import("@/components/PostingMap"), {
    ssr: false,
    loading: () => <div className="h-screen w-full flex items-center justify-center bg-gray-100"><Loader2 className="animate-spin text-primary-400 w-8 h-8" /></div>
});

export default function PostingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not logged in
                // alert("ログインが必要です"); // Can be annoying on redirect
                router.push("/");
            } else {
                // Check allow-list if implemented. For now, just allow logged in users as per plan step 16 (but plan caveat says allow-list recommended).
                // User requirement: "Google認証でログインしたユーザーだけがアクセスできるようにする"
                // My plan: "I will include a basic prepared implementation for this using Environment Variables or a Config file."

                // Let's implement a simple allow-list check if ENV is present, otherwise allow all.
                // Since this runs on client, ENV must be NEXT_PUBLIC_...
                // Or better, just allow all Google Auth users for now as explicitly requested in prompt "Google認証でログインしたユーザーだけ".
                // The prompt says "Google認証でログインしたユーザーだけがアクセスできるようにする".
                setIsAllowed(true);
            }
        }
    }, [user, loading, router]);

    if (loading || !isAllowed) {
        return <div className="h-screen w-full flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-gray-400 w-8 h-8" /></div>;
    }

    return (
        <div className="h-screen w-full relative">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 px-4 py-2 rounded-full shadow-md backdrop-blur-sm border border-gray-200">
                <h1 className="font-bold text-gray-800 text-sm md:text-base">ポスティング管理マップ (共有)</h1>
            </div>
            <PostingMap />
        </div>
    );
}
