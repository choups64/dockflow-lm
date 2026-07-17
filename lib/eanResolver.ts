export type EanResolutionResult =
  | {
      success: true;
      ean: string;
      referenceLM: string;
      productUrl?: string;
    }
  | {
      success: false;
      ean: string;
      reason:
        | "EAN_INVALIDE"
        | "PRODUIT_INTROUVABLE"
        | "ACCES_BLOQUE"
        | "REFERENCE_LM_INTROUVABLE"
        | "ERREUR_RESEAU";
      message: string;
    };

const LONGUEURS_EAN_VALIDES = new Set([8, 13, 14]);

export function normaliserEAN(valeur: string): string {
  return valeur.replace(/[\s-]/g, "");
}

export function estEANValide(ean: string): boolean {
  return /^\d+$/.test(ean) && LONGUEURS_EAN_VALIDES.has(ean.length);
}

function echec(
  ean: string,
  reason: Extract<EanResolutionResult, { success: false }>['reason'],
  message: string
): EanResolutionResult {
  return { success: false, ean, reason, message };
}

function extraireReferenceLM(html: string, ean: string): string | null {
  const expressions = [
    /(?:R[ée]f\.?|R[ée]f[ée]rence(?:\s+produit)?)[^\d]{0,40}(\d{8})(?!\d)/gi,
    /"(?:reference|referenceProduit|productReference)"\s*:\s*"?(\d{8})"?/gi,
  ];

  for (const expression of expressions) {
    for (const correspondance of html.matchAll(expression)) {
      const reference = correspondance[1];

      if (reference && reference !== ean) {
        return reference;
      }
    }
  }

  return null;
}

export async function trouverReferenceDepuisEAN(
  valeurEAN: string
): Promise<EanResolutionResult> {
  const ean = normaliserEAN(valeurEAN);

  if (!estEANValide(ean)) {
    return echec(ean, "EAN_INVALIDE", "Le code scanné n’est pas un EAN valide.");
  }

  const searchUrl = `https://www.leroymerlin.fr/search?q=${encodeURIComponent(ean)}`;

  console.log(`[EAN] Code reçu : ${ean}`);
  console.log("[EAN] Recherche Leroy Merlin lancée");

  let response: Response;

  try {
    response = await fetch(searchUrl, { redirect: "follow" });
  } catch (error) {
    console.error("[EAN] Erreur réseau :", error);
    return echec(
      ean,
      "ERREUR_RESEAU",
      "La recherche automatique est temporairement indisponible. Utilisez la recherche par commande."
    );
  }

  console.log(`[EAN] Statut HTTP : ${response.status}`);

  if (response.status === 403) {
    console.log("[EAN] Résolution impossible : ACCES_BLOQUE");
    return echec(
      ean,
      "ACCES_BLOQUE",
      "La recherche automatique est temporairement indisponible. Utilisez la recherche par commande."
    );
  }

  if (response.status === 404) {
    return echec(ean, "PRODUIT_INTROUVABLE", "Aucun produit n’a été trouvé pour ce code EAN.");
  }

  if (!response.ok) {
    return echec(
      ean,
      "ERREUR_RESEAU",
      "La recherche automatique est temporairement indisponible. Utilisez la recherche par commande."
    );
  }

  const html = await response.text();
  const referenceLM = extraireReferenceLM(html, ean);

  if (!referenceLM) {
    console.log("[EAN] Résolution impossible : REFERENCE_LM_INTROUVABLE");
    return echec(
      ean,
      "REFERENCE_LM_INTROUVABLE",
      "Le produit a été trouvé, mais sa référence LM n’a pas pu être identifiée."
    );
  }

  console.log(`[EAN] Référence LM détectée : ${referenceLM}`);

  return {
    success: true,
    ean,
    referenceLM,
    productUrl: response.url,
  };
}
