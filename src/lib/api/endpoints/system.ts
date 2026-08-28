import type { HealthResponse, ReadinessResponse } from "../types";
import { delay } from "./_shared";

/** GET /health */
export async function getHealth(): Promise<HealthResponse> {
  await delay(180);
  return { status: "ok", version: "0.4.2", environment: "local" };
}

/** GET /ready */
export async function getReadiness(): Promise<ReadinessResponse> {
  await delay(220);
  return { status: "degraded", database: true, embeddings: false };
}
