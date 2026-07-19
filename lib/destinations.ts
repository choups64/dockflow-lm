import { supabase } from "@/lib/supabase";

export type Destination = {
  id: number;
  code: string;
  nom: string;
};

export async function getDestinations(magasinId?: string) {
  let query = supabase
    .from("destinations")
    .select("*")
    .eq("actif", true)
    .order("id");

  if (magasinId) query = query.eq("magasin_id", magasinId);
  const { data, error } = await query;

  if (error) throw error;

  return data as Destination[];
}
