import * as React from "react";
import { cn } from "@/lib/utils";

type Ctx = {
  value: string;
  setValue: (v: string) => void;
  onValueChange?: (v: string) => void;
};
const SelectCtx = React.createContext<Ctx | null>(null);

export function Select({
  value,
  onValueChange,
  defaultValue,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
}) {
  const [val, setVal] = React.useState(defaultValue ?? "");
  const controlled = typeof value === "string";
  const cur = controlled ? (value as string) : val;
  const setValue = (v: string) => {
    if (!controlled) setVal(v);
    onValueChange?.(v);
  };
  return (
    <SelectCtx.Provider value={{ value: cur, setValue, onValueChange }}>
      <div className="relative">{children}</div>
    </SelectCtx.Provider>
  );
}

export function SelectTrigger({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const ctx = React.useContext(SelectCtx)!;
  return (
    <button
      type="button"
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm",
        className
      )}
      aria-label="Select"
      title={ctx.value}
    >
      <span className="truncate">{children}</span>
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = React.useContext(SelectCtx)!;
  return <span className={cn(!ctx.value && "text-gray-500")}>{ctx.value || placeholder || ""}</span>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <div className="mt-1">{children}</div>;
}

export function SelectItem({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(SelectCtx)!;
  const selected = ctx.value === value;
  return (
    <button
      type="button"
      className={cn(
        "block w-full rounded-md border px-3 py-2 text-left text-sm",
        selected ? "bg-gray-100" : "bg-white hover:bg-gray-50"
      )}
      onClick={() => ctx.setValue(value)}
    >
      {children}
    </button>
  );
}
