"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProfileService } from "@/services/profile";

type ProfileRoleGuardProps = {
  roles: string[];
};

export default function ProfileRoleGuard({ roles }: ProfileRoleGuardProps) {
  const router = useRouter();

  useEffect(() => {
    let actif = true;

    async function verifierProfil() {
      try {
        const profil = await ProfileService.getCurrentProfile();
        if (actif && !roles.includes(profil.role)) {
          router.replace(profil.role === "RR" ? "/dashboard" : profil.role === "CARISTE" ? "/cariste" : "/");
        }
      } catch {
        if (actif) router.replace("/");
      }
    }

    void verifierProfil();
    return () => {
      actif = false;
    };
  }, [roles, router]);

  return null;
}
