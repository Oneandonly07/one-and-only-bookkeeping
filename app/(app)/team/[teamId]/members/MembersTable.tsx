"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

type Member = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  joinedAt: string; // ISO string
};

type MembersTableProps = {
  teamId: string;
  className?: string;
};

const ROLE_OPTIONS: { label: string; value: Role }[] = [
  { label: "Owner", value: "OWNER" },
  { label: "Admin", value: "ADMIN" },
  { label: "Member", value: "MEMBER" },
  { label: "Viewer", value: "VIEWER" },
];

const roleBadgeClass: Record<Role, string> = {
  OWNER:
    "border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-50/80 dark:text-amber-300",
  ADMIN:
    "border-violet-300 text-violet-800 bg-violet-50 hover:bg-violet-50/80 dark:text-violet-300",
  MEMBER:
    "border-blue-300 text-blue-800 bg-blue-50 hover:bg-blue-50/80 dark:text-blue-300",
  VIEWER:
    "border-slate-300 text-slate-800 bg-slate-50 hover:bg-slate-50/80 dark:text-slate-300",
};

function RoleBadge({ role }: { role: Role }) {
  const label =
    ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role.toLowerCase();
  return <Badge className={cn("border", roleBadgeClass[role])}>{label}</Badge>;
}

type SortKey = "name" | "role" | "joinedAt";
type SortDir = "asc" | "desc";

export default function MembersTable({ teamId, className }: MembersTableProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("joinedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("MEMBER");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/team/members?teamId=${teamId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Failed to load members (${res.status})`);
        const data: Member[] = await res.json();
        if (!ignore) setMembers(data);
      } catch (e: any) {
        if (!ignore) setError(e.message || "Failed to load members");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [teamId]);

  const filtered = useMemo(() => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    return members.filter((m) => {
      if (roleFilter !== "ALL" && m.role !== roleFilter) return false;
      if (start || end) {
        const j = new Date(m.joinedAt);
        if (start && j < start) return false;
        if (end) {
          const endInclusive = new Date(end);
          endInclusive.setHours(23, 59, 59, 999);
          if (j > endInclusive) return false;
        }
      }
      return true;
    });
  }, [members, roleFilter, startDate, endDate]);

  const sorted = useMemo(() => {
    const data = [...filtered];
    data.sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";

      if (sortKey === "name") {
        va = (a.name || a.email || "").toLowerCase();
        vb = (b.name || b.email || "").toLowerCase();
      } else if (sortKey === "role") {
        const order: Role[] = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];
        va = order.indexOf(a.role);
        vb = order.indexOf(b.role);
      } else if (sortKey === "joinedAt") {
        va = new Date(a.joinedAt).getTime();
        vb = new Date(b.joinedAt).getTime();
      }

      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page]);

  // Reset to page 1 whenever filters/sorts change
  useEffect(() => {
    setPage(1);
  }, [roleFilter, startDate, endDate, sortKey, sortDir]);

  async function onInvite() {
    setInviteError(null);
    setInviteSuccess(null);
    if (!inviteEmail) {
      setInviteError("Please enter an email.");
      return;
    }
    setInviteLoading(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          email: inviteEmail,
          role: inviteRole,
        }),
      });
      if (!res.ok) {
        const msg = await safeJsonMessage(res);
        throw new Error(msg || `Invite failed (${res.status})`);
      }
      setInviteSuccess("Invitation sent.");
      setInviteEmail("");
      setInviteRole("MEMBER");
    } catch (e: any) {
      setInviteError(e.message || "Failed to send invite");
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            Team Members
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your workspace members, roles, and invitations.
          </p>
        </div>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl">Invite Member</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite a member</DialogTitle>
              <DialogDescription>
                Send an email invite to join this team.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  placeholder="name@example.com"
                  type="email"
                  value={inviteEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setInviteEmail(e.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v: string) => setInviteRole(v as Role)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {inviteError && (
                <p className="text-sm text-red-600">{inviteError}</p>
              )}
              {inviteSuccess && (
                <p className="text-sm text-green-600">{inviteSuccess}</p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={onInvite} disabled={inviteLoading}>
                {inviteLoading ? "Sending…" : "Send Invite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 gap-2 rounded-2xl border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-1">
          <Label>Role</Label>
          <Select
            value={roleFilter}
            onValueChange={(v: string) => setRoleFilter(v as Role | "ALL")}
          >
            <SelectTrigger>
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1">
          <Label>Sort by</Label>
          <div className="flex gap-2">
            <Select
              value={sortKey}
              onValueChange={(v: string) => setSortKey(v as SortKey)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="joinedAt">Joined</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortDir}
              onValueChange={(v: string) => setSortDir(v as SortDir)}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Asc</SelectItem>
                <SelectItem value="desc">Desc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-1">
          <Label>Joined (start)</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setStartDate(e.target.value)
            }
          />
        </div>

        <div className="grid gap-1">
          <Label>Joined (end)</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEndDate(e.target.value)
            }
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Member</TableHead>
              <TableHead className="w-[20%]">Role</TableHead>
              <TableHead className="w-[20%]">Joined</TableHead>
              <TableHead className="w-[20%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <SkeletonRows />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-red-600">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLoading(true);
                        setTimeout(() => setLoading(false), 10);
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : pageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No members found with the current filters.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <AvatarFallbackCircle text={displayInitials(m)} />
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {m.name || m.email}
                        </div>
                        <div className="truncate text-sm text-muted-foreground">
                          {m.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={m.role} />
                  </TableCell>
                  <TableCell>
                    {new Date(m.joinedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendInvite(m.email, teamId)}
                    >
                      Resend invite
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages} · {sorted.length} total
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Helper components & utilities */

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell colSpan={4}>
            <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function AvatarFallbackCircle({ text }: { text: string }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted text-xs font-semibold uppercase">
      {text}
    </div>
  );
}

function displayInitials(m: Member) {
  const base = m.name || m.email || "U";
  const parts = base
    .replace(/@.*/, "")
    .split(/[.\s_-]+/)
    .filter(Boolean);
  const initials =
    parts.length >= 2 ? parts[0][0] + parts[1][0] : base.slice(0, 2);
  return initials.toUpperCase();
}

async function handleResendInvite(email: string, teamId: string) {
  try {
    const res = await fetch("/api/team/invite/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, teamId }),
    });
    if (!res.ok) {
      const msg = await safeJsonMessage(res);
      throw new Error(msg || "Failed to resend invite");
    }
    console.log("Invite resent");
  } catch (e) {
    console.error(e);
  }
}

async function safeJsonMessage(res: Response) {
  try {
    const data = await res.json();
    return (data as any)?.message || (data as any)?.error || "";
  } catch {
    return "";
  }
}
