"use client";

import { useEffect, useState } from "react";
import ClinicMark from "@/components/ClinicMark";

type Appointment = {
  id: string;
  queueNumber: number;
  status: string;
  bookingSource: string;
  checkedInAt: string | null;
  weight: number | null;
  bloodPressure: string | null;
  patient: { name: string; phone: string };
};

type DoctorStatusType = "AVAILABLE" | "UNAVAILABLE" | "IN_SURGERY" | "EMERGENCY";

const statusOptions: { value: DoctorStatusType; label: string; color: string }[] = [
  { value: "AVAILABLE", label: "الدكتور موجود", color: "bg-sage-500 hover:bg-sage-400" },
  { value: "UNAVAILABLE", label: "الدكتور مش موجود", color: "bg-amber-500 hover:bg-amber-600" },
  { value: "IN_SURGERY", label: "في عملية", color: "bg-amber-500 hover:bg-amber-600" },
  { value: "EMERGENCY", label: "حالة طارئة", color: "bg-wine-600 hover:bg-wine-700" },
];

export default function ReceptionPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<DoctorStatusType>("AVAILABLE");

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [registering, setRegistering] = useState(false);

  // الوزن وضغط الدم اللي التمريض بتدخلهم لكل مريضة قبل ما تدخل عند الدكتور
  const [vitalsInput, setVitalsInput] = useState<Record<string, { weight: string; bp: string }>>(
    {}
  );
  const [savingVitalsId, setSavingVitalsId] = useState<string | null>(null);

  function updateVitalsInput(id: string, field: "weight" | "bp", value: string) {
    setVitalsInput((prev) => ({
      ...prev,
      [id]: { weight: prev[id]?.weight ?? "", bp: prev[id]?.bp ?? "", [field]: value },
    }));
  }

  async function fetchAppointments() {
    const today = new Date().toISOString();
    const res = await fetch(`/api/appointments?date=${today}`);
    setAppointments(await res.json());
  }

  async function fetchDoctorStatus() {
    const res = await fetch("/api/doctor-status");
    const data = await res.json();
    setCurrentStatus(data.status);
  }

  useEffect(() => {
    fetchAppointments();
    fetchDoctorStatus();
    const interval = setInterval(() => {
      fetchAppointments();
      fetchDoctorStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function checkIn(id: string) {
    setLoading(true);
    const v = vitalsInput[id];
    await fetch(`/api/appointments/${id}/checkin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight: v?.weight, bloodPressure: v?.bp }),
    });
    await fetchAppointments();
    setLoading(false);
  }

  async function saveVitals(id: string) {
    setSavingVitalsId(id);
    try {
      const v = vitalsInput[id];
      await fetch(`/api/appointments/${id}/vitals`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight: v?.weight, bloodPressure: v?.bp }),
      });
      await fetchAppointments();
    } finally {
      setSavingVitalsId(null);
    }
  }

  async function reportDelay() {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "DOCTOR_DELAY", delayMinutes, note: "تأخير من الريسبشن" }),
    });
    alert("تم تسجيل التأخير وإبلاغ المنتظرين");
  }

  async function changeDoctorStatus(status: DoctorStatusType) {
    let minutes = delayMinutes;
    if (status !== "AVAILABLE") {
      const input = prompt("قد إيه التأخير المتوقع بالدقايق؟", String(delayMinutes));
      if (input === null) return;
      minutes = Number(input) || delayMinutes;
    }
    await fetch("/api/doctor-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, delayMinutes: minutes }),
    });
    setCurrentStatus(status);
    await fetchAppointments();
  }

  async function registerWalkIn(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    setRegistering(true);
    try {
      await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, phone: newPhone, bookingSource: "WALK_IN" }),
      });
      setNewName("");
      setNewPhone("");
      setShowForm(false);
      await fetchAppointments();
    } finally {
      setRegistering(false);
    }
  }

  const statusMeta = statusOptions.find((s) => s.value === currentStatus);

  return (
    <main dir="rtl" className="min-h-screen bg-blush-50 p-6 font-body">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="queue-badge h-10 w-10 flex-shrink-0 text-base font-display">
            <ClinicMark />
          </div>
          <h1 className="font-display text-2xl font-semibold text-wine-700">لوحة الريسبشن</h1>
        </div>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className="rounded-full border border-rose-400/30 px-4 py-1.5 text-sm text-plum-900/60 transition hover:bg-blush-100"
        >
          تسجيل خروج
        </button>
      </div>
      <div className="arc-divider mb-6" />

      <div className="mb-6 rounded-2xl border border-rose-400/20 bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-medium text-plum-900">حالة الدكتور الحالية:</span>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium text-white ${statusMeta?.color.split(" ")[0]}`}
          >
            {statusMeta?.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => changeDoctorStatus(opt.value)}
              disabled={currentStatus === opt.value}
              className={`rounded-full px-4 py-2 text-sm text-white transition disabled:opacity-40 ${opt.color}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-rose-400/20 bg-white p-4 shadow-soft">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-wine-600 px-5 py-2 text-white transition hover:bg-wine-700"
          >
            + تسجيل مريضة جديدة
          </button>
        ) : (
          <form onSubmit={registerWalkIn} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-sm text-plum-900/70">الاسم</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-lg border border-rose-400/30 p-2 focus:border-wine-500 focus:outline-none"
                placeholder="اسم المريضة"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-plum-900/70">رقم الهاتف</label>
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                dir="ltr"
                className="rounded-lg border border-rose-400/30 p-2 focus:border-wine-500 focus:outline-none"
                placeholder="01xxxxxxxxx"
              />
            </div>
            <button
              type="submit"
              disabled={registering}
              className="rounded-full bg-sage-500 px-5 py-2 text-white transition hover:bg-sage-400 disabled:opacity-50"
            >
              {registering ? "جاري التسجيل..." : "تسجيل وإضافة للطابور"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-rose-400/30 px-5 py-2 text-plum-900/70"
            >
              إلغاء
            </button>
          </form>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-rose-400/20 bg-white p-4 shadow-soft">
        <span className="font-medium text-plum-900">تسجيل تأخير إضافي:</span>
        <input
          type="number"
          value={delayMinutes}
          onChange={(e) => setDelayMinutes(Number(e.target.value))}
          className="w-20 rounded-lg border border-rose-400/30 p-1 text-center focus:border-wine-500 focus:outline-none"
        />
        <span className="text-sm text-plum-900/60">دقيقة</span>
        <button
          onClick={reportDelay}
          className="rounded-full bg-amber-500 px-5 py-2 text-white transition hover:bg-amber-600"
        >
          تسجيل
        </button>
      </div>

      <table className="w-full overflow-hidden rounded-2xl border border-rose-400/20 bg-white text-right shadow-soft">
        <thead className="bg-blush-100 text-wine-700">
          <tr>
            <th className="p-3 font-display font-semibold">الدور</th>
            <th className="p-3 font-display font-semibold">الاسم</th>
            <th className="p-3 font-display font-semibold">المصدر</th>
            <th className="p-3 font-display font-semibold">الحالة</th>
            <th className="p-3 font-display font-semibold">الوزن (كجم)</th>
            <th className="p-3 font-display font-semibold">ضغط الدم</th>
            <th className="p-3 font-display font-semibold">إجراء</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <tr key={a.id} className="border-t border-rose-400/10">
              <td className="p-3 font-bold text-wine-600">{a.queueNumber}</td>
              <td className="p-3">{a.patient.name}</td>
              <td className="p-3">{a.bookingSource === "ONLINE" ? "أونلاين" : "حضوري"}</td>
              <td className="p-3">{a.status}</td>
              <td className="p-3">
                <input
                  type="number"
                  step="0.1"
                  value={vitalsInput[a.id]?.weight ?? (a.weight != null ? String(a.weight) : "")}
                  onChange={(e) => updateVitalsInput(a.id, "weight", e.target.value)}
                  placeholder="مثال: 68"
                  className="w-20 rounded-lg border border-rose-400/30 p-1 text-center focus:border-wine-500 focus:outline-none"
                />
              </td>
              <td className="p-3">
                <input
                  value={vitalsInput[a.id]?.bp ?? a.bloodPressure ?? ""}
                  onChange={(e) => updateVitalsInput(a.id, "bp", e.target.value)}
                  placeholder="مثال: 120/80"
                  dir="ltr"
                  className="w-24 rounded-lg border border-rose-400/30 p-1 text-center focus:border-wine-500 focus:outline-none"
                />
              </td>
              <td className="p-3">
                {!a.checkedInAt ? (
                  <button
                    disabled={loading}
                    onClick={() => checkIn(a.id)}
                    className="rounded-full bg-sage-500 px-3 py-1 text-white transition hover:bg-sage-400"
                  >
                    تسجيل حضور
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sage-500">✓ حاضرة</span>
                    <button
                      onClick={() => saveVitals(a.id)}
                      disabled={savingVitalsId === a.id}
                      className="rounded-full border border-rose-400/30 px-2 py-0.5 text-xs text-wine-600 transition hover:bg-blush-100 disabled:opacity-50"
                    >
                      {savingVitalsId === a.id ? "جاري الحفظ..." : "حفظ"}
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {appointments.length === 0 && (
            <tr>
              <td colSpan={7} className="p-6 text-center text-plum-900/40">
                لا يوجد حجوزات اليوم
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
