import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import type { KbCategory } from "@/lib/generated/prisma/client";

const VALID_CATEGORIES: KbCategory[] = ["faq", "product", "policy", "promotion", "store_info", "other"];

export const POST = apiHandler(async (request) => {
  const user = await requireAuth();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return jsonError("file required", 400);

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: "CSV parse error", details: parsed.errors }, { status: 400 });
  }

  const rows = parsed.data;
  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const title = (row.title ?? row.Title ?? "").trim();
    const content = (row.content ?? row.Content ?? row.body ?? row.Body ?? "").trim();
    if (!title || !content) { skipped++; continue; }

    const rawCat = (row.category ?? row.Category ?? "faq").toLowerCase().replace(/ /g, "_") as KbCategory;
    const category: KbCategory = VALID_CATEGORIES.includes(rawCat) ? rawCat : "other";
    const tags = (row.tags ?? row.Tags ?? "").split(",").map((t) => t.trim()).filter(Boolean);

    await prisma.knowledgeArticle.create({
      data: {
        orgId: user.orgId,
        title,
        content,
        category,
        tags,
        createdBy: user.id,
      },
    });
    imported++;
  }

  return NextResponse.json({ imported, skipped, total: rows.length });
});
