import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ROLES } from "@/lib/constants";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  try {
    const authUser = await getAuthUser();
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
  } catch (err) {
    console.error("[orgs GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
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
  } catch (err) {
    console.error("[orgs POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
