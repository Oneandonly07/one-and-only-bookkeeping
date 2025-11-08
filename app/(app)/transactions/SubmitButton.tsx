"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

type Variant = "default" | "secondary" | "destructive";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  pendingText?: string;
};

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function SubmitButton({
  variant = "default",
  className,
  children,
  pendingText,
  ...rest
}: Props) {
  const { pending } = useFormStatus();

  const base =
    "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  const styles: Record<Variant, string> = {
    default:
      "bg-black text-white hover:bg-black/85 focus:ring-2 focus:ring-black/30",
    secondary:
      "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-2 focus:ring-gray-300",
    destructive:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-300",
  };

  return (
    <button
      type="submit"
      aria-disabled={pending}
      disabled={pending}
      className={cn(base, styles[variant], className)}
      {...rest}
    >
      {pending ? pendingText ?? "Working..." : children}
    </button>
  );
}
