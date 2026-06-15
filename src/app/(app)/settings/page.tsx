import { redirect } from 'next/navigation';

export default function SettingsPage() {
  redirect('/inbox?settings=general');
}
