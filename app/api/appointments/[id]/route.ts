import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: تفاصيل الحجز كاملة للدكتور - بيانات المريضة + تاريخها المرضي
// (تُستخدم في لوحة الدكتور وقت نداء الحالة عشان تظهر المتابعة أو فورم أول زيارة)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      patient: {
        include: {
          patientProfile: {
            include: {
              visits: { orderBy: { visitDate: "desc" }, take: 10 },
            },
          },
        },
      },
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "الحجز غير موجود" }, { status: 404 });
  }

  const profile = appointment.patient.patientProfile;
  const isFirstVisit = !profile || profile.visits.length === 0;

  return NextResponse.json({
    id: appointment.id,
    queueNumber: appointment.queueNumber,
    patient: { name: appointment.patient.name, phone: appointment.patient.phone },
    isFirstVisit,
    profile: profile
      ? {
          dateOfBirth: profile.dateOfBirth,
          bloodType: profile.bloodType,
          chronicConditions: profile.chronicConditions,
          allergies: profile.allergies,
          isPregnant: profile.isPregnant,
          lastPeriodDate: profile.lastPeriodDate,
          occupation: profile.occupation,
          currentMedications: profile.currentMedications,
          previousSurgeries: profile.previousSurgeries,
          obstetricHistory: profile.obstetricHistory,
          familyHistory: profile.familyHistory,
          husbandName: profile.husbandName,
          husbandOccupation: profile.husbandOccupation,
        }
      : null,
    visits: profile?.visits ?? [],
  });
}
