import { supabase } from "@/lib/supabase";

export interface CurrentProfile {
  id: string;
  email: string;
  role: string;
  prenom: string | null;
  magasinId: string | null;
  magasin: { id: string; code: string; nom: string; ville: string | null; actif: boolean } | null;
  adminScope: "MAGASIN" | "NATIONAL" | null;
  actif: boolean;
  rayons: {
    id: number;
    code: string;
    nom: string;
    magasin_id: string;
    actif: boolean;
  }[];
}

type ProfileRayonRow = {
  rayon: CurrentProfile["rayons"][number] | CurrentProfile["rayons"] | null;
};

export class ProfileService {
  static async getCurrentProfile(): Promise<CurrentProfile> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      throw error ?? new Error("Profil introuvable");
    }

    if (profile.actif === false) {
      throw new Error("Votre compte DockFlow est désactivé.");
    }

    const magasinId = typeof profile.magasin_id === "string" ? profile.magasin_id : null;
    const { data: magasin, error: magasinError } = magasinId
      ? await supabase.from("magasins").select("id, code, nom, ville, actif").eq("id", magasinId).maybeSingle()
      : { data: null, error: null };

    if (magasinError) throw magasinError;

    const { data: rayons, error: rayonError } = await supabase
      .from("profile_rayons")
      .select(`
        rayon:rayons (
          id,
          code,
          nom,
          magasin_id,
          actif
        )
      `)
      .eq("profile_id", user.id);

    if (rayonError) {
      throw rayonError;
    }

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      prenom: typeof profile.prenom === "string" ? profile.prenom : null,
      magasinId,
      magasin: magasin as CurrentProfile["magasin"],
      adminScope: profile.admin_scope === "MAGASIN" || profile.admin_scope === "NATIONAL" ? profile.admin_scope : null,
      actif: profile.actif !== false,
      rayons: ((rayons ?? []) as unknown as ProfileRayonRow[]).flatMap(({ rayon }) => {
        if (Array.isArray(rayon)) return rayon;
        return rayon ? [rayon] : [];
      }),
    };
  }

  static async getCurrentUserRayons() {
    const profil = await this.getCurrentProfile();
    if (profil.role !== "RR") throw new Error("Cette page est réservée aux responsables de rayon.");

    return profil.rayons
      .filter((rayon) => rayon.actif && rayon.magasin_id === profil.magasinId)
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  static async assertCurrentUserCanUseRayon(rayonId: number) {
    const rayon = (await this.getCurrentUserRayons()).find((item) => item.id === rayonId);
    if (!rayon) throw new Error("Vous n’êtes pas autorisé à créer un arrivage pour ce rayon.");
    return rayon;
  }
}
