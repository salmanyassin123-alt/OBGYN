import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: جلب الملف الطبي + سجل الزيارات بواسطة رقم الهاتف
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone")?.replace(/\s|-/g, "");
  if (!phone) {
    return NextResponse.json({ error: "رقم الهاتف مطلوب" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      patientProfile: {
        include: {
          visits: { orderBy: { visitDate: "desc" }, take: 20 },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "لا يوجد ملف مسجل بهذا الرقم" }, { status: 404 });
  }

  return NextResponse.json({ name: user.name, phone: user.phone, profile: user.patientProfile });
}

// PATCH: تحديث بيانات الملف الطبي (تاريخ صحي، حساسية، حمل...)
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const {
    phone,
    name,
    dateOfBirth,
    bloodType,
    chronicConditions,
    allergies,
    isPregnant,
    lastPeriodDate,
    privacyMode,
    occupation,
    currentMedications,
    previousSurgeries,
    obstetricHistory,
    familyHistory,
    husbandName,
    husbandOccupation,
  } = body;

  const cleanPhone = phone?.replace(/\s|-/g, "");
  if (!cleanPhone) {
    return NextResponse.json({ error: "رقم الهاتف مطلوب" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { phone: cleanPhone },
    update: name ? { name } : {},
    create: { phone: cleanPhone, name: name || "مريضة جديدة", role: "PATIENT" },
  });

  const profile = await prisma.patientProfile.upsert({
    where: { userId: user.id },
    update: {
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      bloodType,
      chronicConditions,
      allergies,
      isPregnant,
      lastPeriodDate: lastPeriodDate ? new Date(lastPeriodDate) : undefined,
      privacyMode,
      occupation,
      currentMedications,
      previousSurgeries,
      obstetricHistory,
      familyHistory,
      husbandName,
      husbandOccupation,
    },
    create: {
      userId: user.id,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      bloodType,
      chronicConditions,
      allergies,
      isPregnant: isPregnant ?? false,
      lastPeriodDate: lastPeriodDate ? new Date(lastPeriodDate) : undefined,
      privacyMode: privacyMode ?? false,
      occupation,
      currentMedications,
      previousSurgeries,
      obstetricHistory,
      familyHistory,
      husbandName,
      husbandOccupation,
    },
  });

  return NextResponse.json({ name: user.name, phone: user.phone, profile });
}
