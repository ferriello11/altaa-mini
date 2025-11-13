const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL não configurada no .env.local");
}

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    credentials: "include", 
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (!response.ok) {
    const errorBody = isJson ? await response.json() : await response.text();
    throw new Error(
      typeof errorBody === "string"
        ? errorBody
        : errorBody.message || "Erro inesperado"
    );
  }

  return isJson ? response.json() : ((await response.text()) as unknown as T);
}

export function get<T>(path: string) {
  return api<T>(path, { method: "GET" });
}

export function post<T>(path: string, body?: unknown) {
  return api<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function put<T>(path: string, body?: unknown) {
  return api<T>(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function del<T>(path: string) {
  return api<T>(path, { method: "DELETE" });
}
