"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { post } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function Navbar() {
    const { user, loading, refresh } = useAuth();
    const router = useRouter();

    if (loading || !user) return null;

    const invitesLink = `/invites`;

    async function handleLogout() {
        await post("/auth/logout", {});
        await refresh();
        router.push("/login");
    }

    return (
        <nav className="w-full bg-gray-100 border-b shadow-sm">
            <div className="max-w-4xl mx-auto px-4 py-3 
                      flex items-center justify-between">

                <div className="flex items-center space-x-10">
                    <Link href="/dashboard" className="hover:underline">
                        Dashboard
                    </Link>

                    <Link href={invitesLink} className="hover:underline">
                        Convites
                    </Link>
                </div>

                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700">{user.email}</span>

                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 
                       text-white px-4 py-1.5 rounded-md shadow"
                    >
                        Sair
                    </button>
                </div>

            </div>
        </nav>
    );
}
