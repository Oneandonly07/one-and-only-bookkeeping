import * as React from "react";
import { cn } from "@/lib/utils";

type DialogCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
};
const Ctx = React.createContext<DialogCtx | null>(null);

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const [localOpen, setLocalOpen] = React.useState(false);
  const controlled = typeof open === "boolean";
  const valueOpen = controlled ? open : localOpen;
  const setOpen = (v: boolean) => {
    if (!controlled) setLocalOpen(v);
    onOpenChange?.(v);
  };
  return <Ctx.Provider value={{ open: valueOpen, setOpen }}>{children}</Ctx.Provider>;
}

export function DialogTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactElement;
}) {
  const ctx = React.useContext(Ctx)!;
  const onClick = () => ctx.setOpen(true);
  return asChild ? React.cloneElement(children, { onClick }) : <button onClick={onClick}>{children}</button>;
}

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(Ctx)!;
  if (!ctx.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={cn("w-full max-w-md rounded-2xl bg-white p-4 shadow-lg", className)}>
        {children}
      </div>
    </div>
  );
}
export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-2">{children}</div>;
}
export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
}
export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-500">{children}</p>;
}
export function DialogFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mt-3 flex justify-end gap-2", className)}>{children}</div>;
}
export function DialogClose({ asChild, children }: { asChild?: boolean; children: React.ReactElement }) {
  const ctx = React.useContext(Ctx)!;
  const onClick = () => ctx.setOpen(false);
  return asChild ? React.cloneElement(children, { onClick }) : <button onClick={onClick}>{children}</button>;
}
