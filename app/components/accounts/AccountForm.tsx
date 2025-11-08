import SubmitButton from '../form/SubmitButton';
import { upsertAccount, AccountType } from '../../(app)/accounts/actions';

type Props = {
  initialData?: {
    id?: string;
    name?: string;
    type?: AccountType;
    institution?: string | null;
    accountNumber?: string | null;
    openingBalance?: number | null;
    openingDate?: string | null;
    notes?: string | null;
  };
};

const ACCOUNT_TYPES: AccountType[] = [
  'Checking',
  'Savings',
  'Amex Credit',
  'Visa Credit',
  'Master Credit',
  'Cash',
];

export default function AccountForm({ initialData }: Props) {
  const isEdit = Boolean(initialData?.id);
  const defaultType: AccountType = initialData?.type ?? 'Checking';

  return (
    <form action={upsertAccount} className="mx-auto max-w-2xl space-y-5">
      {isEdit ? <input type="hidden" name="id" value={initialData!.id} /> : null}

      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm font-medium">
          Account Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={initialData?.name ?? ''}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="e.g., Operating Checking"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="type" className="text-sm font-medium">
          Type
        </label>
        <select
          id="type"
          name="type"
          defaultValue={defaultType}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label htmlFor="institution" className="text-sm font-medium">
          Institution (optional)
        </label>
        <input
          id="institution"
          name="institution"
          defaultValue={initialData?.institution ?? ''}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="e.g., Chase, Bank of America"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="accountNumber" className="text-sm font-medium">
          Account Number (optional)
        </label>
        <input
          id="accountNumber"
          name="accountNumber"
          defaultValue={initialData?.accountNumber ?? ''}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="Last 4 digits, etc."
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="openingBalance" className="text-sm font-medium">
          Opening Balance (optional)
        </label>
        <input
          id="openingBalance"
          name="openingBalance"
          type="number"
          step="0.01"
          defaultValue={
            typeof initialData?.openingBalance === 'number'
              ? initialData?.openingBalance
              : ''
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="0.00"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="openingDate" className="text-sm font-medium">
          Opening Date (optional)
        </label>
        <input
          id="openingDate"
          name="openingDate"
          type="date"
          defaultValue={initialData?.openingDate ?? ''}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initialData?.notes ?? ''}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="Any special details about this account"
        />
      </div>

      <SubmitButton className="bg-emerald-600 text-white hover:opacity-90">
        {isEdit ? 'Save Changes' : 'Create Account'}
      </SubmitButton>
    </form>
  );
}
