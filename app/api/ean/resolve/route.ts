import {
  estEANValide,
  normaliserEAN,
  trouverReferenceDepuisEAN,
} from "@/lib/eanResolver";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ean = normaliserEAN(new URL(request.url).searchParams.get("ean") ?? "");

  if (!estEANValide(ean)) {
    return Response.json(
      {
        success: false,
        ean,
        reason: "EAN_INVALIDE",
        message: "Le code scanné n’est pas un EAN valide.",
      },
      { status: 400 }
    );
  }

  try {
    const resultat = await trouverReferenceDepuisEAN(ean);
    return Response.json(resultat, { status: resultat.success ? 200 : 422 });
  } catch (error) {
    console.error("[EAN] Erreur inattendue :", error);

    return Response.json(
      {
        success: false,
        ean,
        reason: "ERREUR_RESEAU",
        message: "La recherche automatique est temporairement indisponible. Utilisez la recherche par commande.",
      },
      { status: 500 }
    );
  }
}
