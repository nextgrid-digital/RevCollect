interface ConnectToQuickBooksButtonProps {
  href: string;
}

/** Intuit's unmodified Connect to QuickBooks artwork. Do not recolor or restyle it. */
export function ConnectToQuickBooksButton({ href }: ConnectToQuickBooksButtonProps) {
  return (
    <a href={href} className='inline-flex shrink-0' aria-label='Connect to QuickBooks'>
      <img
        src='/intuit/C2QB_green_btn_med.svg'
        alt='Connect to QuickBooks'
        width={223}
        height={75}
        className='h-auto w-[223px]'
      />
    </a>
  );
}
