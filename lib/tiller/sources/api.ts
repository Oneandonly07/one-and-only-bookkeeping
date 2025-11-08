/* lib/tiller/sources/api.ts */

import type { RawTillerRow } from '../mapTillerRow';

/**
 * TODO: Implement Tiller API (beta) fetch using a Tiller access token.
 * For now we return an empty array so the project compiles.
 */
export async function fetchTillerRowsFromApi(_args: {
  tillerToken: string;
  since?: string;
}): Promise<RawTillerRow[]> {
  return [];
}
