"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await post("/auth/login", { email, password });
      await refresh();
      router.push("/dashboard");
    } catch (err: any) {
      setError("Usuário ou senha incorretos.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white shadow-md rounded-xl p-6">

        <h1 className="text-2xl font-semibold mb-4 text-center">
          Login
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

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
            Entrar
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Não tem conta?{" "}
          <a
            href="/signup"
            className="text-blue-600 hover:underline"
          >
            Criar conta
          </a>
        </p>
      </div>
    </div>
  );
}
