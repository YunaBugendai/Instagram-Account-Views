import { Calculator } from "@/components/Calculator";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center">
      <Calculator />
      <footer className="mt-10 text-center text-xs text-textMuted">
        <a href="/gizlilik" className="underline">
          Gizlilik Politikası
        </a>
      </footer>
    </main>
  );
}
