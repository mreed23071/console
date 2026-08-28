import { connectors } from "../mock";
import type { Connector } from "../types";
import { delay } from "./_shared";

/** GET /api/v1/connectors */
export async function getConnectors(): Promise<Connector[]> {
  await delay(280);
  return connectors;
}
