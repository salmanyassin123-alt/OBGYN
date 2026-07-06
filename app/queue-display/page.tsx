"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ClinicMark from "@/components/ClinicMark";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Appointment = {
  id: string;
  queueNumber: number;
  status: string;
  estimatedTime: string | null;
  patient: { name: string };
};

type DoctorStatusType = "AVAILABLE" | "UNAVAILABLE" | "IN_SURGERY" | "EMERGENCY";

const doctorStatusMeta: Record<DoctorStatusType, { text: string; dot: string; pill: string }> = {
  AVAILABLE: { text: "الدكتور متواجد الآن", dot: "bg-sage-500", pill: "bg-sage-500/10 text-sage-500" },
  UNAVAILABLE: {
    text: "الدكتور غير متواجد حاليًا",
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-500",
  },
  IN_SURGERY: {
    text: "الدكتور داخل عملية حاليًا",
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-500",
  },
  EMERGENCY: {
    text: "حالة طارئة داخل العيادة",
    dot: "bg-wine-600",
    pill: "bg-wine-600/10 text-wine-600",
  },
};

export default function QueueDisplayPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [delayNotice, setDelayNotice] = useState<string | null>(null);
  const [doctorStatus, setDoctorStatus] = useState<DoctorStatusType>("AVAILABLE");
  const [now, setNow] = useState<Date | null>(null);

  async function fetchAppointments() {
    const today = new Date().toISOString();
    const res = await fetch(`/api/appointments?date=${today}`);
    const data = await res.json();
    setAppointments(data);
  }

  async function fetchDoctorStatus() {
    const res = await fetch("/api/doctor-status");
    const data = await res.json();
    setDoctorStatus(data.status);
  }

  useEffect(() => {
    fetchAppointments();
    fetchDoctorStatus();
    setNow(new Date());

    // تحديث تلقائي احتياطي كل 7 دقايق - مجرد شبكة أمان لو الاتصال اللحظي (Realtime)
    // قاطع، مش المصدر الأساسي للتحديث (ده شغل الـ Realtime subscription تحت)
    const pollInterval = setInterval(() => {
      fetchAppointments();
      fetchDoctorStatus();
      setNow(new Date());
    }, 5 * 60 * 1000);

    const channel = supabase
      .channel("queue-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Appointment" },
        () => fetchAppointments()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "DoctorStatus" },
        () => fetchDoctorStatus()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ClinicEvent" },
        (payload) => {
          const ev = payload.new as { type: string; delayMinutes: number | null };
          if (ev.type === "DOCTOR_DELAY" || ev.type === "EMERGENCY_CASE") {
            setDelayNotice(
              ev.type === "EMERGENCY_CASE"
                ? "تأخير بسبب حالة طارئة، نعتذر عن الإزعاج"
                : `تأخير متوقع حوالي ${ev.delayMinutes ?? "بضع"} دقيقة`
            );
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const waiting = appointments.filter((a) => a.status === "WAITING");
  const current = appointments.find((a) => a.status === "CALLED" || a.status === "IN_PROGRESS");
  const statusMeta = doctorStatusMeta[doctorStatus];

  return (
    <main dir="rtl" className="arc-decoration min-h-screen bg-blush-50 p-8 font-body">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="queue-badge h-12 w-12 flex-shrink-0 text-lg font-display font-semibold">
            <ClinicMark />
          </div>
          <h1 className="font-display text-3xl font-semibold text-wine-700">شاشة انتظار العيادة</h1>
        </div>

        <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${statusMeta.pill}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${statusMeta.dot}`} />
          {statusMeta.text}
        </div>
      </div>
      <div className="arc-divider mb-8" />

      {delayNotice && (
        <div className="mb-8 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-plum-900">
          ⚠️ {delayNotice}
        </div>
      )}

      <section className="mb-10 grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-wine-600">الحالة الحالية</h2>
          {current ? (
            <div className="pulse-current rounded-[2rem] bg-gradient-to-br from-wine-500 to-wine-700 p-8 text-center text-blush-50 shadow-soft">
              <p className="text-sm opacity-80">جاري الكشف الآن</p>
              <p className="font-display text-6xl font-semibold tabular-nums">
                دور رقم {current.queueNumber}
              </p>
            </div>
          ) : (
            <div className="flex h-full min-h-[9rem] items-center justify-center rounded-[2rem] border border-rose-400/15 bg-white p-8 text-center shadow-soft">
              <p className="text-plum-900/40">لا توجد حالة قيد الكشف حاليًا</p>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center rounded-[2rem] border border-gold-400/30 bg-white p-6 text-center shadow-soft">
          <p className="text-sm text-plum-900/60">عدد المنتظرين الآن</p>
          <p className="font-display text-5xl font-semibold text-wine-700">{waiting.length}</p>
          {now && (
            <p className="mt-2 text-xs text-plum-900/40">
              آخر تحديث: {now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-wine-600">قائمة الانتظار</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {waiting.map((a, i) => (
            <div
              key={a.id}
              className={`rounded-2xl border bg-white p-5 text-center shadow-soft ${
                i === 0 ? "border-gold-400/50" : "border-rose-400/20"
              }`}
            >
              <p className="queue-badge mx-auto mb-2 h-14 w-14 font-display text-xl font-bold">
                {a.queueNumber}
              </p>
              {i === 0 && <p className="mb-1 text-[11px] font-medium text-gold-500">التالي</p>}
              <p className="text-sm text-plum-900/60">
                {a.estimatedTime
                  ? new Date(a.estimatedTime).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "..."}
              </p>
            </div>
          ))}
          {waiting.length === 0 && <p className="text-plum-900/40">لا يوجد منتظرين</p>}
        </div>
      </section>
    </main>
  );
}
