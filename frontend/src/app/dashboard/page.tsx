"use client";

import { useEffect, useState } from "react";
import { get, post } from "@/lib/api";
import { useRouter } from "next/navigation";
import LogoUploadButton from "@/components/LogoUploadDropzone";

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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLogo, setResetLogo] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 2;
  const [total, setTotal] = useState(0);

  async function loadCompanies(targetPage = page) {
    try {
      const res = await get<{
        page: number;
        pageSize: number;
        total: number;
        items: {
          company: { id: string; name: string; logoUrl?: string | null };
          role: string;
        }[];
      }>(`/companies?page=${targetPage}&pageSize=${pageSize}`);

      const normalized = (res.items ?? []).map((item: any) => ({
        id: item.company.id,
        name: item.company.name,
        role: item.role,
      }));

      setCompanies(normalized);
      setPage(res.page);
      setTotal(res.total);

    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (loading) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", newCompanyName);
      formData.append("setActive", "true");

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const res = await fetch("/api/companies", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "user_already_owns_company") {
          setError(data.message || "Você já possui uma empresa.");

          setLogoFile(null);
          setResetLogo(true);

          setLoading(false);
          return;
        }

        throw new Error(data.message || "Erro ao criar empresa.");
      }

      setNewCompanyName("");
      setLogoFile(null);
      setResetLogo(true);

      await loadCompanies(1); 

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);

      setTimeout(() => setResetLogo(false), 100);
    }
  }

  async function handleDeleteCompany(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta empresa? Esta ação é permanente.")) {
      return;
    }

    try {
      const res = await fetch(`/api/company/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erro ao excluir empresa.");
      }

      setCompanies(prev => prev.filter(c => c.id !== id));

      await loadCompanies(1);

      alert("Empresa excluída com sucesso!");

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
    loadCompanies(1);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold text-gray-900 mb-10">Dashboard</h1>

      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Minhas empresas</h2>

          {companies.length === 0 ? (
            <p className="text-gray-500">Nenhuma empresa encontrada.</p>
          ) : (
            <>
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

                    {company.role === "OWNER" && (
                      <button
                        onClick={() => handleDeleteCompany(company.id)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* --- PAGINAÇÃO --- */}
              <div className="flex justify-between items-center mt-5">
                <button
                  disabled={page === 1}
                  onClick={() => loadCompanies(page - 1)}
                  className={`px-3 py-1 rounded-lg text-sm border transition ${page === 1
                    ? "bg-gray-200 cursor-not-allowed"
                    : "bg-white hover:bg-gray-100"
                    }`}
                >
                  ← Anterior
                </button>

                <span className="text-sm text-gray-600">
                  Página {page} de {Math.ceil(total / pageSize)}
                </span>

                <button
                  disabled={page * pageSize >= total}
                  onClick={() => loadCompanies(page + 1)}
                  className={`px-3 py-1 rounded-lg text-sm border transition ${page * pageSize >= total
                    ? "bg-gray-200 cursor-not-allowed"
                    : "bg-white hover:bg-gray-100"
                    }`}
                >
                  Próxima →
                </button>
              </div>
            </>
          )}
        </div>

        {/* --- CRIAR EMPRESA --- */}
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Criar nova empresa
          </h2>

          <LogoUploadButton onSelect={setLogoFile} reset={resetLogo} />

          <form onSubmit={handleCreateCompany} className="space-y-4 mt-4">
            <input
              type="text"
              placeholder="Nome da empresa"
              className="w-full border px-3 py-2 rounded-lg focus:ring-1 focus:ring-black"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg text-white transition ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
                }`}
            >
              {loading ? "Criando..." : "Criar empresa"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
