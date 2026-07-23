import { redirect } from 'next/navigation';

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const next = firstParam(params.next);
  const error = firstParam(params.error);
  const query = new URLSearchParams();
  if (next) query.set('next', next);
  if (error) query.set('error', error);
  const qs = query.toString();
  redirect(qs ? `/?${qs}` : '/');
}
