"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ClinicMark from "@/components/ClinicMark";

type Appointment = {
  id: string;
  queueNumber: number;
  status: string;
  patient: { name: string };
};

type Visit = {
  id: string;
  visitDate: string;
  visitType: string;
  diagnosis: string | null;
  prescription: string | null;
  doctorNotes: string | null;
  labResults: string | null;
  nextVisitDate: string | null;
};

type PatientDetail = {
  id: string;
  queueNumber: number;
  patient: { name: string; phone: string };
  isFirstVisit: boolean;
  profile: {
    dateOfBirth: string | null;
    bloodType: string | null;
    chronicConditions: string | null;
    allergies: string | null;
    isPregnant: boolean;
    lastPeriodDate: string | null;
    occupation: string | null;
    currentMedications: string | null;
    previousSurgeries: string | null;
    obstetricHistory: string | null;
    familyHistory: string | null;
    husbandName: string | null;
    husbandOccupation: string | null;
  } | null;
  visits: Visit[];
};

const visitTypeLabels: Record<string, string> = {
  CHECKUP: "كشف عادي",
  ANTENATAL_FOLLOWUP: "متابعة حمل",
  ULTRASOUND: "سونار",
  EMERGENCY: "حالة طارئة",
  DELIVERY: "ولادة",
  POSTNATAL: "متابعة بعد الولادة",
};

export default function DoctorPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");

  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // فورم بيانات الكارت لو دي أول زيارة للمريضة
  const [cardDateOfBirth, setCardDateOfBirth] = useState("");
  const [cardBloodType, setCardBloodType] = useState("");
  const [cardChronic, setCardChronic] = useState("");
  const [cardAllergies, setCardAllergies] = useState("");
  const [cardIsPregnant, setCardIsPregnant] = useState(false);
  const [cardLastPeriod, setCardLastPeriod] = useState("");
  const [cardOccupation, setCardOccupation] = useState("");
  const [cardMedications, setCardMedications] = useState("");
  const [cardSurgeries, setCardSurgeries] = useState("");
  const [cardObstetric, setCardObstetric] = useState("");
  const [cardFamilyHistory, setCardFamilyHistory] = useState("");
  const [cardHusbandName, setCardHusbandName] = useState("");
  const [cardHusbandOccupation, setCardHusbandOccupation] = useState("");
  const [cardSaving, setCardSaving] = useState(false);
  const [cardSaved, setCardSaved] = useState(false);
  const [showEditCard, setShowEditCard] = useState(false);

  // فورم إنهاء الكشف
  const [labResults, setLabResults] = useState("");
  const [nextVisitDate, setNextVisitDate] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");

  async function fetchAppointments() {
    const today = new Date().toISOString();
    const res = await fetch(`/api/appointments?date=${today}`);
    setAppointments(await res.json());
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  const waiting = appointments.filter((a) => a.status === "WAITING");
  const current = appointments.find((a) => a.id === activeId);

  async function fetchDetail(id: string) {
    setDetailLoading(true);
    setCardSaved(false);
    setShowEditCard(false);
    try {
      const res = await fetch(`/api/appointments/${id}`);
      const json: PatientDetail = await res.json();
      setDetail(json);
      setCardDateOfBirth(json.profile?.dateOfBirth?.slice(0, 10) || "");
      setCardBloodType(json.profile?.bloodType || "");
      setCardChronic(json.profile?.chronicConditions || "");
      setCardAllergies(json.profile?.allergies || "");
      setCardIsPregnant(json.profile?.isPregnant || false);
      setCardLastPeriod(json.profile?.lastPeriodDate?.slice(0, 10) || "");
      setCardOccupation(json.profile?.occupation || "");
      setCardMedications(json.profile?.currentMedications || "");
      setCardSurgeries(json.profile?.previousSurgeries || "");
      setCardObstetric(json.profile?.obstetricHistory || "");
      setCardFamilyHistory(json.profile?.familyHistory || "");
      setCardHusbandName(json.profile?.husbandName || "");
      setCardHusbandOccupation(json.profile?.husbandOccupation || "");
    } finally {
      setDetailLoading(false);
    }
  }

  async function callNext() {
    const next = waiting[0];
    if (!next) return;
    await fetch(`/api/appointments/${next.id}/call`, { method: "PATCH" });
    setActiveId(next.id);
    await fetchAppointments();
    await fetchDetail(next.id);
  }

  async function saveCardData() {
    if (!detail) return;
    setCardSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: detail.patient.phone,
          dateOfBirth: cardDateOfBirth || undefined,
          bloodType: cardBloodType,
          chronicConditions: cardChronic,
          allergies: cardAllergies,
          isPregnant: cardIsPregnant,
          lastPeriodDate: cardLastPeriod || undefined,
          occupation: cardOccupation,
          currentMedications: cardMedications,
          previousSurgeries: cardSurgeries,
          obstetricHistory: cardObstetric,
          familyHistory: cardFamilyHistory,
          husbandName: cardHusbandName,
          husbandOccupation: cardHusbandOccupation,
        }),
      });
      setCardSaved(true);
    } finally {
      setCardSaving(false);
    }
  }

  async function completeVisit() {
    if (!activeId) return;
    await fetch(`/api/appointments/${activeId}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagnosis,
        prescription,
        visitType: "CHECKUP",
        labResults: labResults || undefined,
        nextVisitDate: nextVisitDate || undefined,
        doctorNotes: doctorNotes || undefined,
      }),
    });
    setActiveId(null);
    setDetail(null);
    setDiagnosis("");
    setPrescription("");
    setLabResults("");
    setNextVisitDate("");
    setDoctorNotes("");
    await fetchAppointments();
  }

  const lastVisit = detail?.visits[0];

  return (
    <main dir="rtl" className="min-h-screen bg-blush-50 p-6 font-body">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="queue-badge h-10 w-10 flex-shrink-0 text-base font-display">
            <ClinicMark />
          </div>
          <h1 className="font-display text-2xl font-semibold text-wine-700">لوحة الدكتور</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/doctor/stats"
            className="rounded-full bg-wine-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-wine-700"
          >
            الإحصائيات
          </Link>
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
      </div>
      <div className="arc-divider mb-6" />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-gold-400/30 bg-white px-5 py-3 shadow-soft">
          <span className="font-display text-3xl font-semibold text-wine-700">{waiting.length}</span>
          <span className="text-sm text-plum-900/60">في الانتظار الآن</span>
        </div>

        {!current && (
          <button
            onClick={callNext}
            disabled={waiting.length === 0}
            className="rounded-full bg-wine-600 px-6 py-3 font-medium text-white shadow-soft transition hover:bg-wine-700 disabled:opacity-40"
          >
            نداء المريضة التالية
          </button>
        )}
      </div>

      {current && (
        <div className="rounded-[1.75rem] border border-rose-400/20 bg-white p-6 shadow-soft">
          <h2 className="mb-4 font-display text-lg font-semibold text-wine-700">
            جاري كشف: {current.patient.name} (دور رقم {current.queueNumber})
          </h2>

          {detailLoading && <p className="mb-4 text-sm text-plum-900/50">جاري تحميل بيانات الحالة...</p>}

          {/* أول زيارة: فورم بيانات الكارت (أو تعديل بيانات الكارت لحالة متابعة) */}
          {(detail?.isFirstVisit || showEditCard) && (
            <div className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
              <p className="mb-3 text-sm font-medium text-plum-900">
                أول زيارة للمريضة دي — من فضلك سجّل بيانات الكارت
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-plum-900/70">تاريخ الميلاد</label>
                  <input
                    type="date"
                    value={cardDateOfBirth}
                    onChange={(e) => setCardDateOfBirth(e.target.value)}
                    className="w-full rounded-lg border border-rose-400/30 p-2 text-sm focus:border-wine-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-plum-900/70">فصيلة الدم</label>
                  <input
                    value={cardBloodType}
                    onChange={(e) => setCardBloodType(e.target.value)}
                    placeholder="مثال: O+"
                    className="w-full rounded-lg border border-rose-400/30 p-2 text-sm focus:border-wine-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-plum-900/70">أمراض مزمنة</label>
                  <input
                    value={cardChronic}
                    onChange={(e) => setCardChronic(e.target.value)}
                    className="w-full rounded-lg border border-rose-400/30 p-2 text-sm focus:border-wine-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-plum-900/70">حساسية من أدوية</label>
                  <input
                    value={cardAllergies}
                    onChange={(e) => setCardAllergies(e.target.value)}
                    className="w-full rounded-lg border border-rose-400/30 p-2 text-sm focus:border-wine-500 focus:outline-none"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-plum-900/80">
                  <input
                    type="checkbox"
                    checked={cardIsPregnant}
                    onChange={(e) => setCardIsPregnant(e.target.checked)}
                    className="h-4 w-4"
                  />
                  حامل حاليًا
                </label>
                {cardIsPregnant && (
                  <div>
                    <label className="mb-1 block text-xs text-plum-900/70">تاريخ آخر دورة (LMP)</label>
                    <input
                      type="date"
                      value={cardLastPeriod}
                      onChange={(e) => setCardLastPeriod(e.target.value)}
                      className="w-full rounded-lg border border-rose-400/30 p-2 text-sm focus:border-wine-500 focus:outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs text-plum-900/70">وظيفة المريضة</label>
                  <input
                    value={cardOccupation}
                    onChange={(e) => setCardOccupation(e.target.value)}
                    className="w-full rounded-lg border border-rose-400/30 p-2 text-sm focus:border-wine-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-plum-900/70">الأدوية الحالية</label>
                  <input
                    value={cardMedications}
                    onChange={(e) => setCardMedications(e.target.value)}
                    className="w-full rounded-lg border border-rose-400/30 p-2 text-sm focus:border-wine-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-plum-900/70">عمليات جراحية سابقة</label>
                  <input
                    value={cardSurgeries}
                    onChange={(e) => setCardSurgeries(e.target.value)}
                    className="w-full rounded-lg border border-rose-400/30 p-2 text-sm focus:border-wine-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-plum-900/70">
                    تاريخ حالات الحمل والولادة السابقة (عدد الحمل / الولادة / الإجهاض)
                  </label>
                  <input
                    value={cardObstetric}
                    onChange={(e) => setCardObstetric(e.target.value)}
                    placeholder="مثال: حمل 3 - ولادة 2 (قيصرية 1، طبيعية 1) - إجهاض 1"
                    className="w-full rounded-lg border border-rose-400/30 p-2 text-sm focus:border-wine-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-plum-900/70">تاريخ الأمراض في العائلة</label>
                  <input
                    value={cardFamilyHistory}
                    onChange={(e) => setCardFamilyHistory(e.target.value)}
                    className="w-full rounded-lg border border-rose-400/30 p-2 text-sm focus:border-wine-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-plum-900/70">اسم الزوج</label>
                  <input
                    value={cardHusbandName}
                    onChange={(e) => setCardHusbandName(e.target.value)}
                    className="w-full rounded-lg border border-rose-400/30 p-2 text-sm focus:border-wine-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-plum-900/70">وظيفة الزوج</label>
                  <input
                    value={cardHusbandOccupation}
                    onChange={(e) => setCardHusbandOccupation(e.target.value)}
                    className="w-full rounded-lg border border-rose-400/30 p-2 text-sm focus:border-wine-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={saveCardData}
                disabled={cardSaving}
                className="mt-3 rounded-full bg-sage-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-sage-400 disabled:opacity-50"
              >
                {cardSaving ? "جاري الحفظ..." : "حفظ بيانات الكارت"}
              </button>
              {cardSaved && <span className="mr-3 text-sm text-sage-500">تم الحفظ ✓</span>}
            </div>
          )}

          {/* حالة متابعة: التاريخ المرضي + آخر روشتة */}
          {detail && !detail.isFirstVisit && !showEditCard && (
            <div className="mb-5 space-y-4">
              {lastVisit && (
                <div className="rounded-2xl border border-wine-600/20 bg-blush-50 p-4">
                  <p className="mb-1 text-sm font-semibold text-wine-700">
                    آخر روشتة (بتاريخ {new Date(lastVisit.visitDate).toLocaleDateString("ar-EG")})
                  </p>
                  <p className="text-sm text-plum-900/80">
                    {lastVisit.prescription || "مفيش روشتة مسجلة في آخر زيارة"}
                  </p>
                  {lastVisit.diagnosis && (
                    <p className="mt-1 text-xs text-plum-900/50">التشخيص وقتها: {lastVisit.diagnosis}</p>
                  )}
                  {lastVisit.labResults && (
                    <p className="mt-1 text-xs text-plum-900/50">نتائج التحاليل: {lastVisit.labResults}</p>
                  )}
                  {lastVisit.nextVisitDate && (
                    <p className="mt-1 text-xs font-medium text-wine-600">
                      موعد المتابعة القادم: {new Date(lastVisit.nextVisitDate).toLocaleDateString("ar-EG")}
                    </p>
                  )}
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-wine-600">التاريخ المرضي</p>
                  <button
                    onClick={() => setShowEditCard(true)}
                    className="rounded-full border border-rose-400/30 px-3 py-1 text-xs text-wine-600 transition hover:bg-blush-100"
                  >
                    تعديل بيانات الكارت
                  </button>
                </div>
                {detail.profile && (
                  <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-rose-400/15 bg-white p-3 text-xs text-plum-900/70 sm:grid-cols-4">
                    <span>فصيلة الدم: {detail.profile.bloodType || "-"}</span>
                    <span>أمراض مزمنة: {detail.profile.chronicConditions || "-"}</span>
                    <span>حساسية: {detail.profile.allergies || "-"}</span>
                    <span>حامل: {detail.profile.isPregnant ? "نعم" : "لا"}</span>
                    <span>وظيفة المريضة: {detail.profile.occupation || "-"}</span>
                    <span>الأدوية الحالية: {detail.profile.currentMedications || "-"}</span>
                    <span>عمليات سابقة: {detail.profile.previousSurgeries || "-"}</span>
                    <span>تاريخ الحمل والولادة: {detail.profile.obstetricHistory || "-"}</span>
                    <span>تاريخ العائلة: {detail.profile.familyHistory || "-"}</span>
                    <span>اسم الزوج: {detail.profile.husbandName || "-"}</span>
                    <span>وظيفة الزوج: {detail.profile.husbandOccupation || "-"}</span>
                  </div>
                )}
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {detail.visits.map((v) => (
                    <div key={v.id} className="rounded-xl border border-rose-400/10 bg-white p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-wine-600">
                          {visitTypeLabels[v.visitType] || v.visitType}
                        </span>
                        <span className="text-xs text-plum-900/50">
                          {new Date(v.visitDate).toLocaleDateString("ar-EG")}
                        </span>
                      </div>
                      {v.diagnosis && <p className="text-xs text-plum-900/70">التشخيص: {v.diagnosis}</p>}
                      {v.prescription && (
                        <p className="text-xs text-plum-900/70">الروشتة: {v.prescription}</p>
                      )}
                      {v.labResults && (
                        <p className="text-xs text-plum-900/70">نتائج التحاليل: {v.labResults}</p>
                      )}
                      {v.nextVisitDate && (
                        <p className="text-xs text-wine-600">
                          موعد المتابعة: {new Date(v.nextVisitDate).toLocaleDateString("ar-EG")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <label className="mb-1 block text-sm text-plum-900/70">التشخيص</label>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="mb-4 w-full rounded-xl border border-rose-400/30 p-2 focus:border-wine-500 focus:outline-none"
            rows={2}
          />

          <label className="mb-1 block text-sm text-plum-900/70">الروشتة</label>
          <textarea
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
            className="mb-4 w-full rounded-xl border border-rose-400/30 p-2 focus:border-wine-500 focus:outline-none"
            rows={3}
          />

          <label className="mb-1 block text-sm text-plum-900/70">نتائج التحاليل</label>
          <textarea
            value={labResults}
            onChange={(e) => setLabResults(e.target.value)}
            placeholder="سجّلي نتائج التحاليل أو السونار هنا"
            className="mb-4 w-full rounded-xl border border-rose-400/30 p-2 focus:border-wine-500 focus:outline-none"
            rows={2}
          />

          <label className="mb-1 block text-sm text-plum-900/70">ملاحظات الدكتور</label>
          <textarea
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            className="mb-4 w-full rounded-xl border border-rose-400/30 p-2 focus:border-wine-500 focus:outline-none"
            rows={2}
          />

          <label className="mb-1 block text-sm text-plum-900/70">موعد المتابعة القادم</label>
          <input
            type="date"
            value={nextVisitDate}
            onChange={(e) => setNextVisitDate(e.target.value)}
            className="mb-4 w-full rounded-xl border border-rose-400/30 p-2 focus:border-wine-500 focus:outline-none sm:w-60"
          />

          <button
            onClick={completeVisit}
            className="rounded-full bg-sage-500 px-6 py-2 font-medium text-white transition hover:bg-sage-400"
          >
            إنهاء الكشف وإرسال الروشتة
          </button>
        </div>
      )}

      <section className="mt-8">
        <h3 className="mb-2 font-display font-semibold text-wine-600">قائمة الانتظار</h3>
        <ol className="space-y-2">
          {waiting.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-xl border border-rose-400/10 bg-white p-2 shadow-soft"
            >
              <span className="queue-badge h-8 w-8 flex-shrink-0 text-sm font-bold">
                {a.queueNumber}
              </span>
              {a.patient.name}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
