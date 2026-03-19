"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
export default function GeneralSettingsPage() {
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/organizations")
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setOrgName(data.name);
      })
      .catch((e) => console.error("[Settings] org fetch error:", e));
  }, []);

  async function handleSave() {
    setLoading(true);
    setSaved(false);
    try {
      await fetch("/api/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // handle error
    }
    setLoading(false);
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <h1 className="heading-page">ทั่วไป</h1>
          <p className="text-sm text-muted-foreground">ตั้งค่าองค์กร</p>
        </div>

      <Card className="rounded-xl border border-border/60 shadow-none p-6 md:p-8 [&>[data-slot=card-header]]:px-0 [&>[data-slot=card-header]]:pt-0 [&>[data-slot=card-content]]:px-0 [&>[data-slot=card-footer]]:px-0 [&>[data-slot=card-footer]]:pb-0">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="heading-page">ข้อมูลองค์กร</CardTitle>
          <CardDescription className="text-sm">
            ชื่อและข้อมูลพื้นฐานขององค์กร
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="orgName">ชื่อองค์กร</Label>
            <Input
              id="orgName"
              className="rounded-lg"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              className="rounded-lg"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
            {saved && (
              <span className="text-sm text-primary">บันทึกแล้ว</span>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
