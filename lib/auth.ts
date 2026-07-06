import { cookies } from "next/headers";

export type StaffRole = "doctor" | "reception";

// بيرجع دور الموظف الحالي (دكتور/ريسبشن) من الكوكي، أو null لو مش مسجل دخول
export function getStaffRole(): StaffRole | null {
  const value = cookies().get("staff_session")?.value;
  if (value === "doctor" || value === "reception") return value;
  return null;
}
