"use client";

import { useEffect, useState } from "react";
import ClinicMark from "@/components/ClinicMark";

type BookingResult = {
  appointmentId: string;
  queueNumber: number;
  peopleAhead: number;
  estimatedMinutes: number;
};

type DoctorStatus = {
  status: "AVAILABLE" | "UNAVAILABLE" | "IN_SURGERY" | "EMERGENCY";
};

const statusLabels: Record<string, { text: string; color: string }> = {
  AVAILABLE: { text: "الدكتور متواجد الآن", color: "text-sage-500" },
  UNAVAILABLE: { text: "الدكتور غير متواجد حاليًا", color: "text-amber-500" },
  IN_SURGERY: { text: "الدكتور داخل عملية", color: "text-amber-500" },
  EMERGENCY: { text: "حالة طارئة داخل العيادة", color: "text-wine-600" },
};

export default function BookPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BookingResult | null>(null);
  const [peopleAhead, setPeopleAhead] = useState<number | null>(null);
  const [doctorStatus, setDoctorStatus] = useState<DoctorStatus | null>(null);

  async function fetchDoctorStatus() {
    const res = await fetch("/api/doctor-status");
    setDoctorStatus(await res.json());
  }

  useEffect(() => {
    fetchDoctorStatus();
    const interval = setInterval(fetchDoctorStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // تحديث عدد المنتظرين قدامها كل 15 ثانية بعد الحجز
  useEffect(() => {
    if (!result) return;
    async function refresh() {
      const today = new Date().toISOString();
      const res = await fetch(`/api/appointments?date=${today}`);
      const all = await res.json();
      const ahead = all.filter(
        (a: any) =>
          (a.status === "WAITING" || a.status === "CALLED") &&
          a.queueNumber < result!.queueNumber
      ).length;
      setPeopleAhead(ahead);
    }
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [result]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !phone.trim()) {
      setError("من فضلك أدخلي الاسم ورقم الهاتف");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, bookingSource: "ONLINE" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data);
      setPeopleAhead(data.peopleAhead);
    } catch {
      setError("حصل خطأ أثناء الحجز، حاولي مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-blush-50 p-6 font-body">
      <div className="mx-auto max-w-md pt-10">
        <div className="mb-8 text-center">
          <div className="queue-badge mx-auto mb-4 h-14 w-14 text-xl font-display font-semibold">
            <ClinicMark />
          </div>
          <h1 className="font-display text-2xl font-semibold text-wine-700">احجزي دورك</h1>
          <div className="arc-divider mx-auto mt-3" />
        </div>

        {doctorStatus && (
          <div className="mb-6 rounded-2xl border border-rose-400/20 bg-white p-3 text-center shadow-soft">
            <span className={`text-sm font-medium ${statusLabels[doctorStatus.status].color}`}>
              ● {statusLabels[doctorStatus.status].text}
            </span>
          </div>
        )}

        {!result && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-rose-400/20 bg-white p-6 shadow-soft"
          >
            <label className="mb-1 block text-sm text-plum-900/70">الاسم</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-4 w-full rounded-xl border border-rose-400/30 p-2 focus:border-wine-500 focus:outline-none"
              placeholder="اكتبي اسمك"
            />

            <label className="mb-1 block text-sm text-plum-900/70">رقم الهاتف (واتساب)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              className="mb-4 w-full rounded-xl border border-rose-400/30 p-2 text-right focus:border-wine-500 focus:outline-none"
              placeholder="01xxxxxxxxx"
            />

            {error && <p className="mb-4 text-sm text-wine-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-wine-600 px-6 py-3 font-medium text-white transition hover:bg-wine-700 disabled:opacity-50"
            >
              {loading ? "جاري الحجز..." : "احجزي دورك الآن"}
            </button>
          </form>
        )}

        {result && (
          <div className="rounded-[1.75rem] bg-gradient-to-br from-wine-500 to-wine-700 p-8 text-center text-blush-50 shadow-soft">
            <p className="mb-1 text-sm opacity-80">تم الحجز بنجاح</p>
            <p className="font-display text-5xl font-semibold">{result.queueNumber}</p>
            <p className="mt-1 text-sm opacity-80">رقم دورك</p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-2xl font-bold">
                  {peopleAhead !== null ? peopleAhead : result.peopleAhead}
                </p>
                <p className="text-xs opacity-80">منتظرين قبلك</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-2xl font-bold">~{result.estimatedMinutes}</p>
                <p className="text-xs opacity-80">دقيقة تقريبًا</p>
              </div>
            </div>

            <p className="mt-6 text-xs opacity-70">
              هنبعتلك رسالة واتساب لما يكون باقي 3 حالات بس قبل دورك
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
