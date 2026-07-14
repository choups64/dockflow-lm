import { supabase } from "@/lib/supabase";

export type LignePreparation = {
  referenceLM: string;
  designation: string;
  quantite: number;
};

export type ArrivagePreparation = {
  commande: string;
  fournisseur: string;
  dateLivraison: string | null;
  lignes: LignePreparation[];
};

export async function creerArrivagePreparation(
  data: ArrivagePreparation
) {
  const { data: arrivage, error } = await supabase
    .from("arrivages")
    .insert({
      commande: data.commande,
      fournisseur: data.fournisseur,
      date_arrivee: data.dateLivraison,
      statut: "EN_PREPARATION",
      nombre_total_palettes: 0,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    throw error;
  }

  return arrivage;
}