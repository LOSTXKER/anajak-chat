import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const ACTIVE_ORG_COOKIE = "active_org_id";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  if (activeOrgId) {
    const membership = await prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId: authUser.id, orgId: activeOrgId } },
      include: {
        organization: true,
        role: true,
        user: true,
      },
    });

    if (membership) {
      return {
        id: membership.user.id,
        email: membership.user.email,
        name: membership.user.name,
        orgId: membership.orgId,
        roleId: membership.roleId,
        avatarUrl: membership.user.avatarUrl,
        isActive: membership.user.isActive,
        maxConcurrentChats: membership.user.maxConcurrentChats,
        createdAt: membership.user.createdAt,
        organization: membership.organization,
        role: membership.role,
      };
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      organization: true,
      role: true,
    },
  });

  return user;
}

export function hasPermission(
  permissions: string[] | unknown,
  required: string
): boolean {
  if (!Array.isArray(permissions)) return false;
  if (permissions.includes("*")) return true;
  return permissions.includes(required);
}
