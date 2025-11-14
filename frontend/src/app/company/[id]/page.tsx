"use client";

import { useEffect, useState } from "react";
import { get, post, del } from "@/lib/api";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LogoUploadDropzone from "@/components/LogoUploadDropzone";

type Member = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

export default function CompanyPage() {
  const params = useParams();
  const companyId = params.id as string;

  const { user } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [lastInvite, setLastInvite] = useState<any | null>(null);
  const [resetSignal, setResetSignal] = useState(false);


  const userRole = members.find((m) => m.email === user?.email)?.role;
  const canEdit = userRole === "OWNER" || userRole === "ADMIN";

  async function loadData() {
    try {
      const res = await get<any>(`/company/${companyId}/members`);

      const items = res.items ?? [];
      const company = res.company ?? {};

      const normalized: Member[] = items.map((m: any) => ({
        id: m.id,
        name: m.user?.name,
        email: m.user?.email,
        role: m.role,
      }));

      setMembers(normalized);
      setCompanyName(company.name || "");
      setCompanyLogo(company.logoUlr ?? null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await post<{ invite: any }>(
        `/company/${companyId}/invite`,
        { email: inviteEmail }
      );

      setInviteEmail("");
      setLastInvite(res.invite);
      alert("Convite gerado!");
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(memberId: string) {
    if (!confirm("Tem certeza que deseja remover este membro?")) return;

    try {
      await del(`/company/${companyId}/members/${memberId}`);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleUpdateCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;

    setSavingEdit(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", companyName);

      if (newLogoFile) {
        formData.append("logo", newLogoFile);
      }

      const response = await fetch(`/api/company/${companyId}`, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar empresa.");
      }

      setCompanyName(data.company.name);
      setCompanyLogo(data.company.logoUlr ?? null);
      setNewLogoFile(null);
      setResetSignal(v => !v);

      await loadData();

      alert("Empresa atualizada com sucesso!");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleChangeRole(memberId: string, role: string) {
    try {
      const res = await fetch(`/api/company/${companyId}/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao alterar papel.");
        return;
      }

      await loadData();
      alert("Cargo atualizado!");
    } catch (err: any) {
      setError(err.message);
    }
  }



  useEffect(() => {
    if (companyId) loadData();
  }, [companyId]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      <h1 className="text-4xl font-bold text-gray-900 mb-10">
        Empresa: {companyName}
      </h1>

      <div className="w-full h-64 md:h-80 lg:h-96 overflow-hidden rounded-2xl shadow-sm mb-10">
        {companyLogo ? (
          <img
            src={companyLogo}
            alt="Logo da empresa"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-600">
            Sem logo
          </div>
        )}
      </div>

      {canEdit && (
        <div className="border rounded-xl shadow-sm bg-white p-6 mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Editar empresa
          </h2>

          <form onSubmit={handleUpdateCompany} className="space-y-4">

            <div>
              <label className="text-sm font-medium">Nome</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded-lg"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Logo</label>
              <LogoUploadDropzone
                initialUrl={companyLogo ?? undefined}
                onSelect={setNewLogoFile}
                reset={resetSignal}
              />
            </div>

            <button
              type="submit"
              disabled={savingEdit}
              className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              {savingEdit ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        <div className="border rounded-xl shadow-sm bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Membros</h2>

          <div className="space-y-4">
            {members.length === 0 && (
              <p className="text-gray-500">Nenhum membro encontrado.</p>
            )}

            {members.map((m) => {
              const canRemove =
                (userRole === "OWNER" && m.role !== "OWNER") ||
                (userRole === "ADMIN" && m.role === "MEMBER");

              const canChangeRole =
                (userRole === "OWNER" && m.role !== "OWNER") ||
                (userRole === "ADMIN" && m.role === "MEMBER");

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between border rounded-lg px-4 py-3 bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-gray-600">{m.email}</p>
                  </div>

                  <div className="flex items-center gap-3">

                    {canChangeRole ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleChangeRole(m.id, e.target.value)}
                        className="border px-2 py-1 rounded text-sm bg-white"
                      >
                        <option value="MEMBER">MEMBER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-md text-sm font-semibold 
                        ${m.role === "OWNER"
                            ? "bg-purple-100 text-purple-700"
                            : m.role === "ADMIN"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        {m.role}
                      </span>
                    )}

                    {canRemove && (
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border rounded-xl shadow-sm bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Convidar usuário
          </h2>

          <form onSubmit={handleInvite} className="space-y-4">
            <input
              type="email"
              placeholder="E-mail do usuário"
              className="w-full border px-3 py-2 rounded-lg"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />

            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800"
            >
              Enviar convite
            </button>
          </form>

          {lastInvite && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
              <p className="font-semibold text-green-800 mb-1">
                Convite gerado:
              </p>
              <p>Email: <span className="font-medium">{lastInvite.email}</span></p>
              <p>
                Token:{" "}
                <span className="font-mono break-all">{lastInvite.token}</span>
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
