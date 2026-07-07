import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// الصفحة دي بيانات لحظية بتتغير باستمرار، فمينفعش Next.js يخزنها (cache)
export const dynamic = "force-dynamic";

// PATCH: الريسبشن/التمريض تسجل الوزن وضغط الدم وقت تسجيل الحضور
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { weight, bloodPressure } = body;

  const parsedWeight =
    weight !== undefined && weight !== null && weight !== "" ? parseFloat(weight) : undefined;

  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      weight: parsedWeight,
      bloodPressure: bloodPressure || undefined,
    },
  });

  return NextResponse.json(updated);
}
