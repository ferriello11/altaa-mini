"use client";

import { useEffect, useState } from "react";
import { get, post } from "@/lib/api";
import { useRouter } from "next/navigation";

type Invite = {
    id: string;
    email: string;
    role: string;
    token: string;
    expiresAt: string;
    company: {
        id: string;
        name: string;
    };
};

export default function ReceivedInvitesPage() {
    const router = useRouter();

    const [invites, setInvites] = useState<Invite[]>([]);
    const [error, setError] = useState("");

    async function loadInvites() {
        try {
            const res = await get<{ items: Invite[] }>("/auth/invites");
            setInvites(res.items ?? []);
        } catch (err: any) {
            setError(err.message);
        }
    }

    async function acceptInvite(token: string) {
        try {
            const res = await post<{
                ok: boolean;
                companyId: string;
                activeCompanyId: string | null
            }>("/auth/accept-invite", {
                token,
                setActive: true,
            });

            alert("Convite aceito com sucesso!");

            router.push(`/company/${res.companyId}`);
        } catch (err: any) {
            alert(err.message);
        }
    }

    useEffect(() => {
        loadInvites();
    }, []);

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-3xl font-semibold mb-6">Meus Convites</h1>

            {error && <p className="text-red-600 mb-4">{error}</p>}

            {invites.length === 0 && (
                <p className="text-gray-600">Você não possui convites pendentes.</p>
            )}

            <div className="space-y-4">
                {invites.map((invite) => (
                    <div
                        key={invite.id}
                        className="border rounded-lg p-4 bg-white shadow-sm flex justify-between items-center"
                    >
                        <div>
                            <p className="font-medium">{invite.company.name}</p>
                            <p className="text-sm text-gray-600">
                                Cargo: <span className="font-semibold">{invite.role}</span>
                            </p>
                            <p className="text-sm text-gray-500">
                                Expira em:{" "}
                                {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
                            </p>
                        </div>

                        <button
                            onClick={() => acceptInvite(invite.token)}
                            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-900"
                        >
                            Aceitar convite
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
