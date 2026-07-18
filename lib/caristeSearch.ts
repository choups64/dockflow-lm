import { supabase } from "@/lib/supabase";
import { RayonsService } from "@/services/rayons";

export type CaristeSearchType = "commande" | "reference" | "rayon";

export type Rayon = {
  id: number;
  code: string;
  nom: string;
};

export type Arrivage = {
  id: string;
  commande: string;
  fournisseur: string | null;
  date_arrivee: string | null;
  statut: string;
  rayon_id: number | null;
  rayon: Rayon | null;
};

export type LigneArrivage = {
  id: string;
  arrivage_id: string;
  reference_lm: string;
  designation: string | null;
  quantite: number;
  destination: string | null;
  ean: string | null;
  created_at: string;
  nombre_palettes: number;
};

export type DestinationRegroupee = {
  destination: string | null;
  nombre_palettes: number;
};

export type LigneRegroupee = {
  reference_lm: string;
  designation: string | null;
  totalPalettes: number;
  destinations: DestinationRegroupee[];
};

export type ResultatRecherche = {
  arrivage: Arrivage;
  lignes: LigneArrivage[];
};

const STATUTS_ACTIFS = [
  "EN_PREPARATION",
  "PREPARATION",
  "PRET_A_RECEVOIR",
] as const;

export function estTypeRechercheCariste(value: string | null): value is CaristeSearchType {
  return value === "commande" || value === "reference" || value === "rayon";
}

export function regrouperResultatsCariste(lignes: LigneArrivage[]): LigneRegroupee[] {
  return Array.from(
    lignes.reduce((groupes, ligne) => {
      const palettes = Number(ligne.nombre_palettes);
      const nombrePalettes = Number.isFinite(palettes) ? palettes : 0;
      let groupe = groupes.get(ligne.reference_lm);

      if (!groupe) {
        groupe = {
          reference_lm: ligne.reference_lm,
          designation: ligne.designation,
          totalPalettes: 0,
          destinations: [],
        };
        groupes.set(ligne.reference_lm, groupe);
      }

      const destinationExistante = groupe.destinations.find(
        (destination) => destination.destination === ligne.destination
      );

      if (destinationExistante) {
        destinationExistante.nombre_palettes += nombrePalettes;
      } else {
        groupe.destinations.push({
          destination: ligne.destination,
          nombre_palettes: nombrePalettes,
        });
      }

      groupe.totalPalettes += nombrePalettes;
      return groupes;
    }, new Map<string, LigneRegroupee>()).values()
  );
}

async function chargerLignes(arrivages: Arrivage[], referenceLM?: string): Promise<ResultatRecherche[]> {
  if (arrivages.length === 0) return [];

  let query = supabase
    .from("arrivage_lignes")
    .select("*")
    .in("arrivage_id", arrivages.map((arrivage) => arrivage.id));

  if (referenceLM) query = query.eq("reference_lm", referenceLM);

  const { data, error } = await query;
  if (error) throw error;

  const lignes = (data ?? []) as LigneArrivage[];
  return arrivages.map((arrivage) => ({
    arrivage,
    lignes: lignes.filter((ligne) => ligne.arrivage_id === arrivage.id),
  }));
}

async function rechercherParCommande(commande: string): Promise<ResultatRecherche[]> {
  const { data, error } = await supabase
    .from("arrivages")
    .select("*, rayon:rayons(id, code, nom)")
    .eq("commande", commande);

  if (error) throw error;
  return chargerLignes((data ?? []) as Arrivage[]);
}

async function rechercherParReferenceLM(referenceLM: string): Promise<ResultatRecherche[]> {
  const { data: lignesReference, error: erreurLignes } = await supabase
    .from("arrivage_lignes")
    .select("arrivage_id")
    .eq("reference_lm", referenceLM);

  if (erreurLignes) throw erreurLignes;

  const arrivageIds = [...new Set((lignesReference ?? []).map((ligne) => ligne.arrivage_id))];
  if (arrivageIds.length === 0) return [];

  const { data, error } = await supabase
    .from("arrivages")
    .select("*, rayon:rayons(id, code, nom)")
    .in("id", arrivageIds)
    .in("statut", STATUTS_ACTIFS);

  if (error) throw error;
  return chargerLignes((data ?? []) as Arrivage[], referenceLM);
}

async function rechercherParRayon(codeRayon: string): Promise<ResultatRecherche[]> {
  const { data: rayonsData, error: erreurRayons } = await RayonsService.getAll();
  if (erreurRayons) throw erreurRayons;

  const rayon = (rayonsData ?? []).find((item) => item.code === codeRayon) as Rayon | undefined;
  console.log("[RAYON] Rayon sélectionné :", codeRayon);
  console.log("[RAYON] Identifiant rayon résolu :", rayon?.id);
  if (!rayon) throw new Error("RAYON_INVALIDE");

  const { data, error } = await supabase
    .from("arrivages")
    .select("*, rayon:rayons(id, code, nom)")
    .eq("rayon_id", rayon.id);

  if (error) throw error;

  const arrivagesBruts = (data ?? []) as Arrivage[];
  console.log("[RAYON] Arrivages bruts trouvés :", arrivagesBruts);
  const arrivagesActifs = arrivagesBruts.filter((arrivage) =>
    STATUTS_ACTIFS.includes(arrivage.statut as (typeof STATUTS_ACTIFS)[number])
  );
  console.log("[RAYON] Arrivages après filtre statut :", arrivagesActifs);

  return chargerLignes(arrivagesActifs);
}

export async function rechercherCariste(
  type: CaristeSearchType,
  valeur: string
): Promise<ResultatRecherche[]> {
  if (type === "reference") return rechercherParReferenceLM(valeur);
  if (type === "rayon") return rechercherParRayon(valeur);
  return rechercherParCommande(valeur);
}

export function normaliserValeurRecherche(type: CaristeSearchType, valeur: string): string | null {
  if (type === "reference") {
    const reference = valeur.replace(/\s+/g, "");
    return /^\d{8}$/.test(reference) ? reference : null;
  }

  if (type === "rayon") {
    const rayon = valeur.trim().toUpperCase();
    return /^R\d{1,2}$/.test(rayon) ? rayon : null;
  }

  const commande = valeur.trim();
  return commande ? commande : null;
}
