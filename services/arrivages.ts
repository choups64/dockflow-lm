import { supabase } from "@/lib/supabase";
import { ArrivageForm } from "@/lib/validators";
import { ProfileService } from "@/services/profile";

export class ArrivagesService {

  static async create(data: ArrivageForm) {
    const profil = await ProfileService.getCurrentProfile();
    if (!profil.magasinId) throw new Error("Aucun magasin n'est associé à votre profil.");
    await ProfileService.assertCurrentUserCanUseRayon(data.rayon_id);

    const { data: arrivage, error } = await supabase
      .from("arrivages")
      .insert({
        commande: data.numero_commande,
        rayon_id: data.rayon_id,
        date_mise_en_magasin: data.date_mise_en_magasin,
        commentaire: data.commentaire,
        statut: "EN_PREPARATION",
        magasin_id: profil.magasinId,
      })
      .select()
      .single();

    if (error) throw error;

    if (data.destinations.length) {
      const destinations = data.destinations.map((d) => ({
        arrivage_id: arrivage.id,
        destination_id: d.destination_id,
        nombre_palettes: d.nb_palettes,
      }));

      const { error: err } = await supabase
        .from("arrivage_destinations")
        .insert(destinations);

      if (err) throw err;
    }

    return arrivage;
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from("arrivages")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getLignes(id: string) {
    const { data, error } = await supabase
      .from("arrivage_lignes")
      .select("*")
      .eq("arrivage_id", id)
      .order("created_at");

    if (error) throw error;
    return data;
  }

  static async update(id: string, values: Partial<ArrivageForm>) {
    const { error } = await supabase
      .from("arrivages")
      .update({
        commande: values.numero_commande,
        rayon_id: values.rayon_id,
        date_mise_en_magasin: values.date_mise_en_magasin,
        commentaire: values.commentaire,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from("arrivages")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}
