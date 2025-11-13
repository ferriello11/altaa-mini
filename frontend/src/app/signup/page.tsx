"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await post("/auth/signup", { name, email, password });
      await refresh();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white shadow-md rounded-xl p-6">

        <h1 className="text-2xl font-semibold mb-4 text-center">
          Criar Conta
        </h1>

        <form onSubmit={handleSignup} className="space-y-4">

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <div>
            <label className="block text-sm mb-1">Nome</label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">E-mail</label>
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Senha</label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md"
          >
            Criar conta
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Já tem conta?{" "}
          <a
            href="/login"
            className="text-blue-600 hover:underline"
          >
            Entrar
          </a>
        </p>
      </div>
    </div>
  );
}
