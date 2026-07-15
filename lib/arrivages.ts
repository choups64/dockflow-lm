import { supabase } from "@/lib/supabase";

export type LignePreparation = {
  referenceLM: string;
  designation: string;
  quantite: number;
  destination?: string;
  nombre_palettes?: number;
  ean?: string | null;
};

export type ArrivagePreparation = {
  commande: string;
  fournisseur: string;
  dateLivraison: string | null;
  lignes: LignePreparation[];
};

export async function creerArrivagePreparation(data: ArrivagePreparation) {
  const { data: arrivage, error } = await supabase.from("arrivages").insert({
    commande: data.commande,
    fournisseur: data.fournisseur,
    date_arrivee: data.dateLivraison,
    statut: "EN_PREPARATION",
  }).select().single();

  if (error) throw error;

  if (data.lignes.length) {
    const lignes = data.lignes.map(l => ({
      arrivage_id: arrivage.id,
      reference_lm: l.referenceLM,
      designation: l.designation,
      quantite: l.quantite,
      destination: l.destination ?? null,
      nombre_palettes: l.nombre_palettes ?? 1,
      ean: l.ean ?? null,
    }));

    const { error: e2 } = await supabase.from("arrivage_lignes").insert(lignes);
    if (e2) throw e2;
  }

  return arrivage;
}

export async function getArrivageById(id:string){
  const {data,error}=await supabase.from("arrivages").select("*").eq("id",id).single();
  if(error) throw error;
  return data;
}

export async function getLignesArrivage(arrivageId:string){
  const {data,error}=await supabase.from("arrivage_lignes").select("*").eq("arrivage_id",arrivageId).order("created_at");
  if(error) throw error;
  return data;
}

export async function updateArrivage(id:string,data:ArrivagePreparation){
  const {error}=await supabase.from("arrivages").update({
    commande:data.commande,
    fournisseur:data.fournisseur,
    date_arrivee:data.dateLivraison,
    updated_at:new Date().toISOString(),
  }).eq("id",id);
  if(error) throw error;

  await supabase.from("arrivage_lignes").delete().eq("arrivage_id",id);

  const lignes=data.lignes.map(l=>({
    arrivage_id:id,
    reference_lm:l.referenceLM,
    designation:l.designation,
    quantite:l.quantite,
    destination:l.destination ?? null,
    nombre_palettes:l.nombre_palettes ?? 1,
    ean:l.ean ?? null,
  }));

  if(lignes.length){
    const {error:e2}=await supabase.from("arrivage_lignes").insert(lignes);
    if(e2) throw e2;
  }
}

export async function deleteArrivage(id:string){
  const {error}=await supabase.from("arrivages").delete().eq("id",id);
  if(error) throw error;
}
