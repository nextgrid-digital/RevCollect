import { redirect } from 'next/navigation';

export default function SettingsIntegrationsPage() {
  redirect('/inbox?settings=integrations');
}
