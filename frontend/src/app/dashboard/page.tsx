"use client";

import { useEffect, useState } from "react";
import { get, post } from "@/lib/api";
import { useRouter } from "next/navigation";

type Company = {
  id: string;
  name: string;
  role?: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [error, setError] = useState("");

  async function loadCompanies() {
    try {
      const res = await get<{ items: any[] }>("/companies");

      const normalized = (res.items ?? []).map(item => ({
        id: item.company.id,
        name: item.company.name,
        role: item.role,
      }));

      setCompanies(normalized);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await post("/companies", { name: newCompanyName });
      setNewCompanyName("");
      loadCompanies();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleSelectCompany(id: string) {
    try {
      await post(`/company/${id}/select`);
      router.push(`/company/${id}`);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      <h1 className="text-4xl font-bold text-gray-900 mb-10">
        Dashboard
      </h1>

      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Minhas empresas
          </h2>

          {companies.length === 0 ? (
            <p className="text-gray-500">Nenhuma empresa encontrada.</p>
          ) : (
            <div className="space-y-4">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between bg-gray-50 border px-4 py-2 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{company.name}</p>
                    {company.role && (
                      <p className="text-xs text-gray-500 capitalize">
                        Cargo: {company.role.toLowerCase()}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleSelectCompany(company.id)}
                    className="px-3 py-1.5 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition"
                  >
                    Selecionar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Criar nova empresa
          </h2>

          <form onSubmit={handleCreateCompany} className="space-y-4">
            <input
              type="text"
              placeholder="Nome da empresa"
              className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              required
            />

            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Criar empresa
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
