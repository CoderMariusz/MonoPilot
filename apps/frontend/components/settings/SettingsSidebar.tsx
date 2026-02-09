'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const settingsLinks = [
  {
    href: '/settings/roles',
    label: 'Roles & Permissions',
    icon: '👤'
  },
  {
    href: '/settings/integrations',
    label: 'Integrations',
    icon: '🔌'
  },
  {
    href: '/settings/webhooks',
    label: 'Webhooks',
    icon: '🪝'
  }
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {settingsLinks.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span className="text-xl">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
