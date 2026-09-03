"use client";

import { useState } from "react";
import { NumberField } from "./NumberField";
import { TextField } from "./TextField";
import { ResultCard } from "./ResultCard";
import { Disclaimer } from "./Disclaimer";
import { AdSlot } from "./AdSlot";
import type { EstimateResult } from "@/lib/estimateFormula";

const USERNAME_REGEX = /^[a-zA-Z0-9._]{1,30}$/;

interface FormState {
  username: string;
  followers: string;
  following: string;
  posts: string;
}

interface FormErrors {
  username?: string;
  followers?: string;
  following?: string;
  posts?: string;
}

type ViewState =
  | { kind: "form" }
  | { kind: "preparing"; username: string; data: EstimateResult }
  | { kind: "result"; username: string; data: EstimateResult };

// Sonuç hemen açılmıyor: reklam alanının gerçekten yüklenip görünür olması için
// kısa bir "hazırlanıyor" adımı var. Bu, kullanıcıyı reklamı izlemeye zorlayan
// yapay bir kilit DEĞİL - sadece reklamın göz ardı edilip anında geçilmesini
// önleyen doğal bir geçiş süresi.
const PREPARE_DELAY_MS = 1500;

export function Calculator() {
  const [form, setForm] = useState<FormState>({
    username: "",
    followers: "",
    following: "",
    posts: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>({ kind: "form" });

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.username.trim()) {
      next.username = "Kullanıcı adı boş olamaz";
    } else if (!USERNAME_REGEX.test(form.username.trim())) {
      next.username = "Geçersiz kullanıcı adı";
    }
    if (!form.followers) next.followers = "Takipçi sayısını gir";
    if (!form.following) next.following = "Takip edilen sayısını gir";
    if (!form.posts) next.posts = "Gönderi sayısını gir";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/calculate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          followers: Number(form.followers),
          following: Number(form.following),
          posts: Number(form.posts),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setBanner(data.error ?? "Girdiğin bilgiler geçersiz görünüyor, tekrar kontrol et.");
        return;
      }

      const username = form.username.trim();
      setView({ kind: "preparing", username, data });
      setTimeout(() => {
        setView({ kind: "result", username, data });
      }, PREPARE_DELAY_MS);
    } catch {
      setBanner("Bir şeyler ters gitti. İnternet bağlantını kontrol edip tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  if (view.kind === "preparing") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-center text-sm text-textSecondary">Sonucun hazırlanıyor...</p>
        <AdSlot label="Reklam alanı" />
      </div>
    );
  }

  if (view.kind === "result") {
    return (
      <div className="flex flex-col gap-6">
        <ResultCard username={view.username} result={view.data} />
        <AdSlot label="Reklam alanı" />
        <button
          onClick={() => setView({ kind: "form" })}
          className="rounded-lg border border-border py-3 text-center font-medium text-textPrimary"
        >
          Başka bir hesap dene
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-textPrimary">
          Instagram profil ziyaretlerini tahmin et
        </h1>
        <p className="mt-2 text-textSecondary">
          Instagram'da profilinde gördüğün sayıları gir, sana eğlenceli bir tahmin çıkaralım.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <TextField
          label="Kullanıcı adı"
          value={form.username}
          onChange={(v) => setForm((f) => ({ ...f, username: v }))}
          placeholder="kullaniciadi"
          error={errors.username}
        />
        <NumberField
          label="Takipçi sayısı"
          value={form.followers}
          onChange={(v) => setForm((f) => ({ ...f, followers: v }))}
          placeholder="Örn. 4200"
          error={errors.followers}
        />
        <NumberField
          label="Takip edilen sayısı"
          value={form.following}
          onChange={(v) => setForm((f) => ({ ...f, following: v }))}
          placeholder="Örn. 380"
          error={errors.following}
        />
        <NumberField
          label="Gönderi sayısı"
          value={form.posts}
          onChange={(v) => setForm((f) => ({ ...f, posts: v }))}
          placeholder="Örn. 120"
          error={errors.posts}
        />
      </div>

      {banner && (
        <div className="rounded-lg bg-surfaceRaised p-4 text-sm text-textPrimary">{banner}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent py-3.5 text-center font-semibold text-background transition-opacity disabled:opacity-40"
      >
        {loading ? "Hesaplanıyor..." : "Hesapla"}
      </button>

      <Disclaimer />

      <AdSlot label="Reklam alanı" />
    </form>
  );
}
