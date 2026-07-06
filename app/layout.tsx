import "./globals.css";
import { CLINIC_NAME } from "@/lib/clinicInfo";

export const metadata = {
  title: CLINIC_NAME,
  description: `نظام حجز وإدارة طابور - ${CLINIC_NAME}`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
