"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Org {
  id: string;
  name: string;
  plan: string;
  role: string;
}

interface Props {
  currentOrgId: string;
  currentOrgName: string;
}

export function OrgSwitcher({ currentOrgId, currentOrgName }: Props) {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchOrgs = useCallback(async () => {
    const res = await fetch("/api/orgs");
    if (res.ok) {
      const data = await res.json();
      setOrgs(data.organizations);
    }
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  async function switchOrg(orgId: string) {
    if (orgId === currentOrgId) return;
    setLoading(true);
    const res = await fetch("/api/orgs/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId }),
    });
    if (res.ok) {
      window.location.href = "/inbox";
    }
    setLoading(false);
  }

  async function createOrg() {
    if (!newOrgName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newOrgName.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewOrgName("");
      setShowCreate(false);
      await switchOrg(data.id);
    }
    setCreating(false);
  }

  if (orgs.length <= 1 && !showCreate) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-md px-1 py-1 text-sm transition-colors hover:bg-muted">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary shrink-0">
            <Building2 className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="truncate text-sm font-semibold tracking-tight">{currentOrgName}</span>
          <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            {currentOrgName}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            สร้างองค์กรใหม่
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-md px-1 py-1 text-sm transition-colors hover:bg-muted">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary shrink-0">
            <Building2 className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="truncate text-sm font-semibold tracking-tight">{currentOrgName}</span>
          <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {orgs.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => switchOrg(org.id)}
              disabled={loading}
              className={cn(org.id === currentOrgId && "bg-muted")}
            >
              <Building2 className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{org.name}</span>
              {org.id === currentOrgId && (
                <Check className="ml-auto h-4 w-4 shrink-0 text-accent" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            สร้างองค์กรใหม่
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) setNewOrgName(""); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>สร้างองค์กรใหม่</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">เพิ่มธุรกิจ/องค์กรใหม่เพื่อจัดการแยกต่างหาก</p>
          <Input
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            placeholder="ชื่อองค์กร"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && createOrg()}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowCreate(false); setNewOrgName(""); }}
            >
              ยกเลิก
            </Button>
            <Button
              size="sm"
              onClick={createOrg}
              disabled={creating || !newOrgName.trim()}
            >
              {creating ? "กำลังสร้าง..." : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
