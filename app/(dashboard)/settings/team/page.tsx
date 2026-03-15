"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: { id: string; name: string };
}

interface Role {
  id: string;
  name: string;
}

export default function TeamSettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const loadData = useCallback(async () => {
    const [usersRes, rolesRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/roles"),
    ]);
    const usersData = await usersRes.json();
    const rolesData = await rolesRes.json();
    if (Array.isArray(usersData)) setUsers(usersData);
    if (Array.isArray(rolesData)) setRoles(rolesData);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError("");

    const res = await fetch("/api/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: inviteName,
        email: inviteEmail,
        password: invitePassword,
        roleId: inviteRoleId,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setInviteError(data.error || "เกิดข้อผิดพลาด");
      setInviteLoading(false);
      return;
    }

    setInviteName("");
    setInviteEmail("");
    setInvitePassword("");
    setInviteRoleId("");
    setInviteOpen(false);
    setInviteLoading(false);
    loadData();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ทีม</h1>
          <p className="text-sm text-muted-foreground">จัดการสมาชิกในทีม</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger render={<Button className="bg-foreground text-background hover:bg-foreground/90" />}>
            <UserPlus className="mr-2 h-4 w-4" />
            เพิ่มสมาชิก
          </DialogTrigger>
          <DialogContent className="rounded-xl">
            <DialogHeader>
              <DialogTitle>เพิ่มสมาชิกใหม่</DialogTitle>
              <DialogDescription>
                สร้างบัญชีใหม่สำหรับสมาชิกในทีม
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              {inviteError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {inviteError}
                </div>
              )}
              <div className="space-y-2">
                <Label>ชื่อ</Label>
                <Input
                  className="rounded-lg"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>อีเมล</Label>
                <Input
                  className="rounded-lg"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>รหัสผ่าน</Label>
                <Input
                  className="rounded-lg"
                  type="password"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>บทบาท</Label>
                <Select value={inviteRoleId} onValueChange={(v) => setInviteRoleId(v ?? "")}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="เลือกบทบาท" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles
                      .filter((r) => r.name !== "owner")
                      .map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90" disabled={inviteLoading}>
                {inviteLoading ? "กำลังสร้าง..." : "สร้างบัญชี"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-xl border">
        <CardHeader>
          <CardTitle>สมาชิกทั้งหมด</CardTitle>
          <CardDescription>{users.length} คน</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-full px-2 py-0.5 text-xs font-medium">
                    {user.role.name}
                  </span>
                  <Badge variant={user.isActive ? "default" : "outline"} className={user.isActive ? "bg-green-100 text-green-700 border-green-200" : ""}>
                    {user.isActive ? "Active" : "ไม่ใช้งาน"}
                  </Badge>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                ไม่มีข้อมูล
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
