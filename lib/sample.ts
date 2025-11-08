import seed from "../data/seed.json";

export type Txn = {
  id: number; date: string; description: string; amount: number;
  account_id: number; location_id: number; member_id: number; category: string;
};

export async function loadSample() {
  return seed;
}
