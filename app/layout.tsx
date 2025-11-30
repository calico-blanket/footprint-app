import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/ToastProvider";
import Navbar from "@/components/Navbar";
import SyncManager from "@/components/SyncManager";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Footprint App",
    description: "Personal footprint mapping application",
    manifest: "/manifest.json",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    <SyncManager />
                    <ToastProvider />
                    <Navbar />
                    <main className="md:pl-64 pb-20 md:pb-0 min-h-screen bg-gray-50">
                        {children}
                    </main>
                </AuthProvider>
            </body>
        </html>
    );
}
