import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH: تستخدمها الريسبشن لما المريضة توصل فعليًا (سواء حاجزة أونلاين أو ووك-إن)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data: { checkedInAt: new Date() },
  });

  return NextResponse.json(appointment);
}
