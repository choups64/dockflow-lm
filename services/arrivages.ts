import { supabase } from "@/lib/supabase";
import { ArrivageForm } from "@/lib/validators";

export class ArrivagesService {
  static async create(data: ArrivageForm) {
    // 1 - Création de l'arrivage
    const { data: arrivage, error } = await supabase
      .from("arrivages")
      .insert({
        commande: data.numero_commande,
        rayon_id: data.rayon_id,
        date_mise_en_magasin: data.date_mise_en_magasin,
        commentaire: data.commentaire,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      throw error;
    }

    // 2 - Création des destinations
    const destinations = data.destinations.map((d) => ({
      arrivage_id: arrivage.id,
      destination_id: d.destination_id,
      nombre_palettes: d.nb_palettes,
    }));

    const { error: errorDestinations } = await supabase
      .from("arrivage_destinations")
      .insert(destinations);

    if (errorDestinations) {
      console.error(errorDestinations);
      throw errorDestinations;
    }

    return arrivage;
  }
}