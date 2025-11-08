/* lib/tiller/sources/excel.ts */

import type { RawTillerRow } from '../mapTillerRow';

/**
 * TODO: Implement reading from a local/ uploaded Excel workbook (XLSX).
 * For now we return an empty array so the project compiles.
 */
export async function fetchTillerRowsFromExcel(_args: {
  filePath: string;
  sheetName?: string;
}): Promise<RawTillerRow[]> {
  return [];
}
