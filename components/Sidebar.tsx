// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// tiny class combiner
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

  // data actions (now styled exactly like the rest)
  const actions = [
    { href: '/sync/tiller',   label: 'Sync from Google Sheets' },
    { href: '/import/tiller', label: 'Import Tiller (CSV)' },
  ];

  const itemClass = (href: string) =>
    cx(
      'block rounded-lg px-3 py-2 text-sm',
      isActive(href) ? 'bg-black text-white' : 'text-gray-800 hover:bg-gray-100'
    );

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
            <Link key={item.href} href={item.href} className={itemClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="my-4 h-px bg-gray-200" />

        {/* Actions — same look & behavior as tabs */}
        <nav className="space-y-1">
          {actions.map((a) => (
            <Link key={a.href} href={a.href} className={itemClass(a.href)}>
              {a.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
