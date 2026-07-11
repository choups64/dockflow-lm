import { supabase } from "@/lib/supabase";

export interface Arrivage {
  id?: string;
  commande: string;
  reference_lm?: string;
  ean?: string;
  produit?: string;
  rayon_id: number;
  destination_id: number;
  nombre_palettes: number;
  date_arrivee?: string;
  date_mise_en_magasin?: string;
  commentaire?: string;
}

export const ArrivagesService = {

  async getAll() {
    return await supabase
      .from("arrivages")
      .select(`
        *,
        rayons(code,nom),
        destinations(code,nom)
      `)
      .order("created_at", { ascending: false });
  },

  async getById(id: string) {
    return await supabase
      .from("arrivages")
      .select(`
        *,
        rayons(code,nom),
        destinations(code,nom)
      `)
      .eq("id", id)
      .single();
  },

  async create(arrivage: Arrivage) {
    return await supabase
      .from("arrivages")
      .insert(arrivage)
      .select()
      .single();
  },

  async update(id: string, arrivage: Partial<Arrivage>) {
    return await supabase
      .from("arrivages")
      .update(arrivage)
      .eq("id", id);
  },

  async delete(id: string) {
    return await supabase
      .from("arrivages")
      .delete()
      .eq("id", id);
  },

};