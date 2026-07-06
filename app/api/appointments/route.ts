import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getNextQueueNumber, estimateWaitMinutes } from "@/lib/queue";

// GET: جلب حجوزات يوم معين (للعرض في شاشة الانتظار أو لوحة الريسبشن)
export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await prisma.appointment.findMany({
    where: { scheduledDate: { gte: startOfDay, lte: endOfDay } },
    orderBy: { queueNumber: "asc" },
    include: {
      patient: {
        select: { name: true, phone: true, patientProfile: { select: { privacyMode: true } } },
      },
    },
  });

  // إخفاء الاسم لو privacyMode مفعّل
  const sanitized = appointments.map((a) => ({
    ...a,
    patient: {
      ...a.patient,
      name: a.patient.patientProfile?.privacyMode ? `مريضة رقم ${a.queueNumber}` : a.patient.name,
    },
  }));

  return NextResponse.json(sanitized);
}

// POST: إنشاء حجز جديد
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { patientUserId, scheduledDate, bookingSource, priority } = body;

  if (!patientUserId || !scheduledDate || !bookingSource) {
    return NextResponse.json(
      { error: "الحقول المطلوبة: patientUserId, scheduledDate, bookingSource" },
      { status: 400 }
    );
  }

  const date = new Date(scheduledDate);
  const queueNumber = await getNextQueueNumber(date);

  const appointment = await prisma.appointment.create({
    data: {
      patientUserId,
      scheduledDate: date,
      bookingSource,
      priority: priority ?? "NORMAL",
      queueNumber,
      status: "WAITING",
    },
  });

  const estimatedMinutes = await estimateWaitMinutes(appointment.id);
  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { estimatedTime: new Date(Date.now() + estimatedMinutes * 60000) },
  });

  return NextResponse.json(updated, { status: 201 });
}
