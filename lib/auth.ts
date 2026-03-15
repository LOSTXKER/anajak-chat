import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

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
