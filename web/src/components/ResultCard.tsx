"use client";

import { useState } from "react";
import type { EstimateResult } from "@/lib/estimateFormula";
import { Disclaimer } from "./Disclaimer";

export function ResultCard({
  username,
  result,
}: {
  username: string;
  result: EstimateResult;
}) {
  const { estimatedViews, breakdown } = result;
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState("");

  async function handleShare() {
    setSharing(true);
    setMessage("");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas desteklenmiyor.");
      }

      // Arka plan
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
      gradient.addColorStop(0, "#111827");
      gradient.addColorStop(1, "#030712");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // Başlık
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "bold 64px Arial";
      ctx.fillText("Instagram Account Views", 540, 250);

      // Kullanıcı adı
      ctx.fillStyle = "#9ca3af";
      ctx.font = "42px Arial";
      ctx.fillText(`@${username}`, 540, 380);

      // Ana kart
      ctx.fillStyle = "#1f2937";
      roundRect(ctx, 90, 520, 900, 650, 40);
      ctx.fill();

      // Açıklama
      ctx.fillStyle = "#9ca3af";
      ctx.font = "32px Arial";
      ctx.fillText("Tahmini profil ziyaretleri", 540, 650);

      // Büyük sayı
      ctx.fillStyle = "#a78bfa";
      ctx.font = "bold 120px Arial";
      ctx.fillText(
        estimatedViews.toLocaleString("tr-TR"),
        540,
        830
      );

      // Ayırıcı
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(220, 920);
      ctx.lineTo(860, 920);
      ctx.stroke();

      // Bilgilendirme
      ctx.fillStyle = "#d1d5db";
      ctx.font = "28px Arial";
      ctx.fillText("Eğlence amaçlı tahmindir.", 540, 1010);

      ctx.fillStyle = "#9ca3af";
      ctx.font = "25px Arial";
      ctx.fillText("Gerçek Instagram verisi değildir.", 540, 1060);

      // Alt bilgi
      ctx.fillStyle = "#6b7280";
      ctx.font = "24px Arial";
      ctx.fillText("instagram-account-views.vercel.app", 540, 1780);

      // Filigran
      ctx.globalAlpha = 0.35;
      ctx.font = "bold 28px Arial";
      ctx.fillText(
        "instagram-account-views.vercel.app",
        540,
        1840
      );
      ctx.globalAlpha = 1;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Görsel oluşturulamadı."));
          }
        }, "image/png");
      });

      const file = new File(
        [blob],
        "instagram-account-views.png",
        { type: "image/png" }
      );

      // Telefon destekliyorsa doğrudan sistem paylaşım menüsünü aç.
      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: "Instagram Account Views",
          text: `@${username} için tahmini profil ziyaretleri: ${estimatedViews.toLocaleString(
            "tr-TR"
          )}`,
          files: [file],
        });

        return;
      }

      // Web Share API yoksa görseli kaydet.
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "instagram-account-views.png";
      link.click();

      URL.revokeObjectURL(url);

      setMessage(
        "Telefonun paylaşımı desteklemiyor. Görsel hazırlandı."
      );
    } catch (error) {
      // Kullanıcı paylaşım menüsünü kapattıysa hata gösterme.
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error(error);
      setMessage("Görsel oluşturulurken bir hata oluştu.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="text-sm text-textSecondary">
        @{username}
      </span>

      <div>
        <p className="text-sm font-medium text-textSecondary">
          Tahmini profil ziyaretleri
        </p>

        <p className="text-6xl font-bold tracking-tight text-accent">
          {estimatedViews.toLocaleString("tr-TR")}
        </p>
      </div>

      <button
        type="button"
        onClick={handleShare}
        disabled={sharing}
        className="w-full rounded-lg bg-accent py-3.5 text-center font-semibold text-background transition-opacity disabled:opacity-50"
      >
        {sharing
          ? "Görsel hazırlanıyor..."
          : "Instagram Hikayesinde Paylaş"}
      </button>

      {message && (
        <p className="text-sm text-textSecondary">
          {message}
        </p>
      )}

      <div className="w-full rounded-xl border border-border bg-surface p-4 text-left text-sm">
        <p className="mb-2 font-medium text-textPrimary">
          Nasıl hesaplandı
        </p>

        <Row
          label="Taban değer (takipçi ÷ 25)"
          value={breakdown.base.toLocaleString("tr-TR")}
        />

        <Row
          label="Aktiflik katsayısı"
          value={breakdown.activityFactor.toFixed(2)}
        />

        <Row
          label="Popülerlik katsayısı"
          value={breakdown.popularityFactor.toFixed(2)}
        />

        <Row
          label="Günlük varyasyon"
          value={`${
            breakdown.dailyVariationPercent > 0 ? "+" : ""
          }${breakdown.dailyVariationPercent}%`}
        />
      </div>

      <Disclaimer />
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between border-t border-border py-1.5 first:border-t-0 first:pt-0">
      <span className="text-textSecondary">{label}</span>
      <span className="font-medium text-textPrimary">
        {value}
      </span>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
        }
