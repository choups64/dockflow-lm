import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createClients(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !anonKey || !serviceRoleKey) throw new Error("Configuration serveur Supabase incomplète.");
  return { auth: createClient(url, anonKey), admin: createClient(url, serviceRoleKey), token };
}

export async function POST(request: NextRequest) {
  try {
    const { auth, admin, token } = createClients(request);
    if (!token) return NextResponse.json({ error: "Session requise." }, { status: 401 });

    const { data: userData, error: userError } = await auth.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: "Session invalide." }, { status: 401 });

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role, magasin_id, actif")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.role !== "CARISTE" || profile.actif === false || !profile.magasin_id) {
      return NextResponse.json({ error: "Accès aux destinations refusé." }, { status: 403 });
    }

    const payload = (await request.json()) as { valeurs?: unknown };
    if (!Array.isArray(payload.valeurs) || payload.valeurs.some((valeur) => typeof valeur !== "string")) {
      return NextResponse.json({ error: "Liste de destinations invalide." }, { status: 400 });
    }
    const valeurs = [...new Set(payload.valeurs as string[])].filter(Boolean);
    if (valeurs.length === 0) return NextResponse.json({ libelles: {} });

    const { data: destinations, error: destinationsError } = await admin
      .from("destinations")
      .select("id, code, nom, magasin_id")
      .or(`magasin_id.eq.${profile.magasin_id},magasin_id.is.null`);
    if (destinationsError) throw destinationsError;

    const libelles = Object.fromEntries(valeurs.map((valeur) => {
      const correspondances = (destinations ?? []).filter((destination) => String(destination.id) === valeur || destination.code === valeur);
      const destination = correspondances.find((item) => item.magasin_id === profile.magasin_id) ?? correspondances[0];
      const libelle = destination?.nom?.trim() || destination?.code?.trim() || "Destination inconnue";
      return [valeur, libelle];
    }));

    return NextResponse.json({ libelles });
  } catch (error) {
    console.error("Échec de la résolution des destinations cariste", error);
    return NextResponse.json({ error: "Impossible de charger les destinations." }, { status: 500 });
  }
}
