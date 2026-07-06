import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getNextQueueNumber, estimateWaitMinutes } from "@/lib/queue";

// POST: تسجيل مريضة جديدة وإنشاء حجز لها في نفس الخطوة
// تستخدمها صفحة الحجز العامة (bookingSource: ONLINE) وصفحة الريسبشن (WALK_IN)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, bookingSource } = body;

  if (!name || !phone || !bookingSource) {
    return NextResponse.json(
      { error: "الحقول المطلوبة: name, phone, bookingSource" },
      { status: 400 }
    );
  }

  // تنظيف رقم الهاتف من مسافات أو رموز
  const cleanPhone = phone.replace(/\s|-/g, "");

  // البحث عن المريضة لو مسجلة قبل كده، أو إنشاء حساب جديد
  const user = await prisma.user.upsert({
    where: { phone: cleanPhone },
    update: { name },
    create: { name, phone: cleanPhone, role: "PATIENT" },
  });

  await prisma.patientProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  const today = new Date();
  const queueNumber = await getNextQueueNumber(today);

  const appointment = await prisma.appointment.create({
    data: {
      patientUserId: user.id,
      scheduledDate: today,
      bookingSource,
      queueNumber,
      status: "WAITING",
    },
  });

  const estimatedMinutes = await estimateWaitMinutes(appointment.id);

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const peopleAhead = await prisma.appointment.count({
    where: {
      scheduledDate: { gte: startOfDay, lte: endOfDay },
      status: { in: ["WAITING", "CALLED"] },
      queueNumber: { lt: queueNumber },
    },
  });

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { estimatedTime: new Date(Date.now() + estimatedMinutes * 60000) },
  });

  return NextResponse.json(
    {
      appointmentId: updated.id,
      queueNumber: updated.queueNumber,
      peopleAhead,
      estimatedMinutes,
    },
    { status: 201 }
  );
}
