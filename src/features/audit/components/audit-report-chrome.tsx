import { cn } from '@/lib/utils';

interface ReportKickerProps {
  children: React.ReactNode;
  className?: string;
}

export function ReportKicker({ children, className }: ReportKickerProps) {
  return (
    <p
      className={cn(
        'font-audit-sans text-audit-ink text-[11px] font-semibold tracking-[0.08em] uppercase',
        className
      )}
    >
      {children}
    </p>
  );
}

interface ReportHeadingProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}

export function ReportHeading({ children, className, as: Tag = 'h2' }: ReportHeadingProps) {
  return (
    <Tag
      className={cn(
        'font-audit-serif text-audit-ink max-w-3xl text-balance font-normal',
        Tag === 'h1'
          ? 'text-[clamp(2.5rem,6vw,4.625rem)] leading-[1.05] tracking-[-0.03em]'
          : 'text-[clamp(2rem,4vw,2.5rem)] leading-[1.35] tracking-[-0.01em]',
        className
      )}
    >
      {children}
    </Tag>
  );
}

interface ReportProseProps {
  children: React.ReactNode;
  className?: string;
}

export function ReportProse({ children, className }: ReportProseProps) {
  return (
    <p
      className={cn(
        'font-audit-sans text-audit-charcoal max-w-3xl text-[14px] leading-[1.5] sm:text-[18px] sm:leading-[1.5]',
        className
      )}
    >
      {children}
    </p>
  );
}

interface ReportCaptionProps {
  children: React.ReactNode;
  className?: string;
}

export function ReportCaption({ children, className }: ReportCaptionProps) {
  return (
    <p
      className={cn(
        'font-audit-sans text-audit-muted text-[10px] leading-[1.61] sm:text-[12px]',
        className
      )}
    >
      {children}
    </p>
  );
}

interface ReportSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Print page break before this section (skip on cover). */
  pageBreak?: boolean;
}

/** Continuous report section; not a viewport slide. */
export function ReportSection({ children, className, pageBreak = false }: ReportSectionProps) {
  return (
    <section
      className={cn(
        'audit-report-section mx-auto flex w-full max-w-[1200px] flex-col gap-[21px] px-6 py-14 sm:gap-7 sm:px-8 sm:py-16',
        pageBreak && 'audit-page-break',
        className
      )}
    >
      {children}
    </section>
  );
}
