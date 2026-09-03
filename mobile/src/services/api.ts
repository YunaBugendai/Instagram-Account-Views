import { API_BASE_URL } from "../config";
import { getAttestationHeaders } from "./deviceAttestation";
import type { DailyStatus, EstimateFormInput, EstimateResponse } from "../types";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
  }
}

async function authenticatedRequest<T>(
  path: string,
  options: { method: "GET" | "POST"; body?: unknown }
): Promise<T> {
  const headers = await getAttestationHeaders(options.body);
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await res.json().catch(() => undefined);

  if (!res.ok) {
    throw new ApiError(
      (json as { error?: string } | undefined)?.error ?? "Sunucu hatası",
      res.status,
      json
    );
  }
  return json as T;
}

export { ApiError };

export function fetchDailyStatus(): Promise<DailyStatus> {
  return authenticatedRequest<DailyStatus>("/status", { method: "GET" });
}

export function calculateEstimate(input: EstimateFormInput): Promise<EstimateResponse> {
  return authenticatedRequest<EstimateResponse>("/calculate", { method: "POST", body: input });
}

export function requestRewardToken(): Promise<{ customData: string }> {
  return authenticatedRequest<{ customData: string }>("/reward/request", {
    method: "POST",
    body: {},
  });
}
