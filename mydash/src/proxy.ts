import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="My Apps"' },
  });
}

export function proxy(request: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) {
    return new NextResponse("DASHBOARD_PASSWORD is not configured.", {
      status: 500,
    });
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) {
    return unauthorized();
  }

  let decoded: string;
  try {
    decoded = Buffer.from(header.slice("Basic ".length), "base64").toString(
      "utf-8"
    );
  } catch {
    return unauthorized();
  }

  // Username is ignored — only the password (everything after the first
  // colon) is checked, so any username works as documented.
  const providedPassword = decoded.slice(decoded.indexOf(":") + 1);

  if (providedPassword === password) {
    return NextResponse.next();
  }

  return unauthorized();
}

export const config = {
  matcher: "/:path*",
};
