import { supabase } from "@/lib/supabase";

export const STATUTS_ARRIVAGE = {
  EN_PREPARATION: {
    libelle: "En préparation",
    emoji: "🟡",
    badgeClassName: "bg-yellow-100 text-yellow-800",
  },
  PRET_A_RECEVOIR: {
    libelle: "Prêt à recevoir",
    emoji: "🟢",
    badgeClassName: "bg-green-100 text-green-800",
  },
  RECU: {
    libelle: "Reçu",
    emoji: "🔵",
    badgeClassName: "bg-blue-100 text-blue-800",
  },
} as const;

export type StatutArrivage = keyof typeof STATUTS_ARRIVAGE;

export function getStatutArrivage(statut: string | null | undefined) {
  return (
    STATUTS_ARRIVAGE[statut as StatutArrivage] ?? {
      libelle: statut ?? "Inconnu",
      emoji: "⚪",
      badgeClassName: "bg-slate-100 text-slate-800",
    }
  );
}

export type LignePreparation = {
  referenceLM: string;
  designation: string;
  quantite: number;
  repartitions?: {
    palettes: number;
    destination: string;
  }[];
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
    const lignes = data.lignes.flatMap(l =>
      (l.repartitions ?? [{ palettes: 1, destination: "" }]).map(r => ({
        arrivage_id: arrivage.id,
        reference_lm: l.referenceLM,
        designation: l.designation,
        quantite: l.quantite,
        destination: r.destination || null,
        nombre_palettes: r.palettes,
        ean: l.ean ?? null,
      }))
    );

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

export async function updateArrivage(
  id:string,
  data:ArrivagePreparation,
  statut?: StatutArrivage
){
  const {error}=await supabase.from("arrivages").update({
    commande:data.commande,
    fournisseur:data.fournisseur,
    date_arrivee:data.dateLivraison,
    ...(statut ? { statut } : {}),
    updated_at:new Date().toISOString(),
  }).eq("id",id);
  if(error) throw error;

  await supabase.from("arrivage_lignes").delete().eq("arrivage_id",id);

  const lignes=data.lignes.flatMap(l =>
    (l.repartitions ?? [{ palettes: 1, destination: "" }]).map(r => ({
      arrivage_id:id,
      reference_lm:l.referenceLM,
      designation:l.designation,
      quantite:l.quantite,
      destination:r.destination || null,
      nombre_palettes:r.palettes,
      ean:l.ean ?? null,
    }))
  );

  if(lignes.length){
    const {error:e2}=await supabase.from("arrivage_lignes").insert(lignes);
    if(e2) throw e2;
  }
}

export async function updateStatutArrivage(id: string, statut: StatutArrivage) {
  const { error } = await supabase
    .from("arrivages")
    .update({
      statut,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteArrivage(id:string){
  const {error}=await supabase.from("arrivages").delete().eq("id",id);
  if(error) throw error;
}
