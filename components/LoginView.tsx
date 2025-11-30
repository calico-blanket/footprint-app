"use client";
import { signIn } from "@/lib/auth";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginView() {
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            await signIn();
            toast.success("Logged in successfully");
        } catch (error: any) {
            toast.error(error.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-md space-y-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Footprint App
                </h1>
                <p className="text-gray-600">
                    Sign in to access your personal map and timeline.
                </p>
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {loading ? "Signing in..." : "Sign in with Google"}
                </button>
            </div>
        </div>
    );
}
