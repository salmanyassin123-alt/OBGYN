import { NextRequest, NextResponse } from "next/server";

// بقى فيه باسورد منفصل للدكتور عن الريسبشن، عشان صفحات/بيانات زي
// الإحصائيات تفضل حصرية للدكتور فقط ومتوصلش للريسبشن حتى لو عنده الباسورد بتاعه.
//
// لازم تضيف في متغيرات البيئة (Vercel):
//   DOCTOR_PASSWORD=...      -> باسورد الدكتور (بيفتح لوحة الدكتور + الإحصائيات)
//   RECEPTION_PASSWORD=...   -> باسورد الريسبشن (بيفتح لوحة الريسبشن بس)
// لو عندك STAFF_PASSWORD قديم متظبطش، هيفضل شغال كباسورد للريسبشن فقط لحد
// ما تضيف RECEPTION_PASSWORD الجديد.
export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const doctorPassword = process.env.DOCTOR_PASSWORD;
  const receptionPassword = process.env.RECEPTION_PASSWORD || process.env.STAFF_PASSWORD;

  let role: "doctor" | "reception" | null = null;
  if (password && doctorPassword && password === doctorPassword) {
    role = "doctor";
  } else if (password && receptionPassword && password === receptionPassword) {
    role = "reception";
  }

  if (!role) {
    return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, role });
  res.cookies.set("staff_session", role, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 12, // 12 ساعة
    path: "/",
  });
  return res;
}
