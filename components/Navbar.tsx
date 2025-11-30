"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "@/lib/auth";

export default function Navbar() {
    const pathname = usePathname();
    const { user } = useAuth();

    if (!user) return null;

    const navItems = [
        { name: "Map", href: "/map", icon: "🗺️" },
        { name: "Timeline", href: "/timeline", icon: "📅" },
        { name: "New", href: "/records/new", icon: "➕" },
        { name: "Stats", href: "/stats", icon: "📊" },
        { name: "Settings", href: "/settings", icon: "⚙️" },
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <nav className="hidden md:flex fixed top-0 left-0 h-full w-64 bg-white border-r flex-col p-4 z-50">
                <h1 className="text-xl font-bold mb-8 text-blue-600">Footprint</h1>
                <div className="flex-1 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center p-3 rounded-lg transition-colors ${pathname === item.href ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <span className="mr-3 text-xl">{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                </div>
                <button
                    onClick={() => signOut()}
                    className="flex items-center p-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors w-full"
                >
                    <span className="mr-3 text-xl">🚪</span>
                    <span className="font-medium">Sign Out</span>
                </button>
            </nav>

            {/* Mobile Bottom Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t flex justify-around p-2 pb-safe z-50">
                {navItems.map((item) => {
                    const isNew = item.name === "New";
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center p-2 rounded-lg ${pathname === item.href ? "text-blue-600" : "text-gray-500"} ${isNew ? "bg-blue-600 text-white -mt-6 rounded-full h-14 w-14 justify-center shadow-lg border-4 border-gray-50" : ""}`}
                        >
                            <span className={`${isNew ? "text-2xl" : "text-2xl mb-1"}`}>{item.icon}</span>
                            {!isNew && <span className="text-xs font-medium">{item.name}</span>}
                        </Link>
                    );
                })}
                <button
                    onClick={() => signOut()}
                    className="flex flex-col items-center p-2 text-gray-500"
                >
                    <span className="text-2xl mb-1">🚪</span>
                    <span className="text-xs font-medium">Out</span>
                </button>
            </nav>
        </>
    );
}
