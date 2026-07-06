import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWhatsAppMessage, messageTemplates } from "@/lib/whatsapp";
import { refreshEstimatesForDay } from "@/lib/queue";

// POST: الريسبشن أو الدكتورة تسجل حدث (تأخير / طوارئ) وده بيأثر على كل المنتظرين
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, delayMinutes, note } = body;

  if (!type) {
    return NextResponse.json({ error: "الحقل type مطلوب" }, { status: 400 });
  }

  const event = await prisma.clinicEvent.create({
    data: { type, delayMinutes, note },
  });

  const today = new Date();
  await refreshEstimatesForDay(today);

  // تنبيه كل المنتظرين اليوم لو الحدث فيه تأخير فعلي
  if (delayMinutes && delayMinutes > 0) {
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

    for (const appt of waitingList) {
      try {
        await sendWhatsAppMessage(appt.patient.phone, messageTemplates.delayAlert(delayMinutes));
      } catch (err) {
        console.error(`تعذر تنبيه المريضة ${appt.patientUserId}:`, err);
      }
    }
  }

  return NextResponse.json(event, { status: 201 });
}

// PATCH: إغلاق حدث (مثلاً الدكتورة رجعت من الطوارئ)
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { eventId } = body;

  const event = await prisma.clinicEvent.update({
    where: { id: eventId },
    data: { resolvedAt: new Date() },
  });

  await refreshEstimatesForDay(new Date());

  return NextResponse.json(event);
}
