interface InboxContextSectionLabelProps {
  children: string;
}

export function InboxContextSectionLabel({ children }: InboxContextSectionLabelProps) {
  return (
    <p className='text-muted-foreground px-1 text-[11px] font-medium tracking-wide uppercase'>
      {children}
    </p>
  );
}
