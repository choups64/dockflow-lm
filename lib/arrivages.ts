import { supabase } from "@/lib/supabase";
import { ProfileService } from "@/services/profile";

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
  RECEPTIONNEE: {
    libelle: "Réceptionnée",
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
  commentaireCariste?: string | null;
};

export type ArrivagePreparation = {
  commande: string;
  fournisseur: string;
  dateLivraison: string | null;
  rayonId: string;
  commentaire?: string | null;
  lignes: LignePreparation[];
};

type ArrivagePreparationMiseAJour = Omit<ArrivagePreparation, "rayonId">;

export async function creerArrivagePreparation(data: ArrivagePreparation) {
  console.log("[ARRIVAGE] Commande :", data.commande);
  console.log("[ARRIVAGE] Rayon reçu :", data.rayonId);

  const rayonId = Number(data.rayonId);
  const profil = await ProfileService.getCurrentProfile();

  if (!profil.magasinId) {
    throw new Error("Impossible de créer l'arrivage : aucun magasin n'est associé à votre profil.");
  }

  if (!Number.isInteger(rayonId) || rayonId <= 0) {
    console.error("[ARRIVAGE] Création bloquée : aucun rayon disponible");
    throw new Error(
      "Impossible de créer l'arrivage : aucun rayon n'est associé à votre profil."
    );
  }

  const rayon = await ProfileService.assertCurrentUserCanUseRayon(rayonId);

  console.log(`[ARRIVAGE] Rayon validé : ${rayon.code} - ${rayon.nom}`);
  console.log("[ARRIVAGE] Création avec rayon_id :", rayon.id);

  const { data: arrivage, error } = await supabase.from("arrivages").insert({
    commande: data.commande,
    fournisseur: data.fournisseur,
    date_arrivee: data.dateLivraison,
    commentaire: data.commentaire ?? null,
    statut: "EN_PREPARATION",
    rayon_id: rayon.id,
    magasin_id: profil.magasinId,
  }).select().single();

  if (error) throw error;

  console.log("[ARRIVAGE] Arrivage créé :", arrivage.id);

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
        commentaire_cariste: l.commentaireCariste?.trim() || null,
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
  data:ArrivagePreparationMiseAJour,
  statut?: StatutArrivage
){
  const {error}=await supabase.from("arrivages").update({
    commande:data.commande,
    fournisseur:data.fournisseur,
    date_arrivee:data.dateLivraison,
    commentaire:data.commentaire ?? null,
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
      commentaire_cariste:l.commentaireCariste?.trim() || null,
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
