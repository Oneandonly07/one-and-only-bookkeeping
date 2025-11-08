/* lib/tiller/mapTillerRow.ts */
export type RawTillerRow = {
  Date?: string;
  Description?: string;
  Category?: string;
  Amount?: string | number;
  Account?: string;
  AccountNumber?: string;
  Institution?: string;
  TransactionId?: string;
  [key: string]: unknown;
};

export type TxnInsert = {
  team_id: string;
  date: string;
  payee: string;
  amount: number;
  source: 'tiller_sheets' | 'tiller_excel' | 'tiller_api';
  external_id?: string | null;
  raw?: Record<string, unknown>;
};

export function mapTillerRowToTxn(
  row: RawTillerRow,
  opts: { teamId: string; source: TxnInsert['source'] }
): TxnInsert {
  const amountNum =
    typeof row.Amount === 'string'
      ? Number(row.Amount.replace(/,/g, ''))
      : typeof row.Amount === 'number'
      ? row.Amount
      : 0;

  const isoDate = row.Date
    ? new Date(row.Date as string).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    team_id: opts.teamId,
    date: isoDate,
    payee: (row.Description as string) || '(No description)',
    amount: Number.isFinite(amountNum) ? amountNum : 0,
    source: opts.source,
    external_id:
      (row.TransactionId as string) ||
      (row['Transaction ID'] as string) ||
      null,
    raw: { ...row },
  };
}
