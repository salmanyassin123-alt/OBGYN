"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ClinicMark from "@/components/ClinicMark";

type DailyStats = {
  period: "daily";
  date: string;
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  byPriority: Record<string, number>;
  avgWaitMinutes: number | null;
};

type MonthlyStats = {
  period: "monthly";
  month: string;
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  byVisitType: Record<string, number>;
  newPatients: number;
  returningPatients: number;
  dailyCounts: { date: string; count: number }[];
};

const statusLabels: Record<string, string> = {
  WAITING: "في الانتظار",
  CALLED: "تم النداء",
  IN_PROGRESS: "جاري الكشف",
  COMPLETED: "مكتملة",
  CANCELLED: "ملغاة",
  NO_SHOW: "غياب",
};

const priorityLabels: Record<string, string> = {
  EMERGENCY: "طارئة",
  FOLLOWUP_URGENT: "متابعة عاجلة",
  NORMAL: "عادي",
};

const visitTypeLabels: Record<string, string> = {
  CHECKUP: "كشف عادي",
  ANTENATAL_FOLLOWUP: "متابعة حمل",
  ULTRASOUND: "سونار",
  EMERGENCY: "حالة طارئة",
  DELIVERY: "ولادة",
  POSTNATAL: "متابعة بعد الولادة",
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-rose-400/20 bg-white p-4 shadow-soft">
      <p className="mb-1 text-xs text-plum-900/50">{label}</p>
      <p className="font-display text-2xl font-semibold text-wine-700">{value}</p>
    </div>
  );
}

function BreakdownList({
  title,
  data,
  labels,
}: {
  title: string;
  data: Record<string, number>;
  labels: Record<string, string>;
}) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  return (
    <div className="rounded-2xl border border-rose-400/20 bg-white p-4 shadow-soft">
      <p className="mb-3 text-sm font-semibold text-wine-600">{title}</p>
      {entries.length === 0 ? (
        <p className="text-sm text-plum-900/40">لا يوجد بيانات</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([key, count]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-plum-900/70">{labels[key] || key}</span>
              <span className="font-medium text-wine-700">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function thisMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function DoctorStatsPage() {
  const [tab, setTab] = useState<"daily" | "monthly">("daily");
  const [date, setDate] = useState(todayISO());
  const [month, setMonth] = useState(thisMonthStr());
  const [daily, setDaily] = useState<DailyStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchDaily(d: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/stats?period=daily&date=${d}`);
      if (!res.ok) {
        setError("مش متاح تشوف الإحصائيات دي");
        return;
      }
      setDaily(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function fetchMonthly(m: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/stats?period=monthly&month=${m}`);
      if (!res.ok) {
        setError("مش متاح تشوف الإحصائيات دي");
        return;
      }
      setMonthly(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "daily") fetchDaily(date);
    else fetchMonthly(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const maxDailyCount = monthly
    ? Math.max(1, ...monthly.dailyCounts.map((d) => d.count))
    : 1;

  return (
    <main dir="rtl" className="min-h-screen bg-blush-50 p-6 font-body">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="queue-badge h-10 w-10 flex-shrink-0 text-base font-display">
            <ClinicMark />
          </div>
          <h1 className="font-display text-2xl font-semibold text-wine-700">الإحصائيات</h1>
        </div>
        <Link
          href="/doctor"
          className="rounded-full border border-rose-400/30 px-4 py-1.5 text-sm text-plum-900/60 transition hover:bg-blush-100"
        >
          رجوع للوحة الدكتور
        </Link>
      </div>
      <div className="arc-divider mb-6" />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-full border border-rose-400/30 bg-white">
          <button
            onClick={() => setTab("daily")}
            className={`px-5 py-2 text-sm font-medium transition ${
              tab === "daily" ? "bg-wine-600 text-white" : "text-plum-900/60 hover:bg-blush-100"
            }`}
          >
            يومي
          </button>
          <button
            onClick={() => setTab("monthly")}
            className={`px-5 py-2 text-sm font-medium transition ${
              tab === "monthly" ? "bg-wine-600 text-white" : "text-plum-900/60 hover:bg-blush-100"
            }`}
          >
            شهري
          </button>
        </div>

        {tab === "daily" ? (
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              fetchDaily(e.target.value);
            }}
            className="rounded-full border border-rose-400/30 bg-white px-4 py-2 text-sm focus:border-wine-500 focus:outline-none"
          />
        ) : (
          <input
            type="month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              fetchMonthly(e.target.value);
            }}
            className="rounded-full border border-rose-400/30 bg-white px-4 py-2 text-sm focus:border-wine-500 focus:outline-none"
          />
        )}
      </div>

      {loading && <p className="mb-4 text-sm text-plum-900/50">جاري تحميل الإحصائيات...</p>}
      {error && (
        <div className="mb-4 rounded-xl border border-wine-600/30 bg-wine-600/5 p-3 text-sm text-wine-700">
          {error}
        </div>
      )}

      {/* ===== يومي ===== */}
      {tab === "daily" && daily && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="إجمالي الحجوزات" value={daily.total} />
            <StatCard label="حالات مكتملة" value={daily.byStatus.COMPLETED || 0} />
            <StatCard label="حالات غياب" value={daily.byStatus.NO_SHOW || 0} />
            <StatCard
              label="متوسط وقت الانتظار"
              value={daily.avgWaitMinutes !== null ? `${daily.avgWaitMinutes} دقيقة` : "-"}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <BreakdownList title="الحالة" data={daily.byStatus} labels={statusLabels} />
            <BreakdownList
              title="مصدر الحجز"
              data={daily.bySource}
              labels={{ ONLINE: "أونلاين", WALK_IN: "حضوري" }}
            />
            <BreakdownList title="الأولوية" data={daily.byPriority} labels={priorityLabels} />
          </div>
        </div>
      )}

      {/* ===== شهري ===== */}
      {tab === "monthly" && monthly && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="إجمالي الحجوزات" value={monthly.total} />
            <StatCard label="حالات مكتملة" value={monthly.byStatus.COMPLETED || 0} />
            <StatCard label="مريضات جديدة" value={monthly.newPatients} />
            <StatCard label="حالات متابعة" value={monthly.returningPatients} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <BreakdownList title="الحالة" data={monthly.byStatus} labels={statusLabels} />
            <BreakdownList
              title="مصدر الحجز"
              data={monthly.bySource}
              labels={{ ONLINE: "أونلاين", WALK_IN: "حضوري" }}
            />
            <BreakdownList title="نوع الزيارة" data={monthly.byVisitType} labels={visitTypeLabels} />
          </div>

          <div className="rounded-2xl border border-rose-400/20 bg-white p-4 shadow-soft">
            <p className="mb-3 text-sm font-semibold text-wine-600">عدد الحجوزات يوم بيوم</p>
            <div className="flex h-32 items-end gap-1 overflow-x-auto">
              {monthly.dailyCounts.map((d) => (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.count}`}
                  className="flex min-w-[10px] flex-1 flex-col items-center justify-end"
                >
                  <div
                    className="w-full rounded-t bg-wine-500/70"
                    style={{ height: `${(d.count / maxDailyCount) * 100}%`, minHeight: d.count > 0 ? "3px" : "0" }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-plum-900/40">
              <span>1</span>
              <span>{monthly.dailyCounts.length}</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
