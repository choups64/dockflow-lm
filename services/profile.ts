import { supabase } from "@/lib/supabase";

export interface CurrentProfile {
  id: string;
  email: string;
  role: string;
  prenom: string | null;
  rayons: {
    id: number;
    code: string;
    nom: string;
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

    const { data: rayons, error: rayonError } = await supabase
      .from("profile_rayons")
      .select(`
        rayon:rayons (
          id,
          code,
          nom
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
      rayons: ((rayons ?? []) as unknown as ProfileRayonRow[]).flatMap(({ rayon }) => {
        if (Array.isArray(rayon)) return rayon;
        return rayon ? [rayon] : [];
      }),
    };
  }
}
