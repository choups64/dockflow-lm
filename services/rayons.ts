import { supabase } from "@/lib/supabase";

export const RayonsService = {

  async getAll(magasinId?: string) {
    let query = supabase
      .from("rayons")
      .select("*")
      .order("id");

    if (magasinId) query = query.eq("magasin_id", magasinId);
    return await query;
  },

};
