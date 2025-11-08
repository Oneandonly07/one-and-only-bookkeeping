/* lib/tiller/sources/googleSheets.ts */
import { GoogleAuth } from 'google-auth-library';
import { sheets_v4 } from '@googleapis/sheets';
import type { RawTillerRow } from '../mapTillerRow';

type SheetsArgs = { spreadsheetId?: string; range?: string };

function rowsToObjects(values: string[][]): RawTillerRow[] {
  if (!values || values.length === 0) return [];
  const [headerRow, ...dataRows] = values;
  const headers = headerRow.map((h) => (h || '').trim());
  return dataRows
    .filter((r) => r && r.some((c) => String(c ?? '').trim() !== ''))
    .map((row) => {
      const obj: Record<string, unknown> = {};
      for (let i = 0; i < headers.length; i++) {
        const key = headers[i] || `col_${i}`;
        obj[key] = row[i];
      }
      return obj as RawTillerRow;
    });
}

export async function fetchTillerRowsFromSheets(args: SheetsArgs): Promise<RawTillerRow[]> {
  const spreadsheetId =
    args.spreadsheetId || process.env.TILLER_SHEETS_SPREADSHEET_ID || '';
  const range = args.range || process.env.TILLER_SHEETS_RANGE || 'Transactions!A:Z';
  if (!spreadsheetId) {
    throw new Error('Missing spreadsheetId (env TILLER_SHEETS_SPREADSHEET_ID or param)');
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!clientEmail || !privateKey) {
    throw new Error(
      'Missing Google SA envs: GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'
    );
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = new sheets_v4.Sheets({ auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
    majorDimension: 'ROWS',
  });

  const values = (res.data.values as string[][]) || [];
  return rowsToObjects(values);
}
