'use client';

import * as React from 'react';
import Link from 'next/link';

type Props = {
  accountId: string;
  className?: string;
};

/**
 * Client-only button that navigates to the Share page.
 * No handlers are passed from any Server Component.
 */
export default function AccountShareButton({ accountId, className }: Props) {
  return (
    <Link
      href={`/accounts/${accountId}/share`}
      className={
        className ??
        'inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50'
      }
    >
      Share
    </Link>
  );
}
