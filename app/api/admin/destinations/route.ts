import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type DestinationPayload = {
  code?: string;
  nom?: string;
  magasinId?: string | null;
  actif?: boolean;
};

function createClients(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !anonKey || !serviceRoleKey) throw new Error("Configuration serveur Supabase incomplète.");
  return { auth: createClient(url, anonKey), admin: createClient(url, serviceRoleKey), token };
}

function normalizeDestinationCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const { auth, admin, token } = createClients(request);
    if (!token) throw new Error("Session administrateur requise.");

    const { data: userData, error: userError } = await auth.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Session administrateur invalide.");

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, role, admin_scope, magasin_id, actif")
      .eq("id", userData.user.id)
      .single();
    if (profileError || !profile || profile.role !== "ADMIN" || profile.actif === false) {
      throw new Error("Cette action est réservée aux administrateurs actifs.");
    }

    const payload = (await request.json()) as DestinationPayload;
    const code = normalizeDestinationCode(payload.code ?? "");
    const nom = (payload.nom ?? "").trim().replace(/\s+/g, " ");
    const magasinId = typeof payload.magasinId === "string" && payload.magasinId ? payload.magasinId : null;
    if (!code) throw new Error("Le code de la destination est obligatoire et doit contenir une lettre, un chiffre ou un underscore.");
    if (!nom) throw new Error("Le nom de la destination est obligatoire.");
    if (typeof payload.actif !== "boolean") throw new Error("Le statut de la destination est invalide.");
    if (profile.admin_scope !== "NATIONAL" && magasinId !== profile.magasin_id) {
      throw new Error("Vous ne pouvez créer une destination que dans votre magasin.");
    }

    if (magasinId) {
      const { data: magasin, error: magasinError } = await admin.from("magasins").select("id").eq("id", magasinId).maybeSingle();
      if (magasinError) throw magasinError;
      if (!magasin) throw new Error("Le magasin sélectionné est introuvable.");
    } else if (profile.admin_scope !== "NATIONAL") {
      throw new Error("Seul un administrateur national peut créer une destination nationale.");
    }

    let duplicateQuery = admin.from("destinations").select("id").eq("code", code);
    duplicateQuery = magasinId ? duplicateQuery.eq("magasin_id", magasinId) : duplicateQuery.is("magasin_id", null);
    const { data: duplicates, error: duplicateError } = await duplicateQuery.limit(1);
    if (duplicateError) throw duplicateError;
    if (duplicates?.length) throw new Error("Ce code de destination existe déjà pour ce périmètre.");

    const { data, error } = await admin
      .from("destinations")
      .insert({ code, nom, magasin_id: magasinId, actif: payload.actif })
      .select("id, code, nom, magasin_id, actif")
      .single();
    if (error?.code === "23505") throw new Error("Ce code de destination existe déjà pour ce périmètre.");
    if (error) throw error;

    return NextResponse.json({ ok: true, destination: data, message: "Destination créée avec succès." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur." }, { status: 400 });
  }
}
