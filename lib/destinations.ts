import { supabase } from "@/lib/supabase";

export type Destination = {
  id: number;
  code: string;
  nom: string;
};

export async function getDestinations() {
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .order("id");

  if (error) throw error;

  return data as Destination[];
}