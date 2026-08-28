import { Icons } from '@/components/icons';

export default function AppLoading() {
  return (
    <div className='flex min-h-svh items-center justify-center'>
      <Icons.spinner className='text-muted-foreground size-6 animate-spin' />
    </div>
  );
}
