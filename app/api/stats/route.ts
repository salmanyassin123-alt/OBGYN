import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// الصفحة دي بيانات لحظية بتتغير باستمرار، فمينفعش Next.js يخزنها (cache)
export const dynamic = "force-dynamic";

function startEndOfDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function groupCount(items: { key: string }[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    result[item.key] = (result[item.key] ?? 0) + 1;
  }
  return result;
}

// GET: إحصائيات يومية أو شهرية للوحة الدكتور
// /api/stats?period=daily&date=2026-07-08
// /api/stats?period=monthly&month=2026-07
export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") ?? "daily";

  if (period === "monthly") {
    const monthParam = req.nextUrl.searchParams.get("month");
    const base = monthParam ? new Date(`${monthParam}-01T00:00:00`) : new Date();
    const startOfMonth = new Date(base.getFullYear(), base.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: { scheduledDate: { gte: startOfMonth, lte: endOfMonth } },
      select: { status: true, bookingSource: true, patientUserId: true, scheduledDate: true },
    });

    const visits = await prisma.visit.findMany({
      where: { visitDate: { gte: startOfMonth, lte: endOfMonth } },
      select: { visitType: true },
    });

    const byStatus = groupCount(appointments.map((a) => ({ key: a.status })));
    const bySource = groupCount(appointments.map((a) => ({ key: a.bookingSource })));
    const byVisitType = groupCount(visits.map((v) => ({ key: v.visitType })));

    // مريضة جديدة = أول مرة تحجز فيها على الإطلاق كانت في الشهر ده
    const uniquePatientIds = Array.from(new Set(appointments.map((a) => a.patientUserId)));
    let newPatients = 0;
    for (const patientId of uniquePatientIds) {
      const earliest = await prisma.appointment.findFirst({
        where: { patientUserId: patientId },
        orderBy: { scheduledDate: "asc" },
        select: { scheduledDate: true },
      });
      if (earliest && earliest.scheduledDate >= startOfMonth && earliest.scheduledDate <= endOfMonth) {
        newPatients += 1;
      }
    }
    const returningPatients = uniquePatientIds.length - newPatients;

    const daysInMonth = endOfMonth.getDate();
    const dailyCounts = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const count = appointments.filter((a) => {
        const d = new Date(a.scheduledDate);
        return d.getDate() === day && d.getMonth() === base.getMonth() && d.getFullYear() === base.getFullYear();
      }).length;
      return { date: dateStr, count };
    });

    return NextResponse.json({
      period: "monthly",
      month: monthParam ?? `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`,
      total: appointments.length,
      byStatus,
      bySource,
      byVisitType,
      newPatients,
      returningPatients,
      dailyCounts,
    });
  }

  // ===== يومي (الافتراضي) =====
  const dateParam = req.nextUrl.searchParams.get("date");
  const base = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
  const { start, end } = startEndOfDay(base);

  const appointments = await prisma.appointment.findMany({
    where: { scheduledDate: { gte: start, lte: end } },
    select: {
      status: true,
      bookingSource: true,
      priority: true,
      checkedInAt: true,
      calledAt: true,
    },
  });

  const byStatus = groupCount(appointments.map((a) => ({ key: a.status })));
  const bySource = groupCount(appointments.map((a) => ({ key: a.bookingSource })));
  const byPriority = groupCount(appointments.map((a) => ({ key: a.priority })));

  const waitTimes = appointments
    .filter((a) => a.checkedInAt && a.calledAt)
    .map((a) => (a.calledAt!.getTime() - a.checkedInAt!.getTime()) / 60000);

  const avgWaitMinutes =
    waitTimes.length > 0 ? Math.round(waitTimes.reduce((sum, m) => sum + m, 0) / waitTimes.length) : null;

  return NextResponse.json({
    period: "daily",
    date: dateParam ?? start.toISOString().slice(0, 10),
    total: appointments.length,
    byStatus,
    bySource,
    byPriority,
    avgWaitMinutes,
  });
}
