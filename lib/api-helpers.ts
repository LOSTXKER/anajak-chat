import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";

type AuthUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

class ApiError {
  constructor(
    public message: string,
    public status: number
  ) {}

  toResponse() {
    return NextResponse.json({ error: this.message }, { status: this.status });
  }
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError("Unauthorized", 401);
  return user;
}

export function requirePermission(user: AuthUser, permission: string) {
  const permissions = user.role.permissions as string[];
  if (!hasPermission(permissions, permission)) {
    throw new ApiError("Forbidden", 403);
  }
}

export function parsePagination(request: NextRequest | Request, defaults?: { limit?: number }) {
  const url = request instanceof NextRequest ? request.nextUrl : new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") ?? String(defaults?.limit ?? 20))));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function searchParams(request: NextRequest | Request) {
  return request instanceof NextRequest
    ? request.nextUrl.searchParams
    : new URL(request.url).searchParams;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteContext = { params: any };

/**
 * Wraps an API handler to automatically catch ApiError and return JSON responses.
 */
export function apiHandler(
  handler: (request: NextRequest, context: RouteContext) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      return await handler(request, context);
    } catch (err) {
      if (err instanceof ApiError) return err.toResponse();
      throw err;
    }
  };
}
