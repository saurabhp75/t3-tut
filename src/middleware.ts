import { withClerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
// import { ClassRegistry } from "superjson/dist/class-registry";
// import type { NextRequest } from "next/server";

export default withClerkMiddleware(() => {
  // console.log("middleware ran");
  return NextResponse.next();
});

// Stop Middleware running on static files
export const config = {
  matcher: "/((?!_next/image|_next/static|favicon.ico).*)",
};
