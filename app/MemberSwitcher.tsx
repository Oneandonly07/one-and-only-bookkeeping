// app/MemberSwitcher.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Opt = { id: number; name: string };

const STORAGE_KEY = "oneonly:lastMemberId";

export default function MemberSwitcher() {
  const [options, setOptions] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const qs = useSearchParams();

  const currentMember = useMemo(() => {
    const fromUrl = Number(qs.get("member") ?? NaN);
    if (!Number.isNaN(fromUrl)) return String(fromUrl);
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    return fromStorage ?? "";
  }, [qs]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/members", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load members");
        if (active) setOptions(json.data as Opt[]);
      } catch {
        if (active) setOptions([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // If no ?member and we have a remembered one, push it into the URL
  useEffect(() => {
    if (!loading && !qs.get("member")) {
      const remembered = localStorage.getItem(STORAGE_KEY);
      if (remembered) {
        const params = new URLSearchParams(qs.toString());
        params.set("member", remembered);
        router.replace(`${pathname}?${params.toString()}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const onChange = (id: string) => {
    const params = new URLSearchParams(qs.toString());
    if (id) params.set("member", id);
    else params.delete("member");
    localStorage.setItem(STORAGE_KEY, id);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">Member</label>
      <select
        value={currentMember}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded-lg px-2 py-1 text-sm"
        disabled={loading}
        title="Filter data by member"
      >
        {loading ? (
          <option>Loading…</option>
        ) : options.length === 0 ? (
          <option value="">No members</option>
        ) : (
          options.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
