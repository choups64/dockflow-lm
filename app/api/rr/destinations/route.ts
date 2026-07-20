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

export async function GET(request: NextRequest) {
  try {
    const { auth, admin, token } = createClients(request);
    if (!token) return NextResponse.json({ error: "Session requise." }, { status: 401 });

    const { data: userData, error: userError } = await auth.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: "Session invalide." }, { status: 401 });

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, role, magasin_id, actif")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.actif === false || !["RR", "ADMIN"].includes(profile.role) || !profile.magasin_id) {
      return NextResponse.json({ error: "Accès aux destinations refusé." }, { status: 403 });
    }

    const arrivageId = request.nextUrl.searchParams.get("arrivageId");
    const destinationsHistoriques = new Set<string>();
    if (arrivageId) {
      const { data: arrivage, error: arrivageError } = await admin
        .from("arrivages")
        .select("id, rayon_id, magasin_id")
        .eq("id", arrivageId)
        .maybeSingle();
      if (arrivageError) throw arrivageError;
      if (!arrivage) return NextResponse.json({ error: "Arrivage introuvable." }, { status: 404 });
      if (arrivage.magasin_id !== profile.magasin_id) return NextResponse.json({ error: "Accès à cet arrivage refusé." }, { status: 403 });

      if (profile.role === "RR") {
        const { data: affectation, error: affectationError } = await admin
          .from("profile_rayons")
          .select("rayon_id")
          .eq("profile_id", profile.id)
          .eq("rayon_id", arrivage.rayon_id)
          .maybeSingle();
        if (affectationError) throw affectationError;
        if (!affectation) return NextResponse.json({ error: "Accès à cet arrivage refusé." }, { status: 403 });
      }

      const { data: lignes, error: lignesError } = await admin
        .from("arrivage_lignes")
        .select("destination")
        .eq("arrivage_id", arrivage.id);
      if (lignesError) throw lignesError;
      for (const ligne of lignes ?? []) if (ligne.destination) destinationsHistoriques.add(String(ligne.destination));
    }

    const { data: destinations, error: destinationsError } = await admin
      .from("destinations")
      .select("id, code, nom, magasin_id, actif")
      .or(`magasin_id.eq.${profile.magasin_id},magasin_id.is.null`)
      .order("nom", { ascending: true });
    if (destinationsError) throw destinationsError;

    const autorisees = (destinations ?? []).filter((destination) =>
      destination.actif ||
      destinationsHistoriques.has(String(destination.id)) ||
      destinationsHistoriques.has(destination.code)
    );
    return NextResponse.json({ destinations: autorisees });
  } catch (error) {
    console.error("Échec du chargement des destinations RR", error);
    return NextResponse.json({ error: "Impossible de charger les destinations." }, { status: 500 });
  }
}
