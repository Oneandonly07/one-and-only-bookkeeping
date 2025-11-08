// app/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// tiny helper for conditional classnames
function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(' ');
}

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== '/' && (pathname ?? '').startsWith(href));

  // main pages
  const main = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/transactions', label: 'Transactions' },
    { href: '/accounts', label: 'Accounts' },
    { href: '/reports', label: 'Reports' },
    { href: '/members', label: 'Members' },
  ];

  // data actions (requested)
  const actions = [
    { href: '/sync/tiller',   label: 'Sync from Google Sheets' },
    { href: '/import/tiller', label: 'Import Tiller (CSV)' },
  ];

  return (
    <aside className="w-56 shrink-0 border-r bg-white">
      <div className="p-4 h-screen overflow-auto">
        <div className="mb-6">
          <div className="font-semibold">One &amp; Only</div>
          <div className="text-xs text-gray-500">Bookkeeping</div>
        </div>

        {/* Main navigation */}
        <nav className="space-y-1">
          {main.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                'block rounded-lg px-3 py-2 text-sm',
                isActive(item.href)
                  ? 'bg-black text-white'
                  : 'text-gray-800 hover:bg-gray-100'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="my-4 h-px bg-gray-200" />

        {/* Actions below Members */}
        <nav className="space-y-1">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={cx(
                'block rounded-lg px-3 py-2 text-sm font-medium',
                // make Sync stand out a bit more
                a.href === '/sync/tiller'
                  ? 'bg-black text-white hover:opacity-90'
                  : 'border text-gray-800 hover:bg-gray-50'
              )}
            >
              {a.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
