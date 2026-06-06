import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - session-reset (must always load clean — no cookies sent — to break the 494 loop)
     */
    "/((?!_next/static|_next/image|favicon.ico|session-reset|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
