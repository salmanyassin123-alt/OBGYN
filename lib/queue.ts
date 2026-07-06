import { prisma } from "./db";
import { sendWhatsAppMessage, messageTemplates } from "./whatsapp";
import { VisitType, AppointmentStatus } from "@prisma/client";

/** متوسط وقت الكشف الفعلي (بالدقايق) لآخر N حالة من نفس النوع */
export async function getAvgConsultationTime(
  visitType: VisitType = "CHECKUP",
  sampleSize = 20
): Promise<number> {
  const recentVisits = await prisma.appointment.findMany({
    where: {
      status: "COMPLETED",
      visit: { visitType },
      calledAt: { not: null },
      completedAt: { not: null },
    },
    orderBy: { completedAt: "desc" },
    take: sampleSize,
    select: { calledAt: true, completedAt: true },
  });

  const durations = recentVisits
    .filter((v) => v.calledAt && v.completedAt)
    .map((v) => (v.completedAt!.getTime() - v.calledAt!.getTime()) / 60000);

  if (durations.length === 0) return 15; // قيمة افتراضية لو مفيش بيانات كفاية
  return durations.reduce((a, b) => a + b, 0) / durations.length;
}

/** مجموع دقائق التأخير الناتجة عن أحداث مفتوحة (لسه ما اتحلتش) */
async function getActiveDelayMinutes(): Promise<number> {
  const activeEvents = await prisma.clinicEvent.findMany({
    where: { resolvedAt: null, delayMinutes: { not: null } },
  });
  return activeEvents.reduce((sum, e) => sum + (e.delayMinutes || 0), 0);
}

/** حساب الوقت المتوقع للانتظار (بالدقايق) لحجز معين */
export async function estimateWaitMinutes(appointmentId: string): Promise<number> {
  const appt = await prisma.appointment.findUniqueOrThrow({
    where: { id: appointmentId },
  });

  const peopleAhead = await prisma.appointment.count({
    where: {
      scheduledDate: appt.scheduledDate,
      status: { in: ["WAITING", "CALLED"] },
      queueNumber: { lt: appt.queueNumber },
    },
  });

  const avgTime = await getAvgConsultationTime("CHECKUP");
  const extraDelay = await getActiveDelayMinutes();

  return Math.round(peopleAhead * avgTime + extraDelay);
}

/** توليد رقم الدور التالي لليوم المحدد (يشمل أونلاين + ووك-إن في نفس التسلسل) */
export async function getNextQueueNumber(scheduledDate: Date): Promise<number> {
  const startOfDay = new Date(scheduledDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(scheduledDate);
  endOfDay.setHours(23, 59, 59, 999);

  const last = await prisma.appointment.findFirst({
    where: { scheduledDate: { gte: startOfDay, lte: endOfDay } },
    orderBy: { queueNumber: "desc" },
    select: { queueNumber: true },
  });

  return (last?.queueNumber ?? 0) + 1;
}

/**
 * يتفحص قائمة الانتظار بعد أي تحديث (اكتمال حالة / حدث جديد)
 * ويبعت تنبيه واتساب لصاحبة الدور اللي "باقيلها 3 حالات" لو لسه ما اتبعتلهاش رسالة.
 */
export async function notifyUpcomingPatients(scheduledDate: Date) {
  const startOfDay = new Date(scheduledDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(scheduledDate);
  endOfDay.setHours(23, 59, 59, 999);

  const waitingList = await prisma.appointment.findMany({
    where: {
      scheduledDate: { gte: startOfDay, lte: endOfDay },
      status: "WAITING",
    },
    orderBy: { queueNumber: "asc" },
    take: 5,
    include: { patient: true },
  });

  // صاحبة الترتيب الرابع في قايمة الانتظار = قدامها 3 بالظبط
  const target = waitingList[3];
  if (!target || target.notifiedAt3Left) return;

  const estimatedMinutes = await estimateWaitMinutes(target.id);

  try {
    await sendWhatsAppMessage(target.patient.phone, messageTemplates.threeLeft(estimatedMinutes));
    await prisma.appointment.update({
      where: { id: target.id },
      data: { notifiedAt3Left: new Date() },
    });
    await prisma.notificationLog.create({
      data: { appointmentId: target.id, type: "3_LEFT" },
    });
  } catch (err) {
    console.error("تعذر إرسال تنبيه 'باقي 3':", err);
  }
}

/** تحديث حالة كل الحجوزات المنتظرة بعد أي حدث (تأخير/طوارئ) لإعادة حساب الوقت المتوقع */
export async function refreshEstimatesForDay(scheduledDate: Date) {
  const startOfDay = new Date(scheduledDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(scheduledDate);
  endOfDay.setHours(23, 59, 59, 999);

  const waitingList = await prisma.appointment.findMany({
    where: {
      scheduledDate: { gte: startOfDay, lte: endOfDay },
      status: { in: ["WAITING", "CALLED"] },
    },
  });

  for (const appt of waitingList) {
    const minutes = await estimateWaitMinutes(appt.id);
    const estimatedTime = new Date(Date.now() + minutes * 60000);
    await prisma.appointment.update({
      where: { id: appt.id },
      data: { estimatedTime },
    });
  }
}
