import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWhatsAppMessage, messageTemplates } from "@/lib/whatsapp";
import { notifyUpcomingPatients, refreshEstimatesForDay } from "@/lib/queue";

// PATCH: الدكتورة تنهي الكشف وتسجل التشخيص/الروشتة
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { diagnosis, prescription, visitType, nextVisitDate, doctorNotes, labResults } = body;

  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data: { status: "COMPLETED", completedAt: new Date() },
    include: { patient: { include: { patientProfile: true } } },
  });

  // إنشاء سجل الزيارة في الملف الطبي
  if (appointment.patient.patientProfile) {
    await prisma.visit.create({
      data: {
        patientId: appointment.patient.patientProfile.id,
        appointmentId: appointment.id,
        visitType: visitType ?? "CHECKUP",
        diagnosis,
        prescription,
        labResults,
        nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : undefined,
        doctorNotes,
      },
    });
  }

  // إرسال الروشتة على واتساب
  try {
    await sendWhatsAppMessage(
      appointment.patient.phone,
      `${messageTemplates.prescriptionReady()}\n\nالتشخيص: ${diagnosis ?? "-"}\nالروشتة: ${
        prescription ?? "-"
      }`
    );
  } catch (err) {
    console.error("تعذر إرسال الروشتة على واتساب:", err);
  }

  // إعادة حساب أوقات الانتظار وتنبيه صاحبة الدور القادم
  await refreshEstimatesForDay(appointment.scheduledDate);
  await notifyUpcomingPatients(appointment.scheduledDate);

  return NextResponse.json(appointment);
}
