import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH: الدكتورة تضغط "التالي" فينادي على المريضة صاحبة الدور
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data: { status: "CALLED", calledAt: new Date() },
  });

  return NextResponse.json(appointment);
}
