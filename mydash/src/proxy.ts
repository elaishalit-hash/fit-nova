import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) {
    return new NextResponse("DASHBOARD_PASSWORD is not configured.", {
      status: 500,
    });
  }

  const expected =
    "Basic " + Buffer.from(`dash:${password}`).toString("base64");
  const provided = request.headers.get("authorization");

  if (provided === expected) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="My Apps"' },
  });
}

export const config = {
  matcher: "/:path*",
};
