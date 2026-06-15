import { redirect } from 'next/navigation';

export default function SettingsBillingPage() {
  redirect('/inbox?settings=billing');
}
