import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Collect',
    items: [
      {
        title: 'Inbox',
        url: '/inbox',
        icon: 'inbox',
        shortcut: ['i', 'i'],
        isActive: false,
        items: []
      },
      {
        title: 'Customers',
        url: '/customers',
        icon: 'teams',
        shortcut: ['c', 'c'],
        isActive: false,
        items: []
      },
      {
        title: 'Aging',
        url: '/aging',
        icon: 'aging',
        shortcut: ['a', 'a'],
        isActive: false,
        items: []
      },
      {
        title: 'Agent',
        url: '/agent',
        icon: 'agent',
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Settings',
    items: [
      {
        title: 'Settings',
        url: '#',
        icon: 'settings',
        isActive: true,
        items: [
          {
            title: 'General',
            url: '/settings',
            icon: 'settings'
          },
          {
            title: 'Integrations',
            url: '/settings/integrations',
            icon: 'integrations'
          },
          {
            title: 'Billing',
            url: '/settings/billing',
            icon: 'billing'
          }
        ]
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: 'Onboarding',
        url: '/onboarding',
        icon: 'sparkles',
        isActive: false,
        items: []
      }
    ]
  }
];
