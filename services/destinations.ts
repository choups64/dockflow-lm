import { supabase } from "@/lib/supabase";

export const DestinationsService = {

  async getAll() {
    return await supabase
      .from("destinations")
      .select("*")
      .order("id");
  },

};