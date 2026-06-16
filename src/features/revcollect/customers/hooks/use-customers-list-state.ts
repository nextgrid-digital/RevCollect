'use client';

import { useMemo, useState } from 'react';
import { useAgentConfig, useCustomers } from '../../api/queries';
import type { Customer } from '../../types';
import {
  classifyCustomerRiskTier,
  type CustomerRiskFilter,
  type CustomerRiskTier
} from '../lib/classify-customer-risk-tier';

function matchesCustomerSearch(customer: Customer, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return (
    customer.name.toLowerCase().includes(q) ||
    customer.company.toLowerCase().includes(q) ||
    customer.email.toLowerCase().includes(q)
  );
}

function getListEmptyMessage(
  filter: CustomerRiskFilter,
  searchQuery: string,
  hasResults: boolean
): string {
  if (searchQuery.trim() && !hasResults) {
    return 'No customers match your search';
  }

  if (filter === 'all') return 'No customers yet';
  if (filter === 'high') return 'No high-risk customers';
  if (filter === 'watch') return 'No customers on watch';
  return 'No healthy customers';
}

export function useCustomersListState() {
  const { data: customers = [], isPending } = useCustomers();
  const { data: agentConfig } = useAgentConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<CustomerRiskFilter>('all');

  const thresholds = agentConfig?.riskThresholds;

  const getRiskTier = useMemo(() => {
    return (customer: Customer): CustomerRiskTier => {
      if (!thresholds) {
        return classifyCustomerRiskTier(customer.daysOverdue, {
          healthyDays: [0, 7],
          watchDays: [8, 15],
          urgentDays: [16, 30],
          criticalDaysMin: 30
        });
      }
      return classifyCustomerRiskTier(customer.daysOverdue, thresholds);
    };
  }, [thresholds]);

  const counts = useMemo(() => {
    const tallies = { all: customers.length, high: 0, watch: 0, healthy: 0 };

    for (const customer of customers) {
      const tier = getRiskTier(customer);
      tallies[tier] += 1;
    }

    return tallies;
  }, [customers, getRiskTier]);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((customer) => {
        if (!matchesCustomerSearch(customer, searchQuery)) return false;
        if (riskFilter === 'all') return true;
        return getRiskTier(customer) === riskFilter;
      })
      .sort((a, b) => b.balanceCents - a.balanceCents);
  }, [customers, searchQuery, riskFilter, getRiskTier]);

  return {
    customers,
    isPending,
    searchQuery,
    setSearchQuery,
    riskFilter,
    setRiskFilter,
    counts,
    filteredCustomers,
    getRiskTier,
    emptyMessage: getListEmptyMessage(riskFilter, searchQuery, filteredCustomers.length > 0)
  };
}
