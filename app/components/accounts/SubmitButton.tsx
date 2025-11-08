'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Optional text to show while the form is submitting */
  pendingText?: string;
};

export default function SubmitButton({
  children,
  pendingText,
  className = '',
  disabled,
  ...rest
}: Props) {
  const { pending } = useFormStatus();

  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      {...rest}
      disabled={isDisabled}
      className={[
        // sensible default button styles
        'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium',
        isDisabled ? 'opacity-60 cursor-not-allowed' : '',
        className,
      ].join(' ')}
    >
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
