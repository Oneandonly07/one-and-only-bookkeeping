'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';

type Props = {
  children?: React.ReactNode;
  className?: string;
};

export default function SubmitButton({ children, className }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={[
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
        'border border-gray-300 shadow-sm',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        'transition',
        className ?? 'bg-black text-white hover:opacity-90',
      ].join(' ')}
    >
      {pending ? 'Saving…' : children ?? 'Save'}
    </button>
  );
}
