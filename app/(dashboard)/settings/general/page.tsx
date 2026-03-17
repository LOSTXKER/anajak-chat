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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ทั่วไป</h1>
        <p className="text-sm text-muted-foreground">ตั้งค่าองค์กร</p>
      </div>

      <Card className="max-w-lg rounded-xl border">
        <CardHeader>
          <CardTitle>ข้อมูลองค์กร</CardTitle>
          <CardDescription>ชื่อและข้อมูลพื้นฐานขององค์กร</CardDescription>
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
              onClick={handleSave}
              disabled={loading}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
            {saved && (
              <span className="text-sm text-green-600 dark:text-green-400">บันทึกแล้ว</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
