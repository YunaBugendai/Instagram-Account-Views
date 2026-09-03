import type { EstimateResult } from "@/lib/estimateFormula";
import { Disclaimer } from "./Disclaimer";

export function ResultCard({ username, result }: { username: string; result: EstimateResult }) {
  const { estimatedViews, breakdown } = result;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="text-sm text-textSecondary">@{username}</span>
      <div>
        <p className="text-sm font-medium text-textSecondary">Tahmini profil ziyaretleri</p>
        <p className="text-6xl font-bold tracking-tight text-accent">
          {estimatedViews.toLocaleString("tr-TR")}
        </p>
      </div>

      <div className="w-full rounded-xl border border-border bg-surface p-4 text-left text-sm">
        <p className="mb-2 font-medium text-textPrimary">Nasıl hesaplandı</p>
        <Row label="Taban değer (takipçi ÷ 25)" value={breakdown.base.toLocaleString("tr-TR")} />
        <Row label="Aktiflik katsayısı" value={breakdown.activityFactor.toFixed(2)} />
        <Row label="Popülerlik katsayısı" value={breakdown.popularityFactor.toFixed(2)} />
        <Row
          label="Günlük varyasyon"
          value={`${breakdown.dailyVariationPercent > 0 ? "+" : ""}${breakdown.dailyVariationPercent}%`}
        />
      </div>

      <Disclaimer />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-t border-border py-1.5 first:border-t-0 first:pt-0">
      <span className="text-textSecondary">{label}</span>
      <span className="font-medium text-textPrimary">{value}</span>
    </div>
  );
}
