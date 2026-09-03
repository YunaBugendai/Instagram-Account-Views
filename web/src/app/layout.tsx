import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instagram Account Views — Tahmini Profil Ziyaretleri",
  description:
    "Takipçi, takip edilen ve gönderi sayını gir; eğlence amaçlı tahmini profil ziyaret sayını hemen gör. Gerçek Instagram verisi değildir.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-10">{children}</div>
      </body>
    </html>
  );
}
