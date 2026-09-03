"use client";

import { useEffect, useState } from "react";
import { NumberField } from "./NumberField";
import { TextField } from "./TextField";
import { DailyLimitBadge } from "./DailyLimitBadge";
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

interface DailyStatus {
  remaining: number;
  limit: number;
}

interface CalculateResponse extends EstimateResult {
  status: DailyStatus;
}

export function Calculator() {
  const [form, setForm] = useState<FormState>({
    username: "",
    followers: "",
    following: "",
    posts: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [result, setResult] = useState<{ username: string; data: CalculateResponse } | null>(
    null
  );

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then(setStatus)
      .catch(() => {
        // Sessizce geç - "Hesapla" basıldığında zaten tekrar kontrol edilecek.
      });
  }, []);

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

      if (res.status === 429) {
        setStatus(data.status);
        setBanner("Günlük arama hakkın bitti. Yarın tekrar dene.");
        return;
      }
      if (!res.ok) {
        setBanner(data.error ?? "Girdiğin bilgiler geçersiz görünüyor, tekrar kontrol et.");
        return;
      }

      setResult({ username: form.username.trim(), data });
      setStatus(data.status);
    } catch {
      setBanner("Bir şeyler ters gitti. İnternet bağlantını kontrol edip tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <ResultCard username={result.username} result={result.data} />
        <AdSlot label="Reklam alanı" />
        <button
          onClick={() => setResult(null)}
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

      {status && <DailyLimitBadge remaining={status.remaining} limit={status.limit} />}

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
        disabled={loading || (status !== null && status.remaining <= 0)}
        className="rounded-lg bg-accent py-3.5 text-center font-semibold text-background transition-opacity disabled:opacity-40"
      >
        {loading ? "Hesaplanıyor..." : "Hesapla"}
      </button>

      <Disclaimer />

      <AdSlot label="Reklam alanı" />
    </form>
  );
}
