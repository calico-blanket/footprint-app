"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsStandalone(true);
        }

        // Check for iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));

        // Capture install prompt for Android/Desktop
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setDeferredPrompt(null);
        }
    };

    if (isStandalone) return null;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-bold mb-4">アプリをインストール</h2>

            {deferredPrompt ? (
                <div className="space-y-4">
                    <p className="text-gray-600">
                        このアプリをホーム画面に追加して、より快適に利用しましょう。
                    </p>
                    <button
                        onClick={handleInstallClick}
                        className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 9.75V1.5m0 0 9 7.5M12 1.5 3 9" />
                        </svg>
                        ホーム画面に追加
                    </button>
                </div>
            ) : isIOS ? (
                <div className="space-y-4">
                    <p className="text-gray-600">
                        iPhoneをお使いの方は、以下の手順でインストールできます：
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 bg-gray-50 p-4 rounded">
                        <li>画面下の<span className="font-bold text-primary-600">共有ボタン</span>（四角から矢印）をタップ</li>
                        <li>メニューをスクロールして<span className="font-bold">「ホーム画面に追加」</span>を選択</li>
                        <li>右上の「追加」をタップ</li>
                    </ol>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-gray-600">
                        ブラウザのメニューから「ホーム画面に追加」または「アプリをインストール」を選択してください。
                    </p>
                    <p className="text-xs text-gray-500">
                        ※ LINEやQRコードリーダー内のブラウザではインストールできない場合があります。ChromeまたはSafariで開き直してください。
                    </p>
                </div>
            )}
        </div>
    );
}
