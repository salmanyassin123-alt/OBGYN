import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffRole } from "@/lib/auth";

function startEndOfDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function startEndOfMonth(year: number, monthIndex0: number) {
  const start = new Date(year, monthIndex0, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex0 + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// GET /api/stats?period=daily&date=YYYY-MM-DD
// GET /api/stats?period=monthly&month=YYYY-MM
// إحصائيات خاصة بالدكتور فقط - محمية بالميدل وير وكمان بفحص الدور هنا للأمان
export async function GET(req: NextRequest) {
  const role = getStaffRole();
  if (role !== "doctor") {
    return NextResponse.json({ error: "الإحصائيات متاحة للدكتور فقط" }, { status: 403 });
  }

  const period = req.nextUrl.searchParams.get("period") === "monthly" ? "monthly" : "daily";

  if (period === "daily") {
    const dateParam = req.nextUrl.searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();
    const { start, end } = startEndOfDay(date);

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

    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = { ONLINE: 0, WALK_IN: 0 };
    const byPriority: Record<string, number> = {};
    let waitSampleCount = 0;
    let waitSampleTotalMinutes = 0;

    for (const a of appointments) {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      bySource[a.bookingSource] = (bySource[a.bookingSource] || 0) + 1;
      byPriority[a.priority] = (byPriority[a.priority] || 0) + 1;
      if (a.checkedInAt && a.calledAt) {
        waitSampleCount += 1;
        waitSampleTotalMinutes += (a.calledAt.getTime() - a.checkedInAt.getTime()) / 60000;
      }
    }

    return NextResponse.json({
      period: "daily",
      date: toDateKey(date),
      total: appointments.length,
      byStatus,
      bySource,
      byPriority,
      avgWaitMinutes: waitSampleCount > 0 ? Math.round(waitSampleTotalMinutes / waitSampleCount) : null,
    });
  }

  // ===== شهري =====
  const monthParam = req.nextUrl.searchParams.get("month"); // format YYYY-MM
  const now = new Date();
  const [year, monthNum] = monthParam
    ? monthParam.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];
  const monthIndex0 = (monthNum || now.getMonth() + 1) - 1;
  const { start, end } = startEndOfMonth(year || now.getFullYear(), monthIndex0);

  const appointments = await prisma.appointment.findMany({
    where: { scheduledDate: { gte: start, lte: end } },
    select: {
      patientUserId: true,
      status: true,
      bookingSource: true,
      scheduledDate: true,
    },
  });

  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = { ONLINE: 0, WALK_IN: 0 };
  const dailyCountsMap: Record<string, number> = {};

  for (const a of appointments) {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    bySource[a.bookingSource] = (bySource[a.bookingSource] || 0) + 1;
    const key = toDateKey(a.scheduledDate);
    dailyCountsMap[key] = (dailyCountsMap[key] || 0) + 1;
  }

  const dailyCounts = Object.entries(dailyCountsMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // توزيع أنواع الزيارات (من سجل Visit الفعلي، مش الحجز)
  const visits = await prisma.visit.findMany({
    where: { visitDate: { gte: start, lte: end } },
    select: { visitType: true },
  });
  const byVisitType: Record<string, number> = {};
  for (const v of visits) {
    byVisitType[v.visitType] = (byVisitType[v.visitType] || 0) + 1;
  }

  // مريضات جدد مقابل متابعات: بنجيب أول موعد على الإطلاق لكل مريضة ظهرت الشهر ده
  const activePatientIds = Array.from(new Set(appointments.map((a) => a.patientUserId)));
  let newPatients = 0;
  let returningPatients = 0;

  if (activePatientIds.length > 0) {
    const firstAppointments = await prisma.appointment.groupBy({
      by: ["patientUserId"],
      where: { patientUserId: { in: activePatientIds } },
      _min: { scheduledDate: true },
    });
    for (const fa of firstAppointments) {
      const firstDate = fa._min.scheduledDate;
      if (firstDate && firstDate >= start && firstDate <= end) {
        newPatients += 1;
      } else {
        returningPatients += 1;
      }
    }
  }

  return NextResponse.json({
    period: "monthly",
    month: `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`,
    total: appointments.length,
    byStatus,
    bySource,
    byVisitType,
    newPatients,
    returningPatients,
    dailyCounts,
  });
}
