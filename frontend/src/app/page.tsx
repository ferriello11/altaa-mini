import HealthCheck from "@/components/HealthCheck";

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Status</h1>
      <HealthCheck />
    </main>
  );
}
