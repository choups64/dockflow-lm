import { supabase } from "@/lib/supabase";

export const RayonsService = {

  async getAll() {
    return await supabase
      .from("rayons")
      .select("*")
      .order("id");
  },

};