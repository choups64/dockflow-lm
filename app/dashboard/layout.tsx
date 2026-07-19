import type { ReactNode } from "react";
import ProfileRoleGuard from "@/components/auth/ProfileRoleGuard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ProfileRoleGuard roles={["RR", "ADMIN"]} />
      {children}
    </>
  );
}
