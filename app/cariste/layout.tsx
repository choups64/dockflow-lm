import type { ReactNode } from "react";
import ProfileRoleGuard from "@/components/auth/ProfileRoleGuard";

export default function CaristeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ProfileRoleGuard roles={["CARISTE"]} />
      {children}
    </>
  );
}
