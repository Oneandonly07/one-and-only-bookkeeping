import AccountForm from '../../../components/accounts/AccountForm';
import { getAccountById } from '../actions';

type PageProps = {
  params: { id: string };
};

export default async function EditAccountPage({ params }: PageProps) {
  const account = await getAccountById(params.id);

  const initialData = {
    id: account.id,
    name: account.name,
    type: account.type,
    institution: account.institution,
    accountNumber: account.account_number,
    openingBalance: account.opening_balance,
    openingDate: account.opening_date,
    notes: account.notes,
  };

  return <AccountForm initialData={initialData} />;
}
