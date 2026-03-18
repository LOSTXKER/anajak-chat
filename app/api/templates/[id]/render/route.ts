import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const POST = apiHandler(async (req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const { contactId, conversationId, orderId } = (await req.json()) as {
    contactId?: string;
    conversationId?: string;
    orderId?: string;
  };

  const template = await prisma.quickReplyTemplate.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!template) return jsonError("Template not found", 404);

  const vars: Record<string, string> = {};

  if (contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, orgId: user.orgId },
    });
    if (contact) {
      vars["customer_name"] = contact.displayName ?? "";
      vars["phone"] = contact.phone ?? "";
      vars["email"] = contact.email ?? "";
    }
  }

  if (orderId) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, orgId: user.orgId },
    });
    if (order) {
      vars["order_id"] = order.orderNumber ?? order.id;
      vars["amount"] = String(order.amount);
      vars["order_status"] = order.status;
      const erpId = order.erpOrderId;
      if (erpId) vars["erp_order_id"] = erpId;
    }
  }

  if (conversationId) {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, orgId: user.orgId },
      include: { contact: { select: { displayName: true, phone: true, email: true } } },
    });
    if (conv) {
      if (!vars["customer_name"] && conv.contact.displayName) {
        vars["customer_name"] = conv.contact.displayName;
      }
      if (!vars["phone"] && conv.contact.phone) vars["phone"] = conv.contact.phone;
      if (!vars["email"] && conv.contact.email) vars["email"] = conv.contact.email;
    }
  }

  let rendered = template.content;
  for (const [key, value] of Object.entries(vars)) {
    rendered = rendered.replaceAll(`{${key}}`, value);
  }

  return NextResponse.json({ rendered, variables: vars });
});
