"use client";
import { useEffect, useState } from "react";

export default function HealthCheck() {
  const [data, setData] = useState<any>(null);
  const [ok, setOk] = useState(false);

  const base = process.env.NEXT_PUBLIC_API_URL!;
  const prefix = process.env.NEXT_PUBLIC_API_PREFIX ?? "";

  async function ping() {
    try {
      const url = `${base}${prefix}/health`;
      const res = await fetch(url, { cache: "no-store" });
      const ct = res.headers.get("content-type") || "";
      const body = ct.includes("json") ? await res.json() : await res.text();
      setData({ url, statusCode: res.status, contentType: ct, body });
      setOk(res.ok && ct.includes("json"));
    } catch (e) {
      setData({ error: String(e) });
      setOk(false);
    }
  }

  useEffect(() => { ping(); }, []);

  return (
    <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
      <b>/api/health:</b> {ok ? "OK ✅" : "ERRO ❌"}
      <pre style={{ background: "#f6f6f6", padding: 10, marginTop: 8 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
      <button onClick={ping} style={{ marginTop: 8 }}>Testar novamente</button>
    </div>
  );
}
