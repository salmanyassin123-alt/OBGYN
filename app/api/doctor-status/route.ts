import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWhatsAppMessage, messageTemplates } from "@/lib/whatsapp";
import { refreshEstimatesForDay } from "@/lib/queue";

// GET: جلب حالة الدكتور الحالية (تُستخدم في شاشة الانتظار وصفحة الحجز)
export async function GET() {
  const status = await prisma.doctorStatus.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", status: "AVAILABLE" },
  });
  return NextResponse.json(status);
}

// PATCH: الريسبشن تغيّر حالة الدكتور
// status: AVAILABLE | UNAVAILABLE | IN_SURGERY | EMERGENCY
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { status, delayMinutes, note } = body;

  if (!status) {
    return NextResponse.json({ error: "الحقل status مطلوب" }, { status: 400 });
  }

  const updated = await prisma.doctorStatus.upsert({
    where: { id: "singleton" },
    update: { status, note },
    create: { id: "singleton", status, note },
  });

  const today = new Date();

  if (status === "AVAILABLE") {
    // إغلاق أي أحداث تأخير/طوارئ مفتوحة لما الدكتور يرجع متاح
    await prisma.clinicEvent.updateMany({
      where: { resolvedAt: null },
      data: { resolvedAt: new Date() },
    });
    await refreshEstimatesForDay(today);
    return NextResponse.json(updated);
  }

  // تسجيل حدث مرتبط وإبلاغ المنتظرين لو فيه تأخير فعلي
  const eventType =
    status === "EMERGENCY" ? "EMERGENCY_CASE" : status === "IN_SURGERY" ? "BREAK" : "DOCTOR_DELAY";

  const event = await prisma.clinicEvent.create({
    data: { type: eventType, delayMinutes: delayMinutes ?? 20, note },
  });

  await refreshEstimatesForDay(today);

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const waitingList = await prisma.appointment.findMany({
    where: {
      scheduledDate: { gte: startOfDay, lte: endOfDay },
      status: { in: ["WAITING", "CALLED"] },
    },
    include: { patient: true },
  });

  const messageMap: Record<string, string> = {
    UNAVAILABLE: `الدكتور غير متواجد حاليًا. برجاء الانتظار، سيتم إبلاغكم فور عودته.`,
    IN_SURGERY: `الدكتور داخل عملية حاليًا. الوقت المتوقع للانتظار قد يزيد قليلًا.`,
    EMERGENCY: messageTemplates.delayAlert(delayMinutes ?? 20),
  };

  for (const appt of waitingList) {
    try {
      await sendWhatsAppMessage(appt.patient.phone, messageMap[status] ?? messageMap.UNAVAILABLE);
    } catch (err) {
      console.error("تعذر إرسال التنبيه:", err);
    }
  }

  return NextResponse.json({ status: updated, event });
}
