import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ROLES, DEFAULT_SLA_CONFIG } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { name, orgName, email, password } = await request.json();

    if (!name || !orgName || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const authUserId = authData.user.id;

    const org = await prisma.organization.create({
      data: { name: orgName },
    });

    const roles = await Promise.all(
      DEFAULT_ROLES.map((role) =>
        prisma.role.create({
          data: {
            orgId: org.id,
            name: role.name,
            description: role.description,
            permissions: role.permissions,
            isSystemRole: role.isSystemRole,
          },
        })
      )
    );

    const ownerRole = roles.find((r) => r.name === "owner")!;

    await prisma.user.create({
      data: {
        id: authUserId,
        orgId: org.id,
        email,
        name,
        roleId: ownerRole.id,
      },
    });

    await prisma.orgMembership.create({
      data: {
        userId: authUserId,
        orgId: org.id,
        roleId: ownerRole.id,
      },
    });

    await prisma.slaConfig.create({
      data: {
        orgId: org.id,
        priority: DEFAULT_SLA_CONFIG.priority,
        firstResponseMinutes: DEFAULT_SLA_CONFIG.responseMinutes,
        resolutionMinutes: 0,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
