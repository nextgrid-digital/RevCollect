'use client';

import { useMemo } from 'react';
import { SuggestedAction } from '../../components/suggested-action';
import type { AgingCustomerBreakdownRow } from '../../types';

interface AgingPriorityActionCardProps {
  rows: AgingCustomerBreakdownRow[];
  onViewAccounts: () => void;
}

export function AgingPriorityActionCard({ rows, onViewAccounts }: AgingPriorityActionCardProps) {
  const followUpCount = useMemo(
    () => rows.filter((row) => row.risk === 'high' || row.days60PlusCents > 0).length,
    [rows]
  );

  if (followUpCount === 0) return null;

  return (
    <SuggestedAction
      label='Priority this week'
      description={`${followUpCount} ${followUpCount === 1 ? 'account needs' : 'accounts need'} follow-up based on aging risk and 60+ day balances.`}
      actionLabel='Review accounts'
      onAction={onViewAccounts}
    />
  );
}
