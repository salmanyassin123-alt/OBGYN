"use client";

import { useState } from "react";
import ClinicMark from "@/components/ClinicMark";

type Visit = {
  id: string;
  visitDate: string;
  visitType: string;
  diagnosis: string | null;
  prescription: string | null;
  doctorNotes: string | null;
  nextVisitDate: string | null;
  labResults: string | null;
};

type ProfileData = {
  name: string;
  phone: string;
  profile: {
    dateOfBirth: string | null;
    bloodType: string | null;
    chronicConditions: string | null;
    allergies: string | null;
    isPregnant: boolean;
    lastPeriodDate: string | null;
    privacyMode: boolean;
    occupation: string | null;
    currentMedications: string | null;
    previousSurgeries: string | null;
    obstetricHistory: string | null;
    familyHistory: string | null;
    husbandName: string | null;
    husbandOccupation: string | null;
    visits?: Visit[];
  } | null;
};

const visitTypeLabels: Record<string, string> = {
  CHECKUP: "كشف عادي",
  ANTENATAL_FOLLOWUP: "متابعة حمل",
  ULTRASOUND: "سونار",
  EMERGENCY: "حالة طارئة",
  DELIVERY: "ولادة",
  POSTNATAL: "متابعة بعد الولادة",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-rose-400/10 py-2.5 last:border-0">
      <span className="text-sm text-plum-900/60">{label}</span>
      <span className="text-sm font-medium text-plum-900">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const [phone, setPhone] = useState("");
  const [data, setData] = useState<ProfileData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  async function lookup() {
    if (!phone.trim()) return;
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(`/api/profile?phone=${encodeURIComponent(phone)}`);
      if (res.status === 404) {
        setNotFound(true);
        setData(null);
        return;
      }
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  const profile = data?.profile;

  return (
    <main dir="rtl" className="min-h-screen bg-blush-50 p-6 font-body">
      <div className="mx-auto max-w-lg pt-8">
        <div className="mb-6 text-center">
          <div className="queue-badge mx-auto mb-4 h-14 w-14 text-xl font-display font-semibold">
            <ClinicMark />
          </div>
          <h1 className="font-display text-2xl font-semibold text-wine-700">ملفك الطبي</h1>
          <p className="mt-1 text-sm text-plum-900/60">بديل الكرت الورقي — بياناتك وتاريخك محفوظين</p>
          <div className="arc-divider mx-auto mt-3" />
        </div>

        <div className="mb-4 flex gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            dir="ltr"
            className="flex-1 rounded-xl border border-rose-400/30 bg-white p-2 text-right focus:border-wine-500 focus:outline-none"
            placeholder="ادخلي رقم هاتفك"
          />
          <button
            onClick={lookup}
            disabled={loading}
            className="rounded-xl bg-wine-600 px-5 py-2 text-white transition hover:bg-wine-700 disabled:opacity-50"
          >
            {loading ? "جاري البحث..." : "بحث"}
          </button>
        </div>

        {notFound && (
          <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-plum-900">
            مفيش ملف مسجل بالرقم ده لسه. هيتم إنشاء ملفك تلقائيًا عند أول زيارة للعيادة.
          </div>
        )}

        {data && (
          <>
            {/* بيانات العرض فقط - من غير خانات كتابة أو إدخال */}
            <div className="rounded-2xl border border-rose-400/20 bg-white p-6 shadow-soft">
              <h2 className="mb-1 font-display text-lg font-semibold text-wine-700">{data.name}</h2>
              <p className="mb-4 text-xs text-plum-900/40" dir="ltr">
                {data.phone}
              </p>

              {profile ? (
                <div>
                  <InfoRow
                    label="تاريخ الميلاد"
                    value={
                      profile.dateOfBirth
                        ? new Date(profile.dateOfBirth).toLocaleDateString("ar-EG")
                        : "غير مسجل"
                    }
                  />
                  <InfoRow label="فصيلة الدم" value={profile.bloodType || "غير مسجلة"} />
                  <InfoRow label="أمراض مزمنة" value={profile.chronicConditions || "لا يوجد"} />
                  <InfoRow label="حساسية من أدوية" value={profile.allergies || "لا يوجد"} />
                  <InfoRow label="حامل حاليًا" value={profile.isPregnant ? "نعم" : "لا"} />
                  {profile.isPregnant && (
                    <InfoRow
                      label="تاريخ آخر دورة (LMP)"
                      value={
                        profile.lastPeriodDate
                          ? new Date(profile.lastPeriodDate).toLocaleDateString("ar-EG")
                          : "غير مسجل"
                      }
                    />
                  )}
                  <InfoRow label="وظيفة المريضة" value={profile.occupation || "غير مسجلة"} />
                  <InfoRow label="الأدوية الحالية" value={profile.currentMedications || "لا يوجد"} />
                  <InfoRow label="عمليات جراحية سابقة" value={profile.previousSurgeries || "لا يوجد"} />
                  <InfoRow
                    label="تاريخ الحمل والولادة السابق"
                    value={profile.obstetricHistory || "غير مسجل"}
                  />
                  <InfoRow label="تاريخ الأمراض في العائلة" value={profile.familyHistory || "لا يوجد"} />
                  <InfoRow label="اسم الزوج" value={profile.husbandName || "غير مسجل"} />
                  <InfoRow label="وظيفة الزوج" value={profile.husbandOccupation || "غير مسجلة"} />
                </div>
              ) : (
                <p className="text-sm text-plum-900/50">
                  لسه معندناش بيانات كارت مسجلة — هتتسجل مع الدكتور في أول زيارة.
                </p>
              )}
            </div>

            {/* تقرير الدكتور - سجل الزيارات لو فيه حاجة */}
            {profile?.visits && profile.visits.length > 0 ? (
              <div className="mt-6">
                <h2 className="mb-3 font-display text-lg font-semibold text-wine-600">تقرير الدكتور</h2>
                <div className="space-y-3">
                  {profile.visits.map((v) => (
                    <div
                      key={v.id}
                      className="rounded-xl border border-rose-400/15 bg-white p-4 shadow-soft"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-wine-600">
                          {visitTypeLabels[v.visitType] || v.visitType}
                        </span>
                        <span className="text-xs text-plum-900/50">
                          {new Date(v.visitDate).toLocaleDateString("ar-EG")}
                        </span>
                      </div>
                      {v.diagnosis && (
                        <p className="text-sm text-plum-900/70">التشخيص: {v.diagnosis}</p>
                      )}
                      {v.prescription && (
                        <p className="text-sm text-plum-900/70">الروشتة: {v.prescription}</p>
                      )}
                      {v.labResults && (
                        <p className="text-sm text-plum-900/70">نتائج التحاليل: {v.labResults}</p>
                      )}
                      {v.doctorNotes && (
                        <p className="mt-1 text-sm text-plum-900/60">ملاحظات الدكتور: {v.doctorNotes}</p>
                      )}
                      {v.nextVisitDate && (
                        <p className="mt-1 text-xs text-wine-500">
                          موعد المتابعة القادم: {new Date(v.nextVisitDate).toLocaleDateString("ar-EG")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-6 text-center text-sm text-plum-900/40">
                لسه معندناش تقرير من الدكتور — هيظهر هنا بعد أول كشف.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
