import Image from "next/image";
import Link from "next/link";
import ClinicMark from "@/components/ClinicMark";
import {
  CLINIC_ADDRESS,
  CLINIC_NAME,
  CLINIC_PHONE,
  CLINIC_SOCIAL_LABEL,
  CLINIC_SOCIAL_URL,
  CLINIC_TAGLINE,
  DOCTOR_NAME,
  DOCTOR_TITLE,
} from "@/lib/clinicInfo";

// الترتيب زي ما اتطلب: حجز - الانتظار - الملف الطبي - الريسبشن - الدكتور
const links = [
  {
    href: "/book",
    label: "احجزي دورك",
    desc: "حجز أونلاين مع معرفة الوقت المتوقع والدور",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
        <path
          d="M12 21c4.5-4 8-7.5 8-11.5A8 8 0 0 0 4 9.5C4 13.5 7.5 17 12 21Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/queue-display",
    label: "شاشة الانتظار",
    desc: "العرض العام لدور الحجز داخل العيادة",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
        <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 20h6M12 16v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "ملفك الطبي",
    desc: "بديل الكرت الورقي — بياناتك وتاريخك محفوظين",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
        <path
          d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/reception",
    label: "لوحة الريسبشن",
    desc: "تسجيل الحضور وإدارة أحداث العيادة",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
        <path
          d="M4 19V7a2 2 0 0 1 2-2h9l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/doctor",
    label: "لوحة الدكتور",
    desc: "نداء المريضات وتسجيل الكشف والروشتة",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
        <path
          d="M8 3v6a4 4 0 0 0 8 0V3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M8 9c0 4-3 4-3 8a5 5 0 0 0 10 0v-2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="18" cy="16" r="2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
];

const staffOnly = ["/reception", "/doctor"];

export default function HomePage() {
  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-blush-50 font-body">
      {/* زخرفة القوس المتكررة في الخلفية - الموتيف المميز للثيم */}
      <svg
        className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] text-rose-400/20"
        viewBox="0 0 400 400"
        fill="none"
      >
        <path
          d="M200 20a180 180 0 1 0 127 307"
          stroke="currentColor"
          strokeWidth="40"
          strokeLinecap="round"
        />
      </svg>
      <svg
        className="pointer-events-none absolute -bottom-32 -right-32 h-[380px] w-[380px] text-wine-500/10"
        viewBox="0 0 400 400"
        fill="none"
      >
        <path
          d="M200 20a180 180 0 1 0 127 307"
          stroke="currentColor"
          strokeWidth="60"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative mx-auto max-w-5xl px-6 py-14 sm:py-20">
        {/* ===== قسم البطل: صورة الدكتور + هوية العيادة ===== */}
        <header className="mb-16 overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-wine-700 via-wine-600 to-wine-500 shadow-xl">
          <div className="grid items-center gap-8 p-8 sm:p-10 md:grid-cols-[auto_1fr] md:gap-12 md:p-14">
            <div className="premium-photo-ring mx-auto w-44 shrink-0 sm:w-52 md:mx-0">
              <Image
                src="/doctor-crop.jpg"
                alt={DOCTOR_NAME}
                width={530}
                height={717}
                priority
                className="h-auto w-full object-cover"
              />
            </div>

            <div className="text-center md:text-right">
              <div className="mb-3 flex items-center justify-center gap-2 md:justify-start">
                <div className="queue-badge h-9 w-9 flex-shrink-0 text-base font-display font-semibold">
                  <ClinicMark />
                </div>
                <p className="text-sm font-medium uppercase tracking-widest text-gold-400">
                  {CLINIC_TAGLINE}
                </p>
              </div>
              <h1 className="font-display text-3xl font-semibold text-blush-50 sm:text-4xl">
                {CLINIC_NAME}
              </h1>
              <p className="mt-2 font-display text-xl font-medium text-blush-100">{DOCTOR_NAME}</p>
              <p className="mt-1 text-sm text-blush-100/80">{DOCTOR_TITLE}</p>

              <div className="mx-auto mt-5 h-px w-16 bg-gold-400/60 md:mx-0" />

              <div className="mt-5 flex flex-col gap-2 text-sm text-blush-100/90 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
                <span className="inline-flex items-center justify-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0">
                    <path
                      d="M12 21c4.5-4 8-7.5 8-11.5A8 8 0 0 0 4 9.5C4 13.5 7.5 17 12 21Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                  {CLINIC_ADDRESS}
                </span>
                <span className="hidden sm:inline text-blush-100/40">|</span>
                <a href={`tel:${CLINIC_PHONE}`} dir="ltr" className="inline-flex items-center justify-center gap-1.5 hover:text-gold-400">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0">
                    <path
                      d="M6.6 10.8c1.4 2.8 3.7 5.1 6.5 6.5l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.3 1L6.6 10.8Z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                  {CLINIC_PHONE}
                </a>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative overflow-hidden rounded-[1.75rem] border border-rose-400/15 bg-white p-7 shadow-soft transition duration-300 hover:-translate-y-1.5 hover:border-gold-400/40 hover:shadow-xl"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blush-100 text-wine-600 transition group-hover:bg-wine-600 group-hover:text-blush-50">
                {link.icon}
              </div>
              <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-wine-700">
                {link.label}
                {staffOnly.includes(link.href) && (
                  <span className="rounded-full bg-blush-100 px-2 py-0.5 text-[10px] font-normal text-wine-500">
                    للموظفين فقط
                  </span>
                )}
              </h2>
              <p className="text-sm leading-relaxed text-plum-900/60">{link.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-rose-500 opacity-0 transition group-hover:opacity-100">
                فتح ←
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={CLINIC_SOCIAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-white px-6 py-3 font-medium text-wine-700 shadow-soft transition hover:-translate-y-0.5 hover:bg-blush-100"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M14 8.5h2.5V5h-2.5c-2.2 0-4 1.8-4 4v2H8v3.5h2v6.5h3.5v-6.5h2.4l.6-3.5h-3V9c0-.4.3-.5.5-.5Z"
                fill="currentColor"
              />
            </svg>
            {CLINIC_SOCIAL_LABEL}
          </a>
        </div>

        <p className="mt-10 text-center text-xs text-plum-900/40">
          نظام داخلي لإدارة الطابور والحجوزات — {CLINIC_NAME}
        </p>
      </div>
    </main>
  );
}

