"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, orgName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "เกิดข้อผิดพลาด");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-xl font-semibold">สมัครใช้งาน</h1>
        <p className="mt-1 text-sm text-muted-foreground">สร้างบัญชีใหม่เพื่อเริ่มใช้งาน</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="orgName" className="text-sm">ชื่อองค์กร / ร้านค้า</Label>
          <Input id="orgName" placeholder="My Shop" value={orgName} onChange={(e) => setOrgName(e.target.value)} required className="h-10 rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm">ชื่อผู้ใช้</Label>
          <Input id="name" placeholder="สมชาย" value={name} onChange={(e) => setName(e.target.value)} required className="h-10 rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm">อีเมล</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm">รหัสผ่าน</Label>
          <Input id="password" type="password" placeholder="อย่างน้อย 6 ตัวอักษร" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required className="h-10 rounded-lg" />
        </div>
        <Button type="submit" className="w-full h-10 rounded-lg" disabled={loading}>
          {loading ? "กำลังสร้างบัญชี..." : "สมัครใช้งาน"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4 hover:text-foreground/80">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
