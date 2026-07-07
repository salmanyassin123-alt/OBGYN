// شاشة الانتظار محتاجة تتحدث لحظيًا (Realtime)، فمفيش داعي إن Next.js
// يحاول يبنيها مسبقًا وقت الـ build. السطر ده بيمنع ده، وبيمنع كمان
// إن أي مشكلة في متغيرات Supabase توقف الـ build كله.
export const dynamic = "force-dynamic";

import QueueDisplayClient from "./QueueDisplayClient";

export default function QueueDisplayPage() {
  return <QueueDisplayClient />;
}
