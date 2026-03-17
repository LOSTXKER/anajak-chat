import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, apiHandler, searchParams } from "@/lib/api-helpers";
import * as XLSX from "xlsx";

export const GET = apiHandler(async (request, { params }) => {
  const user = await requireAuth();
  const { id } = await params;
  const sp = searchParams(request);
  const format = sp.get("format") ?? "excel";

  const conversation = await prisma.conversation.findFirst({
    where: { id, orgId: user.orgId },
    include: {
      contact: { select: { displayName: true, platformId: true, platform: true } },
      channel: { select: { name: true } },
    },
  });

  if (!conversation) return jsonError("Not found", 404);

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    select: {
      senderType: true,
      content: true,
      contentType: true,
      mediaUrl: true,
      createdAt: true,
    },
  });

  const contactName = conversation.contact.displayName ?? conversation.contact.platformId;

  const rows = messages.map((m) => ({
    "วันที่": new Date(m.createdAt).toLocaleString("th-TH"),
    "ผู้ส่ง": m.senderType === "contact" ? contactName : m.senderType === "agent" ? "เจ้าหน้าที่" : m.senderType,
    "ประเภท": m.contentType,
    "ข้อความ": m.content ?? "",
    "สื่อ": m.mediaUrl ?? "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  ws["!cols"] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 10 },
    { wch: 60 },
    { wch: 40 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Messages");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `chat-${contactName}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
});
