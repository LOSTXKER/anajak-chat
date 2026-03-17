import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_ROLES = [
  { name: "owner", description: "Owner — full access", permissions: ["*"], isSystemRole: true },
  { name: "admin", description: "Admin — manage team, settings, reports", permissions: ["chat:view_all", "chat:assign", "chat:transfer", "contacts:view", "contacts:edit", "analytics:view", "settings:view", "settings:edit", "team:view", "team:invite"], isSystemRole: true },
  { name: "supervisor", description: "Supervisor — oversee team chats", permissions: ["chat:view_all", "chat:assign", "chat:transfer", "contacts:view", "contacts:edit", "analytics:view"], isSystemRole: true },
  { name: "agent", description: "Agent — handle assigned chats", permissions: ["chat:view_assigned", "chat:reply", "contacts:view", "contacts:edit"], isSystemRole: true },
];

export async function GET() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.orgMembership.findMany({
    where: { userId: authUser.id },
    include: {
      organization: { select: { id: true, name: true, plan: true } },
      role: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    organizations: memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      plan: m.organization.plan,
      role: m.role.name,
    })),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await request.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
  }

  const org = await prisma.organization.create({ data: { name: name.trim() } });

  const roles = await Promise.all(
    DEFAULT_ROLES.map((r) =>
      prisma.role.create({
        data: { orgId: org.id, name: r.name, description: r.description, permissions: r.permissions, isSystemRole: r.isSystemRole },
      })
    )
  );

  const ownerRole = roles.find((r) => r.name === "owner")!;

  await prisma.orgMembership.create({
    data: { userId: authUser.id, orgId: org.id, roleId: ownerRole.id },
  });

  return NextResponse.json({ id: org.id, name: org.name }, { status: 201 });
}
