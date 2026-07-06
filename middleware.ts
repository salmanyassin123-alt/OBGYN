import { NextRequest, NextResponse } from "next/server";

// الصفحات اللي محتاجة تسجيل دخول موظف (ريسبشن أو دكتور)
const PROTECTED_PREFIXES = ["/reception", "/doctor", "/api/stats"];

export function middleware(req: NextRequest) {
  const isProtected = PROTECTED_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const role = req.cookies.get("staff_session")?.value;
  const isStaff = role === "doctor" || role === "reception";

  if (!isStaff) {
    // الـ API (زي الإحصائيات) يرجع 401 بدل ما يعمل redirect لصفحة الدخول
    if (req.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // لوحة الدكتور والإحصائيات حصرية على دور "دكتور" فقط
  const doctorOnly = req.nextUrl.pathname.startsWith("/doctor") || req.nextUrl.pathname.startsWith("/api/stats");
  if (doctorOnly && role !== "doctor") {
    if (req.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "الإحصائيات متاحة للدكتور فقط" }, { status: 403 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/reception/:path*", "/doctor/:path*", "/api/stats/:path*"],
};
